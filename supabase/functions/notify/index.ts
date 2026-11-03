// supabase/functions/notify/index.ts
// The notifier: runs hourly (pg_cron, see supabase/push.sql) and sends each profile at most one push a day,
// between 10:00 and 21:00 in its device's time zone. In order of preference:
//   1. New episodes of their shows (several go in one message; "since you were last here" after 2 weeks away),
//      or a My List movie that just came out
//   2. Something they started and didn't finish, 20 hours to 7 days later
//   3. The next episode of a show they're watching, 2 to 10 days after the last one
// notify_state remembers what each profile was told, so nothing is announced twice.
//
// Secrets: CRON_SECRET (callers must send it as x-cron-secret), TMDB_API_KEY, VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
// POST { test: true, user_id } sends a test notification to that account's devices.

import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const env = (name: string) => Deno.env.get(name) ?? ""
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))
webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"))

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const SEND_FROM_HOUR = 10
const SEND_UNTIL_HOUR = 21
const MIN_GAP = 20 * HOUR // between two pushes to a profile
const LOOKUP_EVERY = 6 * HOUR // TMDB checks for new episodes / releases, per profile
const AWAY = 14 * DAY
const SHOWS_FROM_HISTORY = 20
const MOVIE_GRACE_DAYS = 30

type Sub = { endpoint: string; user_id: string; profile_id: string; p256dh: string; auth: string; time_zone: string }
type Note = { title: string; body: string; url: string; tag: string }
type Row = Record<string, any>

// --- TMDB (one lookup per title per run, shared by all profiles) ---

const lookups = new Map<string, Promise<any>>()
function tmdb(type: "movie" | "tv", id: number) {
  const key = `${type}-${id}`
  if (!lookups.has(key)) {
    lookups.set(
      key,
      fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${env("TMDB_API_KEY")}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  }
  return lookups.get(key)!
}

const isoDate = (ms: number, timeZone: string) => {
  try {
    return new Date(ms).toLocaleDateString("en-CA", { timeZone })
  } catch {
    return new Date(ms).toISOString().slice(0, 10)
  }
}

function localHour(timeZone: string) {
  try {
    return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()))
  } catch {
    return new Date().getUTCHours()
  }
}

const names = (titles: string[]) =>
  titles.length <= 2 ? titles.join(" and ") : `${titles.slice(0, 2).join(", ")} and ${titles.length - 2} more`

// --- Choosing what to say ---

// What to send this profile now, if anything, and the notify_state changes that go with sending it
// (`always` is saved either way: first sightings and unchanged lookups)
type Pick = { note: Note | null; onSend: Map<string, string>; always: Map<string, string> }

async function pick(state: Map<string, string>, history: Row[], list: Row[], timeZone: string): Promise<Pick> {
  const now = Date.now()
  const always = new Map<string, string>()
  const onSend = new Map<string, string>()

  // 1. News: new episodes, premieres, releases
  if (now - Number(state.get("looked-up") ?? 0) >= LOOKUP_EVERY) {
    always.set("looked-up", String(now))

    const shows = new Map<number, string>()
    history.filter((h) => h.type === "tv").slice(0, SHOWS_FROM_HISTORY).forEach((h) => shows.set(h.tmdb_id, h.title))
    list.filter((i) => i.type === "tv").forEach((i) => shows.set(i.tmdb_id, i.title))

    const fresh: { id: number; title: string; episode: string; premiered: boolean }[] = []
    for (const [id, title] of shows) {
      const data = await tmdb("tv", id)
      if (!data) continue
      const last = data.last_episode_to_air
      const key = `tv-${id}`
      const value = last ? `S${last.season_number}E${last.episode_number}` : "none"
      const before = state.get(key)
      if (!before || before === value || !last) {
        always.set(key, value) // first sighting, or nothing new
        continue
      }
      onSend.set(key, value)
      fresh.push({
        id,
        title,
        premiered: before === "none",
        episode: `S${last.season_number} E${last.episode_number}${last.name ? ` · ${last.name}` : ""}`,
      })
    }

    const away = now - Math.max(0, ...history.map((h) => Number(h.updated_at))) > AWAY
    if (fresh.length === 1) {
      const [f] = fresh
      return {
        always,
        onSend,
        note: {
          title: f.premiered ? `${f.title} has premiered` : `New episode of ${f.title}`,
          body: `${away ? "Since you were last here: " : ""}${f.episode} is out now`,
          url: `/tv/${f.id}`,
          tag: `tv-${f.id}`,
        },
      }
    }
    if (fresh.length > 1) {
      return {
        always,
        onSend,
        note: {
          title: `New episodes of ${names(fresh.map((f) => f.title))}`,
          body: `${away ? "Since you were last here, new" : "New"} episodes are out. Tap to catch up.`,
          url: "/#continue-watching",
          tag: "new-episodes",
        },
      }
    }

    // My List movies that just came out
    const since = isoDate(now - MOVIE_GRACE_DAYS * DAY, timeZone)
    const today = isoDate(now, timeZone)
    for (const item of list.filter((i) => i.type === "movie" && (!i.release_date || i.release_date >= since))) {
      const data = await tmdb("movie", item.tmdb_id)
      if (!data) continue
      const key = `movie-${item.tmdb_id}`
      const value = data.release_date && data.release_date <= today ? "released" : "upcoming"
      if (state.get(key) === "upcoming" && value === "released") {
        onSend.set(key, value)
        return {
          always,
          onSend,
          note: { title: `${item.title} is out now`, body: "It's on your list. Tap to watch.", url: `/movie/${item.tmdb_id}`, tag: key },
        }
      }
      always.set(key, value)
    }
  }

  const age = (h: Row) => now - Number(h.updated_at)
  const ratio = (h: Row) => (h.duration > 0 ? h.time / h.duration : 0)

  // 2. Started but not finished
  const unfinished = history.find((h) => ratio(h) >= 0.05 && ratio(h) < 0.9 && age(h) >= 20 * HOUR && age(h) <= 7 * DAY)
  if (unfinished) {
    const key = `unfinished-${unfinished.type}-${unfinished.tmdb_id}`
    const value = String(unfinished.updated_at)
    if (state.get(key) !== value) {
      onSend.set(key, value)
      const minutes = Math.max(1, Math.round((unfinished.duration - unfinished.time) / 60))
      const what =
        unfinished.type === "tv" ? `${unfinished.title} S${unfinished.season} E${unfinished.episode}` : unfinished.title
      return {
        always,
        onSend,
        note: {
          title: `Finish ${what}?`,
          body: `${minutes} min left. Pick up right where you stopped.`,
          url: `/${unfinished.type}/${unfinished.tmdb_id}?play=1`,
          tag: key,
        },
      }
    }
  }

  // 3. The next episode is waiting ("Up next" entries have no duration yet)
  const next = history.find(
    (h) => h.type === "tv" && (h.duration === 0 || ratio(h) >= 0.95) && age(h) >= 2 * DAY && age(h) <= 10 * DAY
  )
  if (next) {
    const key = `next-tv-${next.tmdb_id}`
    const value = String(next.updated_at)
    if (state.get(key) !== value) {
      onSend.set(key, value)
      return {
        always,
        onSend,
        note: {
          title: `${next.title}: your next episode is waiting`,
          body: next.duration === 0 ? `S${next.season} E${next.episode} is up next.` : "Pick up where you left off.",
          url: `/tv/${next.tmdb_id}?play=1`,
          tag: key,
        },
      }
    }
  }

  return { always, onSend, note: null }
}

