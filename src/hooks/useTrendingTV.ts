import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import { isReleased } from "../utils/media"

const fetchTrendingTV = async ({ pageParam = 1 }) => {
  const res = await axios.get("https://api.themoviedb.org/3/trending/tv/day", {
    params: {
      page: pageParam,
      api_key: import.meta.env.VITE_TMDB_API_KEY,
    },
  })
  // Some trending shows haven't premiered yet
  res.data.results = res.data.results.filter(isReleased)
  return res.data
}

export const useTrendingTV = () =>
  useInfiniteQuery({
    queryKey: ["trendingTV"],
    queryFn: fetchTrendingTV,
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  })
