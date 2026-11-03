// src/utils/sync.ts
// Accounts & sync. The app stays local-first: every store keeps working in localStorage, signed in or not.
// While signed in, each kind of data is synced with its Supabase table (supabase/schema.sql):
//   push: local rows are compared with a snapshot of what was last synced, and only the difference is sent
//         (so changes made offline, or before a reload, still go up next time);
//   pull: the account's rows then replace the local copy (so deletions on other devices come through too).
// Profiles sync as a list; My List, Continue Watching and watched episodes for the profile in use.

import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { getMyList, replaceMyList, subscribeMyList, type ListItem } from "./myList"
import { getHistory, replaceHistory, subscribe as subscribeHistory, type HistoryEntry } from "./watchHistory"
import { getWatched, replaceWatched, subscribeWatched, type Watched } from "./watchedEpisodes"
import { getActiveProfile, getProfilesState, replaceProfiles, subscribeProfiles, MAIN_ID, type Profile } from "./profiles"
import { notificationsOn, switchToPushIfSignedIn } from "./notifications"
import { removePushSubscription } from "./push"

type Row = Record<string, any>

// One kind of synced data: how its local copy maps to rows of its table
type Kind = {
  table: string
  perProfile: boolean
  keyColumns: string[] // what identifies a row, besides user_id (and profile_id)
  local(): Row[]
  apply(rows: Row[]): void // replace the local copy
  subscribe(callback: () => void): () => void
}

const orNull = (v: unknown) => v ?? null
const orUndefined = <T>(v: T | null) => v ?? undefined

const PROFILES: Kind = {
  table: "profiles",
  perProfile: false,
  keyColumns: ["id"],
  local: () =>
    getProfilesState().list.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      kids: p.kids,
      pin: orNull(p.pin),
      avatar: orNull(p.avatar), // supabase/avatars.sql
    })),
  apply: (rows) => {
    // The first profile first, then in order of creation (ids are timestamps)
    const list: Profile[] = rows
      .map((r) => ({ id: r.id, name: r.name, color: r.color, kids: r.kids, pin: orUndefined(r.pin), avatar: orUndefined(r.avatar) }))
      .sort((a, b) => (a.id === MAIN_ID ? -1 : b.id === MAIN_ID ? 1 : a.id.localeCompare(b.id)))
    // The profile in use was deleted on another device: start over on the first profile
    if (!replaceProfiles(list)) window.location.assign("/")
  },
  subscribe: subscribeProfiles,
}

const MY_LIST: Kind = {
  table: "my_list",
  perProfile: true,
  keyColumns: ["type", "tmdb_id"],
  local: () =>
    getMyList().map((i) => ({
      type: i.type,
      tmdb_id: i.id,
      title: i.title,
      poster_path: orNull(i.poster_path),
      backdrop_path: orNull(i.backdrop_path),
      vote_average: orNull(i.vote_average),
      release_date: orNull(i.release_date),
      first_air_date: orNull(i.first_air_date),
      added_at: i.addedAt,
    })),
  apply: (rows) =>
    replaceMyList(
      rows.map(
        (r): ListItem => ({
          type: r.type,
          id: r.tmdb_id,
          title: r.title,
          poster_path: r.poster_path,
          backdrop_path: r.backdrop_path,
          vote_average: orUndefined(r.vote_average),
          release_date: orUndefined(r.release_date),
          first_air_date: orUndefined(r.first_air_date),
          addedAt: Number(r.added_at),
        })
      )
    ),
  subscribe: subscribeMyList,
}

