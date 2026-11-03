// src/hooks/usePersonalRows.ts
// What the "Because you watched" Home rows need: the titles they're based on, and the titles to leave out
import { useMemo } from "react"
import { useWatchHistory } from "./useWatchHistory"
import { excludedKeys, pickSeeds } from "../utils/recommend"

export function usePersonalRows() {
  const history = useWatchHistory()
  return useMemo(() => ({ seeds: pickSeeds(history), exclude: excludedKeys(history) }), [history])
}
