// src/components/NextUpCard.tsx
// "Up next" card with a countdown, shown over the player when an episode ends
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Play, X } from "lucide-react"

type Props = {
  label: string // e.g. "S1 E3"
  name?: string // episode title, if known
  stillPath?: string | null
  seconds?: number
  onPlay: () => void
  onCancel: () => void
}

export default function NextUpCard({ label, name, stillPath, seconds = 10, onPlay, onCancel }: Props) {
  const [left, setLeft] = useState(seconds)
  // Ref so a parent re-render doesn't restart the countdown
  const onPlayRef = useRef(onPlay)
  onPlayRef.current = onPlay

  useEffect(() => {
    if (left <= 0) {
      onPlayRef.current()
      return
    }
    const timer = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="absolute z-10 right-3 bottom-3 left-3 sm:left-auto sm:w-80 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(14,14,24,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
      }}
      role="status"
    >
      <div className="flex gap-3 p-3">
        {stillPath && (
          <img
            src={`https://image.tmdb.org/t/p/w185${stillPath}`}
            alt=""
            className="w-24 aspect-video object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold">Up next · {left}s</p>
          <p className="text-sm font-bold text-white mt-0.5">{label}</p>
          {name && <p className="text-xs text-gray-400 truncate">{name}</p>}
        </div>
      </div>

      {/* Countdown bar */}
      <div className="h-[3px] bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: seconds, ease: "linear" }}
        />
      </div>

      <div className="flex gap-2 p-3">
        <button onClick={onPlay} className="btn-primary flex-1 justify-center py-2 text-sm">
          <Play size={14} fill="white" /> Play now
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 bg-white/[0.07] hover:bg-white/15 transition-colors"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </motion.div>
  )
}
