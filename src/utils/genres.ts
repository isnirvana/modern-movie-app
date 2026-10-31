// src/utils/genres.ts
export type MediaType = "movie" | "tv"
export type Genre = { id: number; name: string }

// Genre page URL; movies keep the original /genre/:id links working
export const genrePath = (type: MediaType, id: number) => `/genre/${id}${type === "tv" ? "?type=tv" : ""}`

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest First" },
  { value: "top", label: "Highest Rated" },
] as const
export type SortKey = (typeof SORT_OPTIONS)[number]["value"]

// TMDB discover params per sort. TV dates use first_air_date; "top" needs a vote floor or obscure titles win.
export function sortParams(type: MediaType, sort: SortKey): Record<string, string | number> {
  const today = new Date().toISOString().slice(0, 10)
  switch (sort) {
    case "newest":
      return type === "tv"
        ? { sort_by: "first_air_date.desc", "first_air_date.lte": today, "vote_count.gte": 10 }
        : { sort_by: "primary_release_date.desc", "primary_release_date.lte": today, "vote_count.gte": 10 }
    case "top":
      return { sort_by: "vote_average.desc", "vote_count.gte": 300 }
    default:
      return { sort_by: "popularity.desc" }
  }
}

// The same genre in the other list: by id first, then by name ("Action" ↔ "Action & Adventure")
export function matchGenre(genre: Genre | undefined, others: Genre[]) {
  if (!genre) return undefined
  const byId = others.find((g) => g.id === genre.id)
  if (byId) return byId
  // Split "Sci-Fi & Fantasy" into parts; treat "Science Fiction" and "Sci-Fi" as the same
  const parts = (name: string) =>
    name.toLowerCase().replace("science fiction", "sci-fi").split(/\s*&\s*/)
  // Try parts in order, so "Sci-Fi & Fantasy" prefers Science Fiction over Fantasy
  for (const part of parts(genre.name)) {
    const found = others.find((g) => parts(g.name).includes(part))
    if (found) return found
  }
  return undefined
}
