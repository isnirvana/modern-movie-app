// src/utils/watchHistory.ts
// Watch progress, kept in this browser only (no account needed).
// Filled from the players' progress events (Cinezo, CineSrc); powers Continue Watching and Resume.

export type MediaType = "movie" | "tv"

export type HistoryEntry = {
  type: MediaType
  id: number
  title: string
  poster?: string | null
  backdrop?: string | null
  season?: number
  episode?: number
  time: number // seconds watched
  duration: number // seconds
  updatedAt: number // ms timestamp
}

const STORAGE_KEY = "lumo:history"
const CHANGE_EVENT = "lumo:history-change"
const MAX_ENTRIES = 50
// Past this point a title counts as finished
const FINISHED_RATIO = 0.95

const keyOf = (type: MediaType, id: number) => `${type}-${id}`

// Cache so repeated reads return the same object (needed by useSyncExternalStore)
let cachedRaw: string | null = null
let cachedEntries: HistoryEntry[] = []

export function getHistory(): HistoryEntry[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode etc.) — behave as empty
  }
  if (raw === cachedRaw) return cachedEntries
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as Record<string, HistoryEntry>) : {}
    cachedEntries = Object.values(parsed).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    cachedEntries = []
  }
  return cachedEntries
}

function write(entries: HistoryEntry[]) {
  const map: Record<string, HistoryEntry> = {}
  for (const e of entries.slice(0, MAX_ENTRIES)) map[keyOf(e.type, e.id)] = e
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getEntry(type: MediaType, id: number) {
  return getHistory().find((e) => e.type === type && e.id === id)
}

export const isFinished = (e: Pick<HistoryEntry, "time" | "duration">) =>
  e.duration > 0 && e.time / e.duration >= FINISHED_RATIO

export function saveProgress(entry: Omit<HistoryEntry, "updatedAt">) {
  if (!entry.duration || entry.duration <= 0) return
  // Ignore the first seconds (and the 0:00 "play" event sent before a resume seek), so they never overwrite real progress
  if (entry.time < 5) return
  const others = getHistory().filter((e) => !(e.type === entry.type && e.id === entry.id))

  // A finished movie leaves Continue Watching; a finished episode stays so the show can be picked up again
  if (entry.type === "movie" && isFinished(entry)) {
    write(others)
    return
  }
  write([{ ...entry, updatedAt: Date.now() }, ...others])
}

// After an episode ends, point the show at the next episode (shown as "Up next", starts from 0:00)
export function markUpNext(entry: Omit<HistoryEntry, "updatedAt" | "time" | "duration">) {
  const others = getHistory().filter((e) => !(e.type === entry.type && e.id === entry.id))
  write([{ ...entry, time: 0, duration: 0, updatedAt: Date.now() }, ...others])
}

export function removeEntry(type: MediaType, id: number) {
  write(getHistory().filter((e) => !(e.type === type && e.id === id)))
}

// Where to start playback: the saved spot, unless it's barely started or already finished
export function resumeTime(entry?: HistoryEntry, season?: number, episode?: number) {
  if (!entry) return 0
  if (entry.type === "tv" && (entry.season !== season || entry.episode !== episode)) return 0
  if (entry.time < 30 || isFinished(entry)) return 0
  return Math.floor(entry.time)
}

export function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && callback()
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage) // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}

// 754 → "12:34", 3774 → "1:02:54"
export function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}
