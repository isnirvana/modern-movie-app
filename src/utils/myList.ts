// src/utils/myList.ts
// Titles saved with "+ My List", kept in this browser only (no account needed)

export type MediaType = "movie" | "tv"

export type ListItem = {
  type: MediaType
  id: number
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  release_date?: string // movies
  first_air_date?: string // TV
  addedAt: number // ms timestamp
}

const STORAGE_KEY = "lumo:my-list"
const CHANGE_EVENT = "lumo:my-list-change"

// Cache so repeated reads return the same array (needed by useSyncExternalStore)
let cachedRaw: string | null = null
let cachedItems: ListItem[] = []

export function getMyList(): ListItem[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode etc.) — behave as empty
  }
  if (raw === cachedRaw) return cachedItems
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as ListItem[]) : []
    cachedItems = parsed.sort((a, b) => b.addedAt - a.addedAt)
  } catch {
    cachedItems = []
  }
  return cachedItems
}

function write(items: ListItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const isInMyList = (type: MediaType, id: number) =>
  getMyList().some((i) => i.type === type && i.id === id)

export function addToMyList(item: Omit<ListItem, "addedAt">) {
  const rest = getMyList().filter((i) => !(i.type === item.type && i.id === item.id))
  write([{ ...item, addedAt: Date.now() }, ...rest])
}

export function removeFromMyList(type: MediaType, id: number) {
  write(getMyList().filter((i) => !(i.type === type && i.id === id)))
}

export function subscribeMyList(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && callback()
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage) // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}
