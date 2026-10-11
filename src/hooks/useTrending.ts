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

const fetchTrending = async ({ pageParam = 1 }) => {
  const res = await axios.get(`https://api.themoviedb.org/3/trending/all/day`, {
    params: {
      api_key: import.meta.env.VITE_TMDB_API_KEY,
      page: pageParam,
    },
  })
  return res.data
}

export const useTrending = () =>
  useInfiniteQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending,
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  })
