// src/hooks/useTitleExtras.ts
import { useQuery } from "@tanstack/react-query"
import { fetchTitleExtras } from "../utils/api"
import { pickLogo, pickTrailer } from "../utils/media"

// Logo and trailer for a title we only have list data for (the Home hero)
export const useTitleExtras = (type: "movie" | "tv", id: number) =>
  useQuery({
    queryKey: ["extras", type, id],
    queryFn: () => fetchTitleExtras(type, id),
    select: (d: any) => ({ logo: pickLogo(d.images), trailer: pickTrailer(d.videos?.results) }),
    staleTime: 1000 * 60 * 60,
    enabled: id > 0,
  })
