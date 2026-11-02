// src/hooks/useMediaQuery.ts
import { useSyncExternalStore } from "react"

// Whether a CSS media query matches right now; re-renders when that changes
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (callback) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", callback)
      return () => list.removeEventListener("change", callback)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)")
