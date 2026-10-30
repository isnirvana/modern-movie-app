// src/hooks/useTmdbList.ts
import { useQuery } from "@tanstack/react-query"
import { fetchList } from "../utils/api"

// One page of a TMDB list (popular, top rated, …) for the home page rows
export const useTmdbList = (path: string, mediaType?: "movie" | "tv") =>
  useQuery({
    queryKey: ["list", path],
    queryFn: () => fetchList(path, mediaType),
    staleTime: 1000 * 60 * 30,
  })
