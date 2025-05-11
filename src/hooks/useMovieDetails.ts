import { useQuery } from "@tanstack/react-query"
import { fetchMovieDetails } from "../utils/api"

export const useMovieDetails = (id: number) =>
  useQuery({
    queryKey: ["movie", id],
    queryFn: () => fetchMovieDetails(id),
    enabled: Boolean(id),
  })
