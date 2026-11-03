// src/hooks/usePersonalRows.ts
// What the "Because you watched" Home rows need: the titles they're based on (the strongest watched ones,
// see utils/recommend.ts), and the titles to leave out
import { useMemo, useSyncExternalStore } from "react"
import { useWatchHistory } from "./useWatchHistory"
import { excludedKeys, tasteSeeds } from "../utils/recommend"
import { getWatched, subscribeWatched } from "../utils/watchedEpisodes"

export function usePersonalRows() {
  const history = useWatchHistory()
  const watched = useSyncExternalStore(subscribeWatched, getWatched)
  return useMemo(() => ({ seeds: tasteSeeds(history, [], watched, 2), exclude: excludedKeys(history) }), [history, watched])
}
