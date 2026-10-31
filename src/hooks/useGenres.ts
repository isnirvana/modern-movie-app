// src/hooks/useGenres.ts
import { useQuery } from "@tanstack/react-query"
import { fetchGenres } from "../utils/api"
import type { Genre, MediaType } from "../utils/genres"

export const useGenres = (type: MediaType = "movie") =>
  useQuery<Genre[]>({
    queryKey: ["genres", type],
    queryFn: () => fetchGenres(type),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
