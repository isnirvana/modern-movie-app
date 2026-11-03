// src/hooks/useDebounced.ts
import { useEffect, useState } from "react"

// `value`, once it has stopped changing for `ms` (e.g. a search box, so it doesn't search on every key)
export function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}
