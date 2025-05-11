import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const searchMulti = async (query: string) => {
  const res = await axios.get("https://api.themoviedb.org/3/search/multi", {
    params: {
      query,
      api_key: import.meta.env.VITE_TMDB_API_KEY,
    },
  })
  return res.data.results
}

export const useMultiSearch = (query: string) => {
  return useQuery({
    queryKey: ["searchMulti", query],
    queryFn: () => searchMulti(query),
    enabled: !!query, // only runs when query is non-empty
  })
}
