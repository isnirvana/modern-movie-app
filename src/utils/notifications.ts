// src/utils/notifications.ts
// New-episode notifications, app side: turning them on and off, and keeping the service worker's list of
// titles to watch in step with My List and Continue Watching. The checks themselves run in the worker.

import { getMyList } from "./myList"
import { getHistory } from "./watchHistory"
import { updateState, CHECK_TAG, type Tracked } from "./newReleases"

const ENABLED_KEY = "lumo:notify"
const MAX_TRACKED = 40
// Shows from Continue Watching to follow (most recent first)
const HISTORY_SHOWS = 20
// Movies in My List are followed until this long after release (so the release itself is caught)
const MOVIE_GRACE_DAYS = 30
const BACKGROUND_EVERY_MS = 12 * 60 * 60 * 1000

export const notificationsSupported = () =>
  "Notification" in window && "serviceWorker" in navigator && "caches" in window

export function notificationsOn() {
  try {
    return notificationsSupported() && Notification.permission === "granted" && localStorage.getItem(ENABLED_KEY) === "1"
  } catch {
    return false
  }
}

const daysAgoISO = (days: number) => new Date(Date.now() - days * 86_400_000).toLocaleDateString("en-CA")

// Every show in My List or Continue Watching, and My List movies not out yet (or only just out)
function trackedTitles(): Tracked[] {
  const since = daysAgoISO(MOVIE_GRACE_DAYS)
  const fromList = getMyList()
    .filter((i) => i.type === "tv" || !i.release_date || i.release_date >= since)
    .map(({ type, id, title }) => ({ type, id, title }))
  const fromHistory = getHistory()
    .filter((e) => e.type === "tv")
    .slice(0, HISTORY_SHOWS)
    .map(({ type, id, title }) => ({ type, id, title }))

  const keys = new Set<string>()
  return [...fromList, ...fromHistory]
    .filter((t) => !keys.has(`${t.type}-${t.id}`) && !!keys.add(`${t.type}-${t.id}`))
    .slice(0, MAX_TRACKED)
}

// Hands the worker the current list (skipped when nothing changed, as progress saves fire often)
let lastSynced = ""
export async function syncTracked() {
  const record = { enabled: notificationsOn(), tracked: trackedTitles() }
  const json = JSON.stringify(record)
  if (json === lastSynced) return
  lastSynced = json
  await updateState(() => record).catch(() => {})
}

// Asks the worker to look for news (it skips this if it looked recently, unless `force`)
export async function requestCheck(force = false) {
  const reg = await navigator.serviceWorker.getRegistration()
  reg?.active?.postMessage({ type: "lumo:check", force })
}

// Background checks while the app is closed: Chrome/Edge, once the app is installed
export async function registerBackgroundChecks() {
  const reg: any = await navigator.serviceWorker.getRegistration()
  if (!reg?.periodicSync) return
  try {
    const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName })
    if (status.state === "granted") await reg.periodicSync.register(CHECK_TAG, { minInterval: BACKGROUND_EVERY_MS })
  } catch {
    // Not allowed here — checks still run whenever the app opens
  }
}

export async function enableNotifications(): Promise<boolean> {
  if ((await Notification.requestPermission()) !== "granted") return false
  try {
    localStorage.setItem(ENABLED_KEY, "1")
  } catch {
    return false
  }
  await syncTracked()
  await registerBackgroundChecks()
  // Notes where each show is now, so only episodes that come out from here on are announced
  await requestCheck(true)
  return true
}

export async function disableNotifications() {
  try {
    localStorage.removeItem(ENABLED_KEY)
  } catch {
    // Storage blocked — the worker is still told below
  }
  await syncTracked()
  const reg: any = await navigator.serviceWorker.getRegistration()
  await reg?.periodicSync?.unregister(CHECK_TAG).catch(() => {})
}
