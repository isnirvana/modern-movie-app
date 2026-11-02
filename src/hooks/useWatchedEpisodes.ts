// src/hooks/useWatchedEpisodes.ts
import { useSyncExternalStore } from "react"
import { getWatched, subscribeWatched } from "../utils/watchedEpisodes"

const EMPTY: string[] = []
const NONE: ReturnType<typeof getWatched> = {}

// "season-episode" keys of this show's watched episodes; re-renders when one is marked
export const useWatchedEpisodes = (showId: number) =>
  useSyncExternalStore(subscribeWatched, getWatched, () => NONE)[showId] ?? EMPTY
