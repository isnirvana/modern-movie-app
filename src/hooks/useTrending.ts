// import { useInfiniteQuery } from "@tanstack/react-query"
// import { fetchTrending } from "../utils/api"

// export const useTrending = () =>
//   useInfiniteQuery({
//     queryKey: ["trending"],
//     queryFn: ({ pageParam = 1 }) => fetchTrending(pageParam),
//     getNextPageParam: (last) =>
//       last.page < last.total_pages ? last.page + 1 : undefined,
//   })
// src/hooks/useTrending.ts
import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import { isReleased } from "../utils/media"
import { isKidsMode } from "../utils/profiles"

type TrendingType = "all" | "movie"

// Kids profiles browse kid-rated titles by popularity instead: few trending titles are for kids
const trendingUrl = (type: TrendingType) =>
  isKidsMode() && type !== "all"
    ? `https://api.themoviedb.org/3/discover/${type}?sort_by=popularity.desc`
    : `https://api.themoviedb.org/3/trending/${type}/day`

const fetchTrending = async (type: TrendingType, pageParam: number) => {
  const res = await axios.get(trendingUrl(type), {
    params: {
      api_key: import.meta.env.VITE_TMDB_API_KEY,
      page: pageParam,
    },
  })
  // "all" can include people, and some titles aren't out yet — keep only things we can play
  // (discover results don't say their type, so it's filled in)
  res.data.results = res.data.results
    .map((item: any) => ({ media_type: type, ...item }))
    .filter((item: any) => (item.media_type === "movie" || item.media_type === "tv") && isReleased(item))
  return res.data
}

export const useTrending = (type: TrendingType = "all") =>
  useInfiniteQuery({
    queryKey: ["trending", type],
    queryFn: ({ pageParam }) => fetchTrending(type, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  })
