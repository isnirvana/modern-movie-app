// src/utils/recentSearches.ts
// The last few searches the viewer acted on (opened a result or pressed Enter), newest first, kept in this browser only

const STORAGE_KEY = "lumo:recent-searches"
const CHANGE_EVENT = "lumo:recent-searches-change"
const MAX_SEARCHES = 8

// Cache so repeated reads return the same array (needed by useSyncExternalStore)
let cachedRaw: string | null = null
let cachedSearches: string[] = []

export function getRecentSearches(): string[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode etc.) — behave as empty
  }
  if (raw === cachedRaw) return cachedSearches
  cachedRaw = raw
  try {
    const parsed = raw ? JSON.parse(raw) : []
    cachedSearches = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : []
  } catch {
    cachedSearches = []
  }
  return cachedSearches
}

function write(searches: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_SEARCHES)))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function addRecentSearch(query: string) {
  const q = query.trim()
  if (q.length < 2) return
  write([q, ...getRecentSearches().filter((s) => !same(s, q))])
}

export function removeRecentSearch(query: string) {
  write(getRecentSearches().filter((s) => !same(s, query)))
}

export const clearRecentSearches = () => write([])

export function subscribeRecentSearches(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && callback()
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage) // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}
