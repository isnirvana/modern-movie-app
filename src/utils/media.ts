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

// YouTube's privacy-enhanced player, starting straight away
export const youtubeEmbed = (key: string) =>
  `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&playsinline=1`

export const youtubeThumb = (key: string) => `https://i.ytimg.com/vi/${key}/hqdefault.jpg`

// "More Like This": recommendations, or similar titles when there are none. Items without a poster are dropped.
export function relatedItems(details: any, mediaType: "movie" | "tv") {
  const recommended = details?.recommendations?.results ?? []
  const list = recommended.length ? recommended : details?.similar?.results ?? []
  return list
    .filter((item: any) => item.poster_path && item.id !== details.id)
    .map((item: any) => ({ ...item, media_type: item.media_type ?? mediaType }))
}
