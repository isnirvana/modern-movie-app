// src/hooks/useFavourites.ts
import { useSyncExternalStore } from "react"
import { getFavourites, subscribeFavourites, type Favourite } from "../utils/favourites"

const EMPTY: Favourite[] = []

// Titles picked in the taste picker; re-renders when they change
export const useFavourites = () => useSyncExternalStore(subscribeFavourites, getFavourites, () => EMPTY)
