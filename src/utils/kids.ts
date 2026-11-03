// src/utils/kids.ts
// What a Kids profile may see. Three layers:
// 1. Browsing (TMDB discover) asks TMDB for kid ratings only.
// 2. Every other list (trending, search, recommendations…) keeps Family and Kids genre titles only.
// 3. Title pages check the US age rating itself (KidsBlocked otherwise), which catches anything 2 lets through.

import type { AxiosInstance } from "axios"
import { isKidsMode } from "./profiles"

export const KIDS_MOVIE_RATINGS = ["G", "PG"]
export const KIDS_TV_RATINGS = ["TV-Y", "TV-Y7", "TV-G"]
const KIDS_GENRES = [10751, 10762] // Family, Kids

// The US rating only: other countries' scales don't map onto these lists
export function usAgeRating(type: "movie" | "tv", details: any): string | null {
  if (type === "tv") {
    return (details?.content_ratings?.results ?? []).find((r: any) => r.iso_3166_1 === "US")?.rating || null
  }
  const us = (details?.release_dates?.results ?? []).find((c: any) => c.iso_3166_1 === "US")
  return (us?.release_dates ?? []).map((d: any) => d.certification).find(Boolean) || null
}

// Whether a title page may open in a Kids profile. Unrated titles go by genre.
export function kidsAllowed(type: "movie" | "tv", details: any): boolean {
  if (details?.adult) return false
  const rating = usAgeRating(type, details)
  if (rating) return (type === "tv" ? KIDS_TV_RATINGS : KIDS_MOVIE_RATINGS).includes(rating)
  return (details?.genres ?? []).some((g: any) => KIDS_GENRES.includes(g.id))
}

// Movies and shows carry genre_ids in lists; people are dropped. Anything else (videos, reviews) isn't a title.
const isTitleOrPerson = (item: any) => Array.isArray(item?.genre_ids) || item?.media_type === "person"
const kidSafeItem = (item: any) =>
  !item.adult && Array.isArray(item.genre_ids) && item.genre_ids.some((g: number) => KIDS_GENRES.includes(g))

const keepKidSafe = (list: any) =>
  Array.isArray(list) ? list.filter((item) => !isTitleOrPerson(item) || kidSafeItem(item)) : list

const pathOf = (url = "", base = "") => new URL(url, base || "https://api.themoviedb.org/3/").pathname

// Applies the rules above to every TMDB request made through `instance`, while a Kids profile is active
export function installKidsFilter(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    if (!isKidsMode()) return config
    const path = pathOf(config.url, config.baseURL)
    if (path.endsWith("/discover/movie")) {
      config.params = { ...config.params, certification_country: "US", "certification.lte": "PG" }
    } else if (path.endsWith("/discover/tv")) {
      config.params = { ...config.params, certification_country: "US", certification: KIDS_TV_RATINGS.join("|") }
    }
    return config
  })

  instance.interceptors.response.use((res) => {
    const data = res.data
    if (!isKidsMode() || !data || typeof data !== "object") return res
    // Discover results are already rated for kids by TMDB
    if (data.results && !pathOf(res.config.url, res.config.baseURL).includes("/discover/")) {
      data.results = keepKidSafe(data.results)
    }
    // Title details carry their recommendations along
    if (data.recommendations) data.recommendations.results = keepKidSafe(data.recommendations.results)
    if (data.similar) data.similar.results = keepKidSafe(data.similar.results)
    // A person's page: their filmography
    if (data.combined_credits) {
      data.combined_credits.cast = keepKidSafe(data.combined_credits.cast)
      data.combined_credits.crew = keepKidSafe(data.combined_credits.crew)
    }
    return res
  })
}
