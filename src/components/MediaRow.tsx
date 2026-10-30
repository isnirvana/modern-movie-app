// src/components/MediaRow.tsx
import { useRef } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import MovieCard from "./MovieCard"

interface MediaRowProps {
  title: string
  items: Array<{ id: number; media_type?: string; [key: string]: any }>
  isLoading?: boolean
  // Optional "See all" link shown next to the title
  to?: string
}

export default function MediaRow({ title, items, isLoading, to }: MediaRowProps) {
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
      <div className="flex items-center justify-between px-5 md:px-12 mb-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="section-heading">{title}</h2>
        </div>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors font-medium">
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="relative group">
        {/* Scroll left */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label={`Scroll ${title} left`}
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
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