const HISTORY: Kind = {
  table: "watch_history",
  perProfile: true,
  keyColumns: ["type", "tmdb_id"],
  local: () =>
    getHistory().map((e) => ({
      type: e.type,
      tmdb_id: e.id,
      title: e.title,
      poster: orNull(e.poster),
      backdrop: orNull(e.backdrop),
      season: orNull(e.season),
      episode: orNull(e.episode),
      time: e.time,
      duration: e.duration,
      updated_at: e.updatedAt,
    })),
  apply: (rows) =>
    replaceHistory(
      rows.map(
        (r): HistoryEntry => ({
          type: r.type,
          id: r.tmdb_id,
          title: r.title,
          poster: r.poster,
          backdrop: r.backdrop,
          season: orUndefined(r.season),
          episode: orUndefined(r.episode),
          time: r.time,
          duration: r.duration,
          updatedAt: Number(r.updated_at),
        })
      )
    ),
  subscribe: subscribeHistory,
}

const WATCHED: Kind = {
  table: "watched_episodes",
  perProfile: true,
  keyColumns: ["show_id", "season", "episode"],
  local: () =>
    Object.entries(getWatched()).flatMap(([show, episodes]) =>
      episodes.map((key) => {
        const [season, episode] = key.split("-").map(Number)
        return { show_id: Number(show), season, episode }
      })
    ),
  apply: (rows) => {
    const watched: Watched = {}
    for (const r of rows) (watched[r.show_id] ??= []).push(`${r.season}-${r.episode}`)
    replaceWatched(watched)
  },
  subscribe: subscribeWatched,
}

const PER_PROFILE = [MY_LIST, HISTORY, WATCHED]

// --- Snapshots of what was last synced, per account / table / profile ---

type Snapshot = Record<string, string> // row key → the row as JSON

const rowKey = (kind: Kind, row: Row) => kind.keyColumns.map((c) => row[c]).join("|")
const toSnapshot = (kind: Kind, rows: Row[]): Snapshot =>
  Object.fromEntries(rows.map((r) => [rowKey(kind, r), JSON.stringify(r)]))

// Ends with the profile id, so deleting a profile (profiles.ts) clears its snapshots too
const snapshotKey = (uid: string, kind: Kind, profileId: string) =>
  `lumo:sync:${uid}:${kind.table}${kind.perProfile ? `:${profileId}` : ""}`

function readSnapshot(key: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSnapshot(key: string, snapshot: Snapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot))
  } catch {
    // Storage full or blocked — everything is just sent again next time
  }
}

// --- Push & pull ---

async function push(kind: Kind, uid: string, profileId: string) {
  const db = supabase!
  const key = snapshotKey(uid, kind, profileId)
  const before = readSnapshot(key) // null: first sync of this data on this device
  const now = toSnapshot(kind, kind.local())
  const owner = { user_id: uid, ...(kind.perProfile ? { profile_id: profileId } : {}) }

  const changed = Object.keys(now).filter((k) => now[k] !== before?.[k])
  if (changed.length) {
    const rows = changed.map((k) => ({ ...JSON.parse(now[k]), ...owner }))
    // A first sync merges into the account. For profiles, the account's version of one it already has wins
    // (e.g. its "Me" keeps the name it was given on another device).
    const { error } = await db.from(kind.table).upsert(rows, { ignoreDuplicates: !before && !kind.perProfile })
    if (error) throw error
  }

  for (const k of Object.keys(before ?? {}).filter((k) => !(k in now))) {
    const row = JSON.parse(before![k])
    let query = db.from(kind.table).delete().match(owner)
    for (const c of kind.keyColumns) query = query.eq(c, row[c])
    const { error } = await query
    if (error) throw error
  }

  writeSnapshot(key, now)
}

async function pull(kind: Kind, uid: string, profileId: string) {
  let query = supabase!.from(kind.table).select("*")
  if (kind.perProfile) query = query.eq("profile_id", profileId)
  const { data, error } = await query
  if (error) throw error

  // Changed locally while this was loading: keep that, it goes up on the next sync
  const key = snapshotKey(uid, kind, profileId)
  if (JSON.stringify(toSnapshot(kind, kind.local())) !== JSON.stringify(readSnapshot(key) ?? {})) {
    syncAgain = true
    return
  }
  // The stores announce the change; that's not a local edit to send back up
  applying = true
  try {
    kind.apply(data ?? [])
  } finally {
    applying = false
  }
  writeSnapshot(key, toSnapshot(kind, kind.local()))
}

