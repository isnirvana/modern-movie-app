import { useQuery } from "@tanstack/react-query"
import { fetchTVDetails } from "../utils/api"

export const useTVDetails = (id: number) => {
  return useQuery({
    queryKey: ["tv", id],
    queryFn: () => fetchTVDetails(id),
  })
}
