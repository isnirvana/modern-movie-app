// import { useInfiniteQuery } from "@tanstack/react-query"
// import { fetchByGenre } from "../utils/api"

// export const useGenreMovies = (genreId: number, sortBy: string) =>
//   useInfiniteQuery({
//     queryKey: ["genreMovies", genreId, sortBy],
//     queryFn: ({ pageParam = 1 }) => fetchByGenre(genreId, sortBy, pageParam),
//     getNextPageParam: (last) =>
//       last.page < last.total_pages ? last.page + 1 : undefined,
//   })

import { useQuery } from "@tanstack/react-query"
import { fetchGenres } from "../utils/api"

export const useGenres = () =>
  useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
    // optional: you can disable retry or adjust staleTime if you like
    staleTime: 1000 * 60 * 60, // 1 hour
  })
