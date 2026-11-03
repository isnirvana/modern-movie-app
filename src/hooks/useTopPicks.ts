// src/hooks/useTopPicks.ts
// "Top picks for you", ranked from the profile's watch history, My List and loved titles (utils/recommend.ts
// explains how). History and My List follow the account across devices when signed in.
import { useMemo, useSyncExternalStore } from "react"
import { useQueries } from "@tanstack/react-query"
import { useWatchHistory } from "./useWatchHistory"
import { useMyList } from "./useMyList"
import { useFavourites } from "./useFavourites"
import { fetchList, fetchTitle } from "../utils/api"
import { getWatched, subscribeWatched } from "../utils/watchedEpisodes"
import { excludedKeys, rankPicks, tasteOf, tasteSeeds, type Seed } from "../utils/recommend"

const SEEDS = 8
const DAY = 1000 * 60 * 60 * 24

export function useTopPicks(limit = 20) {
  const history = useWatchHistory()
  const myList = useMyList()
  const favourites = useFavourites()
  const watched = useSyncExternalStore(subscribeWatched, getWatched)
  const seeds = useMemo(() => tasteSeeds(history, myList, watched, SEEDS, favourites), [history, myList, watched, favourites])
  const exclude = useMemo(() => excludedKeys(history, myList, favourites), [history, myList, favourites])

  // Same keys as useTmdbList, so "Because you watched" rows for the same titles share the requests
  const lists = useQueries({
    queries: seeds.map((s) => {
      const path = `/${s.type}/${s.id}/recommendations`
      return { queryKey: ["list", path, false], queryFn: () => fetchList(path, s.type), staleTime: 1000 * 60 * 30 }
    }),
  })
  // The seeds' own genres, for the taste profile
  const details = useQueries({
    queries: seeds.map((s) => ({ queryKey: ["title", s.type, s.id], queryFn: () => fetchTitle(s.type, s.id), staleTime: DAY })),
  })

  // A few hundred titles at most: cheap enough to rank on every render
  const genres = new Map<Seed, number[] | undefined>(
    seeds.map((s, i) => [s, details[i]?.data?.genres?.map((g: { id: number }) => g.id)])
  )
  const taste = tasteOf(seeds, (s) => genres.get(s))
  const picks = rankPicks(seeds, lists.map((r) => r.data ?? []), taste, exclude, limit)

  return {
    picks,
    items: picks.map((p) => p.item),
    isLoading: lists.some((r) => r.isLoading),
    // The seeds' genres are still coming in (the taste, and so the order, may still change)
    tasteLoading: details.some((r) => r.isLoading),
    seeds,
    // Each seed's recommendations, as fetched (for "Because you watched" rows)
    lists: lists.map((r) => (r.data ?? []) as any[]),
    taste,
    exclude,
  }
}
