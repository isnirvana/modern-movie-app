// src/utils/media.ts
// Helpers for the extras TMDB returns with a title's details (videos, recommendations, similar)

export type Video = { key: string; name: string; site: string; type: string; official?: boolean }

// Trailers first, then teasers, clips and the rest; official ones before fan uploads
const TYPE_ORDER = ["Trailer", "Teaser", "Clip", "Featurette", "Behind the Scenes", "Bloopers"]

export function pickVideos(results: Video[] = [], limit = 12): Video[] {
  const rank = (v: Video) => {
    const i = TYPE_ORDER.indexOf(v.type)
    return (i === -1 ? TYPE_ORDER.length : i) * 2 + (v.official ? 0 : 1)
  }
  return results
    .filter((v) => v.site === "YouTube" && v.key)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit)
}

// The title's logo artwork (English first, then language-neutral, best voted), or null if it has none
export function pickLogo(images: any): string | null {
  const logos: any[] = images?.logos ?? []
  const best = (list: any[]) => [...list].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))[0]
  return (best(logos.filter((l) => l.iso_639_1 === "en")) ?? best(logos))?.file_path ?? null
}

// The video to play muted behind a title: its best trailer or teaser
export const pickTrailer = (videos: Video[] = []) =>
  pickVideos(videos).find((v) => v.type === "Trailer" || v.type === "Teaser")

// YouTube's privacy-enhanced player, starting straight away
export const youtubeEmbed = (key: string) =>
  `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&playsinline=1`

export const youtubeThumb = (key: string) => `https://i.ytimg.com/vi/${key}/hqdefault.jpg`

// Release dates: a movie's release_date or a show's first_air_date (YYYY-MM-DD)
type Dated = { release_date?: string; first_air_date?: string }

export const releaseDateOf = (item: Dated) => item.release_date || item.first_air_date || undefined

// Today as YYYY-MM-DD in the viewer's time zone (comparable with TMDB dates as strings)
export const todayISO = () => new Date().toLocaleDateString("en-CA")

// Out already? Titles without a date haven't been released yet
export function isReleased(item: Dated) {
  const date = releaseDateOf(item)
  return !!date && date <= todayISO()
}

// "2026-12-14" → "14 Dec 2026" (read as a local date, so it doesn't shift a day).
// `short` drops the year when it's this year ("14 Dec"), for tight spots like poster cards.
export function formatReleaseDate(date: string, short = false) {
  const d = new Date(`${date}T00:00`)
  const withYear = !short || d.getFullYear() !== new Date().getFullYear()
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(withYear && { year: "numeric" }) })
}

// "More Like This": recommendations, or similar titles when there are none. Items without a poster are dropped.
export function relatedItems(details: any, mediaType: "movie" | "tv") {
  const recommended = details?.recommendations?.results ?? []
  const list = recommended.length ? recommended : details?.similar?.results ?? []
  return list
    .filter((item: any) => item.poster_path && item.id !== details.id && isReleased(item))
    .map((item: any) => ({ ...item, media_type: item.media_type ?? mediaType }))
}
