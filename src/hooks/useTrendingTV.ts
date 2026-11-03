import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import { isReleased } from "../utils/media"
import { isKidsMode } from "../utils/profiles"

const fetchTrendingTV = async ({ pageParam = 1 }) => {
  // Kids profiles browse kid-rated shows by popularity instead: few trending shows are for kids
  const url = isKidsMode()
    ? "https://api.themoviedb.org/3/discover/tv?sort_by=popularity.desc"
    : "https://api.themoviedb.org/3/trending/tv/day"
  const res = await axios.get(url, {
    params: {
      page: pageParam,
      api_key: import.meta.env.VITE_TMDB_API_KEY,
    },
  })
  // Some trending shows haven't premiered yet
  res.data.results = res.data.results.filter(isReleased).map((item: any) => ({ media_type: "tv", ...item }))
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
