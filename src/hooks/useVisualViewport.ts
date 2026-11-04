// src/hooks/useVisualViewport.ts
// The part of the screen left visible by the on-screen keyboard. iPhones keep fixed elements laid out against
// the whole screen when the keyboard opens, so a sheet at the bottom ends up behind it; a dialog sized and
// placed with this stays above the keyboard instead. Null where the browser can't tell (then: the whole screen).
import { useEffect, useState } from "react"

type Area = { top: number; height: number }

export function useVisualViewport(): Area | null {
  const [area, setArea] = useState<Area | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setArea({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])
  return area
}

// Style for a full-screen overlay that keeps to the visible area
export const visibleAreaStyle = (area: Area | null) =>
  area ? { top: area.top, height: area.height, bottom: "auto" } : undefined
