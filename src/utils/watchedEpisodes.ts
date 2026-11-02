// src/utils/watchedEpisodes.ts
// Episodes watched to the end, per show, kept in this browser only (no account needed).
// Separate from watch history, which only keeps the latest episode per show.

const STORAGE_KEY = "lumo:watched"
const CHANGE_EVENT = "lumo:watched-change"

// { "1399": ["1-1", "1-2"] }: show id → "season-episode" keys
type Watched = Record<string, string[]>

export const episodeKey = (season: number, episode: number) => `${season}-${episode}`

// Cache so repeated reads return the same object (needed by useSyncExternalStore)
let cachedRaw: string | null = null
let cachedWatched: Watched = {}

export function getWatched(): Watched {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode etc.) — behave as empty
  }
  if (raw === cachedRaw) return cachedWatched
  cachedRaw = raw
  try {
    cachedWatched = raw ? (JSON.parse(raw) as Watched) : {}
  } catch {
    cachedWatched = {}
  }
  return cachedWatched
}

export function markEpisodeWatched(showId: number, season: number, episode: number) {
  const all = getWatched()
  const key = episodeKey(season, episode)
  const show = all[showId] ?? []
  if (show.includes(key)) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [showId]: [...show, key] }))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeWatched(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && callback()
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage) // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}
