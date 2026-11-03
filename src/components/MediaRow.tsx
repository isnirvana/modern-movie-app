// src/components/MediaRow.tsx
import { useRef } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import MovieCard from "./MovieCard"

interface MediaRowProps {
  title: string
  // Small label above the title, e.g. "Because you watched" over the title it's based on
  kicker?: string
  items: Array<{ id: number; media_type?: string; [key: string]: any }>
  isLoading?: boolean
  // Optional "See all" link shown next to the title
  to?: string
}

export default function MediaRow({ title, kicker, items, isLoading, to }: MediaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: (dir === "right" ? 1 : -1) * el.clientWidth * 0.85, behavior: "smooth" })
  }

  if (!isLoading && items.length === 0) return null

  return (
    <section className="py-5 md:py-6">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4 px-5 md:px-12 mb-4">
        {/* Long titles stay on one line (cut short with …) rather than wrapping into the See all link */}
        <div className="flex items-stretch gap-3 min-w-0">
          <span className={`w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-accent ${kicker ? "" : "h-6 self-center"}`} />
          <div className="min-w-0">
            {kicker && (
              <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-gray-500 leading-none mb-1.5">{kicker}</p>
            )}
            <h2 className="section-heading truncate leading-tight" title={title}>{title}</h2>
          </div>
        </div>
        {to && (
          <Link to={to} className="shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors font-medium">
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="relative group">
        {/* Scroll left */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label={`Scroll ${kicker ? `${kicker} ` : ""}${title} left`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto px-5 md:px-12 pb-2 snap-x snap-mandatory scroll-px-5 md:scroll-px-12"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32 sm:w-36 md:w-44 rounded-2xl skeleton" style={{ aspectRatio: "2/3" }} />
              ))
            : items.map((item) => (
                <Link
                  key={`${item.media_type}-${item.id}`}
                  to={item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`}
                  className="flex-shrink-0 w-32 sm:w-36 md:w-44 snap-start"
                >
                  <MovieCard movie={item} />
                </Link>
              ))}
        </div>

        {/* Scroll right */}
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label={`Scroll ${kicker ? `${kicker} ` : ""}${title} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
