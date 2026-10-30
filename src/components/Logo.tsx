// src/components/Logo.tsx
import { useId } from "react"

// Lumo mark: play button with a glow arc on the brand gradient
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const gradientId = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6c63ff" />
          <stop offset="1" stopColor="#f72585" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gradientId})`} />
      <path d="M24 19.5 L43 32 L24 44.5 Z" fill="#fff" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      <path d="M47 17 A21 21 0 0 1 47 47" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

// Mark + "lumo" wordmark, used in the navbar, drawer and footer
export default function Logo({ size = 32, textClassName = "text-xl", hideTextOnMobile = false }: {
  size?: number
  textClassName?: string
  hideTextOnMobile?: boolean
}) {
  return (
    <span className="flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_0_12px_rgba(108,99,255,0.35)]" />
      <span className={`text-gradient font-extrabold tracking-tight ${textClassName} ${hideTextOnMobile ? "hidden sm:inline" : ""}`}>
        lumo
      </span>
    </span>
  )
}
