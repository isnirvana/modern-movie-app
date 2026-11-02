// src/hooks/useRecentSearches.ts
import { useSyncExternalStore } from "react"
import { getRecentSearches, subscribeRecentSearches } from "../utils/recentSearches"

const EMPTY: string[] = []

// Recent searches, newest first; re-renders when they change
export const useRecentSearches = () => useSyncExternalStore(subscribeRecentSearches, getRecentSearches, () => EMPTY)