// --- Sending ---

// Sends to each device; forgets devices the push service says are gone. True if any device took it.
async function send(subs: Sub[], note: Note) {
  let delivered = false
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(note), {
        TTL: 6 * 60 * 60,
      })
      delivered = true
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint)
      else console.error("Push failed", e?.statusCode, e?.body)
    }
  }
  return delivered
}

async function notifyProfile(subs: Sub[]) {
  const { user_id, profile_id, time_zone } = subs[0]
  const hour = localHour(time_zone)
  if (hour < SEND_FROM_HOUR || hour >= SEND_UNTIL_HOUR) return false

  const owner = { user_id, profile_id }
  const { data: stateRows } = await db.from("notify_state").select("key, value").match(owner)
  const state = new Map((stateRows ?? []).map((r) => [r.key, r.value]))
  if (Date.now() - Number(state.get("last-sent") ?? 0) < MIN_GAP) return false

  const [{ data: history }, { data: list }] = await Promise.all([
    db.from("watch_history").select("*").match(owner).order("updated_at", { ascending: false }),
    db.from("my_list").select("*").match(owner),
  ])
  const { note, onSend, always } = await pick(state, history ?? [], list ?? [], time_zone)

  const changes = new Map(always)
  const sent = note ? await send(subs, note) : false
  if (sent) {
    onSend.forEach((v, k) => changes.set(k, v))
    changes.set("last-sent", String(Date.now()))
  }
  if (changes.size) {
    await db.from("notify_state").upsert([...changes].map(([key, value]) => ({ ...owner, key, value })))
  }
  return sent
}

Deno.serve(async (req) => {
  if (!env("CRON_SECRET") || req.headers.get("x-cron-secret") !== env("CRON_SECRET")) {
    return new Response("Forbidden", { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const { data: subs, error } = await db.from("push_subscriptions").select("*")
  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (body.test) {
    const mine = (subs ?? []).filter((s) => s.user_id === body.user_id)
    const note = { title: "Notifications are on", body: "We'll let you know when your shows have new episodes.", url: "/", tag: "test" }
    return Response.json({ devices: mine.length, delivered: mine.length ? await send(mine, note) : false })
  }

  // One check per profile, sent to all its devices
  const profiles = new Map<string, Sub[]>()
  for (const s of subs ?? []) {
    const key = `${s.user_id}/${s.profile_id}`
    profiles.set(key, [...(profiles.get(key) ?? []), s])
  }
  let sent = 0
  for (const group of profiles.values()) {
    try {
      if (await notifyProfile(group)) sent++
    } catch (e) {
      console.error("Profile failed", e)
    }
  }
  return Response.json({ profiles: profiles.size, sent })
})
