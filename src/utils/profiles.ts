// src/utils/profiles.ts
// Viewer profiles on this device ("Me", "Kids", …), each with its own My List, history and searches.
// The first profile keeps the original storage keys, so data from before profiles existed stays with it.

// `pin`: hash of the profile lock's PIN, when it has one. `avatar`: the TMDB photo it picked (an actor's or
// director's image path), shown instead of the colour and initial.
export type Profile = { id: string; name: string; color: string; kids: boolean; pin?: string; avatar?: string }

type State = { list: Profile[]; active: string }

const STORAGE_KEY = "lumo:profiles"
const CHANGE_EVENT = "lumo:profiles-change"

export const MAIN_ID = "main"
export const MAX_PROFILES = 5
export const PROFILE_COLORS = ["#6c63ff", "#f72585", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"]

const DEFAULT: State = { list: [{ id: MAIN_ID, name: "Me", color: PROFILE_COLORS[0], kids: false }], active: MAIN_ID }

// Cache so repeated reads return the same object (needed by useSyncExternalStore)
let cachedRaw: string | null = null
let cachedState: State = DEFAULT

export function getProfilesState(): State {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode etc.) — just the default profile
  }
  if (raw === cachedRaw) return cachedState
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as State) : DEFAULT
    cachedState = parsed.list?.length ? parsed : DEFAULT
  } catch {
    cachedState = DEFAULT
  }
  return cachedState
}

function write(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const getActiveProfile = () => {
  const { list, active } = getProfilesState()
  return list.find((p) => p.id === active) ?? list[0]
}

export const isKidsMode = () => getActiveProfile().kids

// The storage key for this profile's copy of some data, e.g. "lumo:my-list" → "lumo:my-list:p-x7k2"
export function profileKey(base: string) {
  const id = getActiveProfile().id
  return id === MAIN_ID ? base : `${base}:${id}`
}

export function addProfile(name: string, kids: boolean, color: string, avatar?: string): Profile {
  const state = getProfilesState()
  const profile = { id: `p-${Date.now().toString(36)}`, name, color, kids, ...(avatar && { avatar }) }
  write({ ...state, list: [...state.list, profile] })
  return profile
}

export function updateProfile(id: string, changes: Partial<Omit<Profile, "id">>) {
  const state = getProfilesState()
  write({ ...state, list: state.list.map((p) => (p.id === id ? { ...p, ...changes } : p)) })
}

// Removes everything saved under a profile (its keys end in ":<id>")
function forgetProfileData(id: string) {
  try {
    const suffix = `:${id}`
    Object.keys(localStorage)
      .filter((k) => k.startsWith("lumo:") && k.endsWith(suffix))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // Storage blocked — nothing to clean up
  }
}

// Deletes a profile and everything saved under it. The first profile can't be deleted.
export function deleteProfile(id: string) {
  if (id === MAIN_ID) return
  const state = getProfilesState()
  forgetProfileData(id)
  write({ list: state.list.filter((p) => p.id !== id), active: state.active === id ? MAIN_ID : state.active })
}

// Sync (utils/sync.ts): swaps in the account's profiles. Returns false when the profile in use is gone
// (deleted on another device): the app then has to restart on the first profile.
export function replaceProfiles(list: Profile[]) {
  if (!list.length) return true
  const state = getProfilesState()
  state.list.filter((p) => p.id !== MAIN_ID && !list.some((q) => q.id === p.id)).forEach((p) => forgetProfileData(p.id))
  const stillThere = list.some((p) => p.id === state.active)
  write({ list, active: stillThere ? state.active : list[0].id })
  return stillThere
}

// Switches profile and restarts the app on Home, so nothing from the previous profile stays loaded
export function switchProfile(id: string) {
  write({ ...getProfilesState(), active: id })
  window.location.assign("/")
}

export function subscribeProfiles(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && callback()
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage) // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}

// --- Profile lock: a profile with a PIN asks for it before it opens, or before it's edited from another profile ---
// It's a lock against others on the device (kids especially), not real security: clearing site data removes it.

async function hashPin(id: string, pin: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`lumo-pin:${id}:${pin}`))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("")
}

// Sets the profile's PIN, or removes its lock with null
export async function setProfilePin(id: string, pin: string | null) {
  updateProfile(id, { pin: pin ? await hashPin(id, pin) : undefined })
}

export const checkProfilePin = async (profile: Profile, pin: string) =>
  !profile.pin || (await hashPin(profile.id, pin)) === profile.pin