// --- Session & scheduling ---

let session: Session | null = null
// False until Supabase has said whether there's a saved session (so nothing shows "Sign in" to a signed-in viewer)
let sessionKnown = false
const sessionListeners = new Set<() => void>()

export const getSession = () => session
export const isSessionKnown = () => sessionKnown
export function subscribeSession(callback: () => void) {
  sessionListeners.add(callback)
  return () => sessionListeners.delete(callback)
}

let running: Promise<void> | null = null
let syncAgain = false
let applying = false
let timer: ReturnType<typeof setTimeout> | undefined

// Sends local changes, then (unless `pushOnly`) brings in the account's copy
export function syncNow(pushOnly = false): Promise<void> {
  if (!supabase || !session) return Promise.resolve()
  if (running) {
    syncAgain = true
    return running
  }
  const uid = session.user.id
  running = (async () => {
    try {
      await push(PROFILES, uid, "")
      if (!pushOnly) await pull(PROFILES, uid, "")
      const profileId = getActiveProfile().id
      for (const kind of PER_PROFILE) {
        await push(kind, uid, profileId)
        if (!pushOnly) await pull(kind, uid, profileId)
      }
    } catch (e) {
      console.warn("Sync failed; will retry", e)
    } finally {
      running = null
      if (syncAgain) {
        syncAgain = false
        scheduleSync()
      }
    }
  })()
  return running
}

// Local changes go up at most this often, batched (progress saves come every few seconds while watching)
const PUSH_EVERY_MS = 10_000
export function scheduleSync() {
  if (timer) return
  timer = setTimeout(() => {
    timer = undefined
    syncNow(true)
  }, PUSH_EVERY_MS)
}

// Starts syncing for the app's lifetime (called once, from Layout)
let started = false
export function startSync() {
  if (!supabase || started) return
  started = true

  supabase.auth.onAuthStateChange((event, s) => {
    session = s
    sessionKnown = true
    sessionListeners.forEach((l) => l())
    if (s && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
      // Then (profiles being on the server) hand notifications to the server for the profile in use
      syncNow().then(() => notificationsOn() && switchToPushIfSignedIn())
    }
  })
  for (const kind of [PROFILES, ...PER_PROFILE]) kind.subscribe(() => session && !applying && scheduleSync())
  // Catch up when the app comes back, send what's pending when it goes away
  document.addEventListener("visibilitychange", () => session && syncNow(document.visibilityState === "hidden"))
}

// --- Account actions ---

// Emails a sign-in link and a 6-digit code (the code is for the installed app: links open in the browser)
export const sendSignInEmail = (email: string) =>
  supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/profiles` } })

export const verifySignInCode = (email: string, token: string) =>
  supabase!.auth.verifyOtp({ email, token, type: "email" })

// Settings that belong to the device, not the account
const DEVICE_KEYS = ["lumo:server", "lumo:notify"]

// The account's profiles and lists leave the device with it; the app restarts with a fresh "Me"
function clearAccountData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("lumo:") && !DEVICE_KEYS.includes(k))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // Storage blocked — nothing to clear
  }
  window.location.assign("/")
}

export async function signOut() {
  await syncNow()
  // This device stops getting the account's notifications (it falls back to its own checks)
  await removePushSubscription().catch(() => {})
  await supabase!.auth.signOut()
  clearAccountData()
}

// Deletes the account and everything stored with it (supabase/schema.sql: delete_account)
export async function deleteAccount() {
  const { error } = await supabase!.rpc("delete_account")
  if (error) throw error
  await supabase!.auth.signOut({ scope: "local" })
  clearAccountData()
}
