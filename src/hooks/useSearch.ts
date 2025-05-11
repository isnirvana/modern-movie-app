// import { useQuery } from "@tanstack/react-query"
// import { searchMovies } from "../utils/api"

// export const useSearch = (query: string, page: number) =>
//   useQuery({
//     queryKey: ["search", query, page],
//     queryFn: () => searchMovies(query, page),
//     enabled: Boolean(query),
//   })

// src/hooks/useSearch.ts
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const fetchSearchResults = async (query: string) => {
  const res = await axios.get(`https://api.themoviedb.org/3/search/multi`, {
    params: {
      api_key: import.meta.env.VITE_TMDB_API_KEY,
      query,
    },
  })

  // Only keep movies and tv shows
  return res.data.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  )
}

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchSearchResults(query),
    enabled: !!query,
  })
