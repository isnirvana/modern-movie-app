// src/hooks/useWatchHistory.ts
import { useSyncExternalStore } from "react"
import { getHistory, subscribe, type MediaType, type HistoryEntry } from "../utils/watchHistory"

const EMPTY: HistoryEntry[] = []

// All saved progress, most recent first; re-renders when anything is saved
export const useWatchHistory = () => useSyncExternalStore(subscribe, getHistory, () => EMPTY)

// Saved progress for one title (undefined if never watched)
export const useHistoryEntry = (type: MediaType, id: number) =>
  useWatchHistory().find((e) => e.type === type && e.id === id)
