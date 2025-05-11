// src/hooks/useSeasonDetails.ts
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = "https://api.themoviedb.org/3"

export function useSeasonDetails(tvId: number, seasonNumber: number) {
  return useQuery({
    queryKey: ["seasonDetails", tvId, seasonNumber],
    queryFn: async () => {
      const res = await axios.get(
        `${TMDB_BASE}/tv/${tvId}/season/${seasonNumber}`,
        {
          params: { api_key: API_KEY },
        }
      )
      return res.data // contains `episodes` array
    },
    enabled: !!tvId && !!seasonNumber,
  })
}
