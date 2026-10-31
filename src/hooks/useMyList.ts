// src/hooks/useMyList.ts
import { useSyncExternalStore } from "react"
import { getMyList, subscribeMyList, type ListItem, type MediaType } from "../utils/myList"

const EMPTY: ListItem[] = []

// Saved titles, newest first; re-renders when the list changes
export const useMyList = () => useSyncExternalStore(subscribeMyList, getMyList, () => EMPTY)

export const useInMyList = (type: MediaType, id: number) =>
  useMyList().some((i) => i.type === type && i.id === id)
