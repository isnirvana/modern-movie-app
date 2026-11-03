// src/utils/favourites.ts
// Titles the viewer said they love (the For You taste picker), kept in this browser per profile.
// They count as strong seeds for recommendations until real watching takes over (utils/recommend.ts).

import { profileKey } from "./profiles"

export type Favourite = {
  type: "movie" | "tv"
  id: number
  title: string
  poster_path?: string | null
  pickedAt: number // ms timestamp
}

const STORAGE_KEY = "lumo:favourites" // per profile (see profiles.ts)
const CHANGE_EVENT = "lumo:favourites-change"

// Cache so repeated reads return the same array (needed by useSyncExternalStore)
let cachedRaw: string | null = null
let cachedItems: Favourite[] = []

export function getFavourites(): Favourite[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(profileKey(STORAGE_KEY))
  } catch {
    // Storage blocked (private mode etc.) — behave as empty
  }
  if (raw === cachedRaw) return cachedItems
  cachedRaw = raw
  try {
    cachedItems = raw ? (JSON.parse(raw) as Favourite[]) : []
  } catch {
    cachedItems = []
  }
  return cachedItems
}

export function setFavourites(items: Omit<Favourite, "pickedAt">[]) {
  const before = new Map(getFavourites().map((f) => [`${f.type}-${f.id}`, f.pickedAt]))
  const now = Date.now()
  // Titles kept from last time keep their date (so editing the picks doesn't make old ones count as new)
  const next = items.map((f) => ({ ...f, pickedAt: before.get(`${f.type}-${f.id}`) ?? now }))
  try {
    localStorage.setItem(profileKey(STORAGE_KEY), JSON.stringify(next))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeFavourites(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === profileKey(STORAGE_KEY) && callback()
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage) // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}
