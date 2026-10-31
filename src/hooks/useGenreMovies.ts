// src/hooks/useGenreMovies.ts
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchByGenre } from "../utils/api"
import { sortParams, type MediaType, type SortKey } from "../utils/genres"

export const useGenreMovies = (type: MediaType, genreId: number, sort: SortKey) =>
  useInfiniteQuery({
    queryKey: ["genreMovies", type, genreId, sort],
    queryFn: ({ pageParam = 1 }) => fetchByGenre(type, genreId, sortParams(type, sort), pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last: any) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
  })
