// src/components/MediaTypeToggle.tsx
// Movies | TV segmented switch
import { motion } from "framer-motion"
import { Film, Tv } from "lucide-react"
import type { MediaType } from "../utils/genres"

export default function MediaTypeToggle({
  value,
  onChange,
  disabled,
  id = "media-type",
}: {
  value: MediaType
  onChange: (type: MediaType) => void
  disabled?: MediaType[] // types that can't be chosen here
  id?: string // unique per toggle on screen, for the sliding highlight
}) {
  const options = [
    { type: "movie" as const, label: "Movies", icon: Film },
    { type: "tv" as const, label: "TV Shows", icon: Tv },
  ]
  return (
    <div className="inline-flex p-1 rounded-xl bg-white/[0.06] border border-white/[0.08]" role="tablist">
      {options.map(({ type, label, icon: Icon }) => {
        const active = value === type
        const off = disabled?.includes(type)
        return (
          <button
            key={type}
            role="tab"
            aria-selected={active}
            disabled={off}
            onClick={() => onChange(type)}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
              active ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            )}
            <Icon size={14} className="relative" />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
