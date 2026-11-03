// src/utils/recommend.ts
// The personal rows (Because you watched, Top picks, the For You page), worked out from what the profile watched
// and saved. No randomness: the same history always gives the same picks.
//
// 1. Seeds: titles in the watch history, weighted by how recently and how much of them was watched (a movie given
//    up on after a few minutes says little; one watched to the end says a lot), titles picked as loved in the
//    taste picker, and My List titles, which count for less.
// 2. Candidates: TMDB's recommendations for each seed. A candidate scores for every seed that recommends it,
//    more for a heavier seed and for being higher up that seed's list.
// 3. That relevance is blended with how well the candidate's genres fit the profile's taste, and its rating.
// 4. Variety: a pick from a seed that's already given several, or much like the picks just before, slips down.

import type { HistoryEntry } from "./watchHistory"
import type { ListItem } from "./myList"
import type { Watched } from "./watchedEpisodes"
import type { Favourite } from "./favourites"

type MediaType = "movie" | "tv"

export type Seed = {
  type: MediaType
  id: number
  title: string
  weight: number // 0–1, the strongest seed being 1
  source: "watched" | "loved" | "saved" // saved: only in My List
}

// A recommended title, with why it's there
export type Pick = { item: any; match: number; because: Seed }

// Genre id → how much the profile likes it (0–1, the favourite being 1)
export type Taste = Map<number, number>

const key = (t: { media_type?: string; type?: string; id: number }) => `${t.type ?? t.media_type}-${t.id}`

const DAY = 86_400_000
// A title watched this long ago counts half as much as one watched today
const HALF_LIFE_DAYS = 45
// Saying you love a title counts nearly as much as finishing it; saving it to My List says less than watching
const LOVED_WEIGHT = 0.85
const SAVED_WEIGHT = 0.45

const recency = (at: number, now: number) => 0.5 ** (Math.max(0, now - at) / DAY / HALF_LIFE_DAYS)

// How much of it was watched, 0–1: a movie's progress, or for a show the episodes finished (plus the current one)
function engagement(e: HistoryEntry, watched: Watched) {
  const current = e.duration > 0 ? Math.min(1, e.time / e.duration) : 0
  if (e.type === "movie") return current
  const episodes = watched[e.id]?.length ?? 0
  return Math.min(1, 0.2 + episodes * 0.12 + current * 0.15)
}

// The titles to base recommendations on, strongest first
export function tasteSeeds(
  history: HistoryEntry[],
  myList: ListItem[],
  watched: Watched,
  count: number,
  favourites: Favourite[] = [],
  now = Date.now()
): Seed[] {
  const seeds = new Map<string, Seed>()
  // A title in more than one place counts once, as its strongest
  const add = (t: { type: MediaType; id: number; title: string }, weight: number, source: Seed["source"]) => {
    const seed = seeds.get(key(t))
    if (!seed) seeds.set(key(t), { type: t.type, id: t.id, title: t.title, weight, source })
    else if (weight > seed.weight) Object.assign(seed, { weight, source })
  }
  for (const e of history) add(e, recency(e.updatedAt, now) * (0.2 + 0.8 * engagement(e, watched)), "watched")
  for (const f of favourites) add(f, LOVED_WEIGHT * recency(f.pickedAt, now), "loved")
  for (const i of myList) add(i, SAVED_WEIGHT * recency(i.addedAt, now), "saved")
  const sorted = [...seeds.values()].sort((a, b) => b.weight - a.weight).slice(0, count)
  const top = sorted[0]?.weight || 1
  return sorted.map((s) => ({ ...s, weight: s.weight / top }))
}

// Titles not worth recommending: already watched or started (and, if given, already saved or loved)
export const excludedKeys = (history: HistoryEntry[], myList: ListItem[] = [], favourites: Favourite[] = []) =>
  new Set([...history.map(key), ...myList.map(key), ...favourites.map(key)])

export const withoutExcluded = (items: any[], exclude: Set<string>) =>
  items.filter((item) => item.poster_path && !exclude.has(key(item)))

// The profile's genres, from the seeds' own genres (`genresOf`, undefined while they load) weighted like the seeds.
// A title with many genres spreads its weight thinner, so catch-alls like Drama don't win every time.
export function tasteOf(seeds: Seed[], genresOf: (seed: Seed) => number[] | undefined): Taste {
  const tally = new Map<number, number>()
  for (const seed of seeds) {
    const genres = genresOf(seed) ?? []
    for (const g of genres) tally.set(g, (tally.get(g) ?? 0) + seed.weight / Math.sqrt(genres.length))
  }
  const top = Math.max(0, ...tally.values()) || 1
  return new Map([...tally].map(([g, w]) => [g, w / top]))
}

