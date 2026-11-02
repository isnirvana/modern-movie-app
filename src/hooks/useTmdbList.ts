// src/hooks/useTmdbList.ts
import { useQuery } from "@tanstack/react-query"
import { fetchList } from "../utils/api"

// One page of a TMDB list (popular, top rated, …) for the home page rows; released titles only unless `upcoming`
export const useTmdbList = (path: string, mediaType?: "movie" | "tv", upcoming = false) =>
  useQuery({
    queryKey: ["list", path, upcoming],
    queryFn: () => fetchList(path, mediaType, upcoming),
    staleTime: 1000 * 60 * 30,
  })
