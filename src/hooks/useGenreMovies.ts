import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchByGenre } from "../utils/api"

export const useGenreMovies = (genreId: number, sortBy: string) =>
  useInfiniteQuery({
    queryKey: ["genreMovies", genreId, sortBy],
    queryFn: ({ pageParam = 1 }) => fetchByGenre(genreId, sortBy, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last: any) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
  })
