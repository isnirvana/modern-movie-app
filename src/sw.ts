// src/sw.ts
// The service worker: offline app shell and caches, plus new-episode notifications (see utils/newReleases.ts)
/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, type PrecacheEntry } from "workbox-precaching"
import { registerRoute, NavigationRoute } from "workbox-routing"
import { CacheFirst, NetworkFirst } from "workbox-strategies"
import { ExpirationPlugin } from "workbox-expiration"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { checkNewReleases, CHECK_TAG } from "./utils/newReleases"

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] }

// Periodic Background Sync (Chrome/Edge, installed app) isn't in TS's lib yet
interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string
}

// New versions take over straight away (registerType: "autoUpdate")
self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: serve the app shell for any page URL when offline. Crawler files load as themselves.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/, /^\/google.*\.html$/],
  })
)

// Posters & backdrops rarely change — serve from cache first
registerRoute(
  /^https:\/\/image\.tmdb\.org\/.*/i,
  new CacheFirst({
    cacheName: "tmdb-images",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
)

// Movie data — fresh when online, last copy when offline or on a slow connection.
// Kept a week so pages already visited can be browsed offline.
registerRoute(
  /^https:\/\/api\.themoviedb\.org\/.*/i,
  new NetworkFirst({
    cacheName: "tmdb-api",
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
)

registerRoute(
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

// --- New-episode notifications ---

async function notifyNewReleases(force: boolean) {
  const found = await checkNewReleases(import.meta.env.VITE_TMDB_API_KEY, force)
  for (const f of found) {
    await self.registration
      .showNotification(f.title, { body: f.body, tag: f.tag, icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", data: { url: f.url } })
      .catch(() => {}) // permission withdrawn
  }
  if (found.length && "setAppBadge" in self.navigator) await self.navigator.setAppBadge(found.length).catch(() => {})
}

// The app asks for a check when it opens ({ force } right after notifications are turned on, to note where each show is)
self.addEventListener("message", (event) => {
  if (event.data?.type === "lumo:check") event.waitUntil(notifyNewReleases(!!event.data.force))
})

// Background checks, where the browser supports them
self.addEventListener("periodicsync", ((event: PeriodicSyncEvent) => {
  if (event.tag === CHECK_TAG) event.waitUntil(notifyNewReleases(false))
}) as EventListener)

// Tapping a notification opens its title: in the app window if one is open (its router moves there), else a new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const path: string = event.notification.data?.url ?? "/"
  event.waitUntil(
    (async () => {
      const [open] = await self.clients.matchAll({ type: "window" })
      if (open) {
        await open.focus()
        open.postMessage({ type: "lumo:open", path })
      } else {
        await self.clients.openWindow(path)
      }
    })()
  )
})
