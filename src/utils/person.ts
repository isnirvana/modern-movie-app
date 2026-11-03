// src/utils/person.ts
// Turns a TMDB person (with combined_credits and external_ids) into what the person page shows:
// age and links, "Known for", and the filmography by department.

import { isReleased, releaseDateOf } from "./media"

type MediaType = "movie" | "tv"

// One title in the filmography, with every role they had in it merged ("as Peter Parker", "Director, Writer")
export type Credit = {
  key: string
  type: MediaType
  id: number
  title: string
  poster_path?: string | null
  date?: string
  released: boolean
  roles: string[]
  episodes: number // TV: how many episodes they're credited on
  vote_count: number
  item: any // the credit as TMDB gave it (for poster cards)
}

// Not part of their work: talk shows and news, appearances as themselves (town halls, award shows, making-ofs,
// including playing "themselves" under their own name), and reused archive footage
const NOISE_GENRES = [10767, 10763] // Talk, News
const AS_SELF = /^(self|himself|herself|themselves)\b/i
const ARCHIVE = /archive footage/i

const isNoise = (c: any, name: string) => {
  const character = (c.character ?? "").trim()
  return (
    (c.media_type === "tv" && (c.genre_ids ?? []).some((g: number) => NOISE_GENRES.includes(g))) ||
    AS_SELF.test(character) ||
    ARCHIVE.test(character) ||
    (!!name && character.toLowerCase() === name.toLowerCase())
  )
}

const titleOf = (c: any) => c.title || c.name || "Untitled"

const castOf = (person: any): any[] =>
  (person?.combined_credits?.cast ?? []).filter((c: any) => !isNoise(c, person?.name ?? ""))
const crewOf = (person: any): any[] => person?.combined_credits?.crew ?? []

// The tabs: Acting, then crew departments, most credits first (Directing and Writing ahead of the rest)
const DEPARTMENT_ORDER = ["Acting", "Directing", "Writing", "Production", "Creator"]
export function departments(person: any): { name: string; count: number }[] {
  const counts = new Map<string, Set<string>>() // department → its titles
  const add = (dept: string, c: any) => {
    if (!counts.has(dept)) counts.set(dept, new Set())
    counts.get(dept)!.add(`${c.media_type}-${c.id}`)
  }
  castOf(person).forEach((c) => add("Acting", c))
  crewOf(person).forEach((c) => add(c.department, c))
  const rank = (d: string) => (DEPARTMENT_ORDER.indexOf(d) + 1 || DEPARTMENT_ORDER.length + 1)
  return [...counts]
    .map(([name, set]) => ({ name, count: set.size }))
    .sort((a, b) => rank(a.name) - rank(b.name) || b.count - a.count)
}

// Their credits in one department, merged per title: what's coming first (soonest first), then newest to oldest
export function filmography(person: any, department: string): Credit[] {
  const credits = department === "Acting" ? castOf(person) : crewOf(person).filter((c) => c.department === department)
  const byTitle = new Map<string, Credit>()
  for (const c of credits) {
    const key = `${c.media_type}-${c.id}`
    const role = department === "Acting" ? (c.character ? `as ${c.character}` : "") : c.job
    const entry = byTitle.get(key)
    if (entry) {
      if (role && !entry.roles.includes(role)) entry.roles.push(role)
      entry.episodes += c.episode_count ?? 0
      continue
    }
    byTitle.set(key, {
      key,
      type: c.media_type,
      id: c.id,
      title: titleOf(c),
      poster_path: c.poster_path,
      date: releaseDateOf(c),
      released: isReleased(c),
      roles: role ? [role] : [],
      episodes: c.episode_count ?? 0,
      vote_count: c.vote_count ?? 0,
      item: c,
    })
  }
  // Not out yet with neither a date nor a poster: usually a placeholder entry, not a real project yet
  const list = [...byTitle.values()].filter((c) => c.released || c.date || c.poster_path)
  const upcoming = list.filter((c) => !c.released).sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
  const out = list.filter((c) => c.released).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  return [...upcoming, ...out]
}

// Their best-known work: big roles (or their main job) in the most watched titles they're in
export function knownFor(person: any, max = 14): any[] {
  const dept = person?.known_for_department ?? "Acting"
  const pool =
    dept === "Acting"
      ? castOf(person).filter((c) => c.media_type === "tv" || (c.order ?? 99) <= 8)
      : crewOf(person).filter((c) => c.department === dept)
  const pick = (list: any[]) => {
    const seen = new Set<string>()
    const out: any[] = []
    const sorted = list
      .filter((c) => c.poster_path && isReleased(c))
      .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    for (const c of sorted) {
      const key = `${c.media_type}-${c.id}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(c)
    }
    return out.slice(0, max)
  }
  const best = pick(pool)
  return best.length >= 4 ? best : pick([...castOf(person), ...crewOf(person)])
}

// How many movies and shows they've worked on (any role)
export function creditCounts(person: any) {
  const titles = new Set([...castOf(person), ...crewOf(person)].map((c) => `${c.media_type}-${c.id}`))
  const movies = [...titles].filter((k) => k.startsWith("movie-")).length
  return { movies, shows: titles.size - movies }
}

// Age today, or at death
export function ageOf(birthday?: string | null, deathday?: string | null): number | null {
  if (!birthday) return null
  const end = deathday ? new Date(`${deathday}T00:00`) : new Date()
  const born = new Date(`${birthday}T00:00`)
  let age = end.getFullYear() - born.getFullYear()
  if (end.getMonth() < born.getMonth() || (end.getMonth() === born.getMonth() && end.getDate() < born.getDate())) age--
  return age
}

export type SocialLink = { kind: "imdb" | "instagram" | "x" | "facebook" | "youtube" | "tiktok" | "web"; label: string; href: string }

export function socialLinks(person: any): SocialLink[] {
  const ids = person?.external_ids ?? {}
  const links: (SocialLink | null)[] = [
    ids.imdb_id ? { kind: "imdb", label: "IMDb", href: `https://www.imdb.com/name/${ids.imdb_id}` } : null,
    ids.instagram_id ? { kind: "instagram", label: "Instagram", href: `https://www.instagram.com/${ids.instagram_id}` } : null,
    ids.twitter_id ? { kind: "x", label: "X", href: `https://x.com/${ids.twitter_id}` } : null,
    ids.tiktok_id ? { kind: "tiktok", label: "TikTok", href: `https://www.tiktok.com/@${ids.tiktok_id}` } : null,
    ids.youtube_id ? { kind: "youtube", label: "YouTube", href: `https://www.youtube.com/${ids.youtube_id}` } : null,
    ids.facebook_id ? { kind: "facebook", label: "Facebook", href: `https://www.facebook.com/${ids.facebook_id}` } : null,
    person?.homepage ? { kind: "web", label: "Website", href: person.homepage } : null,
  ]
  return links.filter((l): l is SocialLink => !!l && /^https:\/\//.test(l.href))
}
