// src/components/ContinueWatching.tsx
// Home row of titles the viewer started, with progress bars. Tapping one resumes playback.
import { useRef } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react"
import { useWatchHistory } from "../hooks/useWatchHistory"
import { removeEntry, isFinished, formatTime, type HistoryEntry } from "../utils/watchHistory"

function caption(e: HistoryEntry) {
  if (e.duration === 0) return `S${e.season} E${e.episode} · Up next`
  const left = Math.max(0, e.duration - e.time)
  const remaining = isFinished(e) ? "Finished" : left >= 60 ? `${Math.round(left / 60)} min left` : `${formatTime(left)} left`
  return e.type === "tv" ? `S${e.season} E${e.episode} · ${remaining}` : remaining
}

export default function ContinueWatching() {
  const history = useWatchHistory()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (history.length === 0) return null

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: (dir === "right" ? 1 : -1) * el.clientWidth * 0.85, behavior: "smooth" })
  }

  return (
    <section className="py-5 md:py-6">
      <div className="flex items-center gap-3 px-5 md:px-12 mb-4">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">Continue Watching</h2>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label="Scroll Continue Watching left"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto px-5 md:px-12 pb-2 snap-x snap-mandatory scroll-px-5 md:scroll-px-12"
          style={{ scrollbarWidth: "none" }}
        >
          <AnimatePresence initial={false}>
            {history.map((e) => {
              const progress = e.duration > 0 ? Math.min(100, (e.time / e.duration) * 100) : 0
              const image = e.backdrop ?? e.poster
              return (
                <motion.div
                  key={`${e.type}-${e.id}`}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative flex-shrink-0 w-60 sm:w-64 md:w-72 snap-start group/card"
                >
                  <Link to={`/${e.type}/${e.id}?play=1`} className="block">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-2 shadow-card">
                      {image && (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${image}`}
                          alt={e.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      {/* Play hint */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 flex items-center justify-center md:opacity-0 md:group-hover/card:opacity-100 transition-opacity">
                          <Play size={18} fill="white" className="ml-0.5" />
                        </span>
                      </div>

                      {/* Title + where you are */}
                      <div className="absolute left-3 right-3 bottom-3">
                        <p className="text-sm font-semibold text-white truncate">{e.title}</p>
                        <p className="text-[11px] text-gray-300 mt-0.5">{caption(e)}</p>
                      </div>

                      {/* Progress */}
                      <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/15">
                        <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </Link>

                  {/* Remove from the row */}
                  <button
                    onClick={() => removeEntry(e.type, e.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/80 transition-colors md:opacity-0 md:group-hover/card:opacity-100"
                    aria-label={`Remove ${e.title} from Continue Watching`}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label="Scroll Continue Watching right"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
