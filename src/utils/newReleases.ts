// src/utils/newReleases.ts
// New-episode and now-released checks behind notifications. Runs in the service worker (sw.ts), which
// can't read localStorage, so the app hands it the titles to watch through a small Cache Storage record.

import { releaseDateOf, todayISO } from "./media"

export type Tracked = { type: "movie" | "tv"; id: number; title: string }

type State = {
  enabled: boolean
  tracked: Tracked[]
  // What each title looked like at the last check: a show's latest aired episode ("S2E5", "none"),
  // a movie's "released" / "upcoming"
  seen: Record<string, string>
  lastCheck: number // ms timestamp
}

export type Found = { tag: string; title: string; body: string; url: string }

// Periodic Background Sync tag the app registers and the worker answers
export const CHECK_TAG = "lumo-new-releases"

const CACHE = "lumo-notify"
const STATE_URL = "/__lumo/notify-state"
const EMPTY: State = { enabled: false, tracked: [], seen: {}, lastCheck: 0 }

// Checks run at most this often (unless forced)
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000
const PARALLEL = 5

export async function readState(): Promise<State> {
  try {
    const res = await (await caches.open(CACHE)).match(STATE_URL)
    return res ? { ...EMPTY, ...(await res.json()) } : EMPTY
  } catch {
    return EMPTY
  }
}

// Read-modify-write, so the app (tracked list) and the worker (seen) don't undo each other's changes
export async function updateState(change: (s: State) => Partial<State>) {
  const state = await readState()
  const next = { ...state, ...change(state) }
  const cache = await caches.open(CACHE)
  await cache.put(STATE_URL, new Response(JSON.stringify(next), { headers: { "Content-Type": "application/json" } }))
}

const keyOf = (t: Tracked) => `${t.type}-${t.id}`

// What the title looks like now, and what to say if that's news
async function look(t: Tracked, apiKey: string, before?: string): Promise<{ now: string; found?: Found } | null> {
  const res = await fetch(`https://api.themoviedb.org/3/${t.type}/${t.id}?api_key=${apiKey}`)
  if (!res.ok) return null
  const data = await res.json()

  if (t.type === "tv") {
    const last = data.last_episode_to_air
    const now = last ? `S${last.season_number}E${last.episode_number}` : "none"
    // No `before` means we just started watching this show: remember it, nothing to announce
    if (!before || before === now || !last) return { now }
    const episode = `S${last.season_number} E${last.episode_number}${last.name ? ` · ${last.name}` : ""}`
    return {
      now,
      found: {
        tag: keyOf(t),
        title: before === "none" ? `${t.title} has premiered` : `New episode of ${t.title}`,
        body: `${episode} is out now`,
        url: `/tv/${t.id}`,
      },
    }
  }

  const date = releaseDateOf(data)
  const now = date && date <= todayISO() ? "released" : "upcoming"
  if (before !== "upcoming" || now !== "released") return { now }
  return { now, found: { tag: keyOf(t), title: `${t.title} is out now`, body: "Tap to watch it on Lumoflix", url: `/movie/${t.id}` } }
}

// Looks up every tracked title and returns what's new since the last check
export async function checkNewReleases(apiKey: string, force = false): Promise<Found[]> {
  const state = await readState()
  if (!state.enabled || !state.tracked.length) return []
  if (!force && Date.now() - state.lastCheck < CHECK_EVERY_MS) return []

  const seen: Record<string, string> = {}
  const found: Found[] = []
  for (let i = 0; i < state.tracked.length; i += PARALLEL) {
    const batch = state.tracked.slice(i, i + PARALLEL)
    const results = await Promise.all(batch.map((t) => look(t, apiKey, state.seen[keyOf(t)]).catch(() => null)))
    results.forEach((r, j) => {
      if (!r) return
      seen[keyOf(batch[j])] = r.now
      if (r.found) found.push(r.found)
    })
  }

  // Forget titles no longer tracked, so re-adding one later starts fresh
  await updateState((s) => {
    const kept = new Set(s.tracked.map(keyOf))
    const merged = Object.fromEntries(Object.entries({ ...s.seen, ...seen }).filter(([k]) => kept.has(k)))
    return { seen: merged, lastCheck: Date.now() }
  })
  return found
}
