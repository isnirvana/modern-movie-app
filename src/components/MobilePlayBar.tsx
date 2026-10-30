// src/components/MobilePlayBar.tsx
// Phones only: keeps the main play button within thumb reach, just above the tab bar
import { ReactNode } from "react"

export default function MobilePlayBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="md:hidden fixed left-0 right-0 z-40 px-4 pt-6 pb-3 pointer-events-none"
      style={{
        bottom: "calc(4rem + env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, #0a0a0f 55%, rgba(10,10,15,0.85) 75%, transparent)",
      }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