// The favourite genres, best first; `allowed` keeps it to one media type's genre list
export const topGenres = (taste: Taste, count: number, allowed?: number[]) =>
  [...taste]
    .filter(([g]) => !allowed || allowed.includes(g))
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([g]) => g)

// Movies or shows: whichever the profile is more into (movies on a tie)
export function favouriteType(seeds: Seed[]): MediaType {
  const total = (type: MediaType) => seeds.filter((s) => s.type === type).reduce((sum, s) => sum + s.weight, 0)
  return total("tv") > total("movie") ? "tv" : "movie"
}

// How well an item's genres fit the taste: high for the favourites, diluted by genres the profile doesn't watch
function genreFit(item: any, taste: Taste) {
  const genres: number[] = item.genre_ids ?? []
  if (!genres.length || !taste.size) return 0
  return genres.reduce((sum, g) => sum + (taste.get(g) ?? 0), 0) / Math.sqrt(genres.length)
}

// The rating, pulled towards an average when few people voted (so a 9.0 from 12 votes doesn't beat a 8.2 from 20,000), as 0–1
function quality(item: any) {
  const votes = item.vote_count ?? 0
  const rating = (votes * (item.vote_average ?? 0) + 300 * 6.8) / (votes + 300)
  return Math.min(1, Math.max(0, (rating - 5.5) / 3))
}

function genreOverlap(a: any, b: any) {
  const ga: number[] = a.genre_ids ?? []
  const gb: number[] = b.genre_ids ?? []
  const shared = ga.filter((g) => gb.includes(g)).length
  return shared ? shared / new Set([...ga, ...gb]).size : 0
}

// Top picks: `lists[i]` holds the recommendations for `seeds[i]` (empty while loading)
export function rankPicks(seeds: Seed[], lists: any[][], taste: Taste, exclude: Set<string>, limit = 20): Pick[] {
  const candidates = new Map<string, { item: any; relevance: number; bySeed: Map<Seed, number> }>()
  seeds.forEach((seed, i) => {
    withoutExcluded(lists[i] ?? [], exclude).forEach((item, rank) => {
      const points = seed.weight / Math.sqrt(rank + 1)
      const c = candidates.get(key(item)) ?? { item, relevance: 0, bySeed: new Map() }
      c.relevance += points
      c.bySeed.set(seed, (c.bySeed.get(seed) ?? 0) + points)
      candidates.set(key(item), c)
    })
  })
  if (!candidates.size) return []

  const all = [...candidates.values()]
  const maxRelevance = Math.max(...all.map((c) => c.relevance))
  const maxFit = Math.max(...all.map((c) => genreFit(c.item, taste))) || 1
  const scored = all
    .map((c) => ({
      item: c.item,
      score: 0.6 * (c.relevance / maxRelevance) + 0.25 * (genreFit(c.item, taste) / maxFit) + 0.15 * quality(c.item),
      because: [...c.bySeed].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 6)

  // Take the best one at a time, holding back seeds already used a lot and repeats of the last few picks' genres
  const picks: Pick[] = []
  const fromSeed = new Map<Seed, number>()
  while (picks.length < limit && scored.length) {
    const recent = picks.slice(-3)
    let best = 0
    let bestValue = -Infinity
    scored.forEach((c, i) => {
      const sameness = Math.max(0, ...recent.map((p) => genreOverlap(p.item, c.item)))
      const value = c.score * 0.9 ** (fromSeed.get(c.because) ?? 0) * (1 - 0.15 * sameness)
      if (value > bestValue) [best, bestValue] = [i, value]
    })
    const [c] = scored.splice(best, 1)
    fromSeed.set(c.because, (fromSeed.get(c.because) ?? 0) + 1)
    picks.push({ item: c.item, because: c.because, match: Math.min(99, Math.round(55 + 44 * c.score)) })
  }
  return picks
}

// A list (e.g. new releases) reordered for the profile: its own order still counts, with genre fit and rating
export function byTaste(items: any[], taste: Taste) {
  const maxFit = Math.max(0, ...items.map((i) => genreFit(i, taste))) || 1
  const score = (item: any, rank: number) => 0.5 * (genreFit(item, taste) / maxFit) + 0.3 * quality(item) + 0.2 / Math.sqrt(rank + 1)
  return items
    .map((item, rank) => ({ item, score: score(item, rank) }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item)
}

const VERBS = { watched: "watched", loved: "love", saved: "added" }

// "Because you watched Dune" / "Because you love …" / "Because you added …" (My List)
export const because = (seed: Seed) => `Because you ${VERBS[seed.source]}`
export const reason = (seed: Seed) => `${because(seed)} ${seed.title}`
