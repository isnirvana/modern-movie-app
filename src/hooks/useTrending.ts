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

type TrendingType = "all" | "movie"

const fetchTrending = async (type: TrendingType, pageParam: number) => {
  const res = await axios.get(`https://api.themoviedb.org/3/trending/${type}/day`, {
    params: {
      api_key: import.meta.env.VITE_TMDB_API_KEY,
      page: pageParam,
    },
  })
  // "all" can include people — keep only things we can play
  res.data.results = res.data.results.filter(
    (item: any) => item.media_type === "movie" || item.media_type === "tv"
  )
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
