// src/components/CastCarousel.tsx
import { useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CastMember {
  cast_id?: number
  id?: number
  name: string
  character: string
  profile_path: string | null
}

export default function CastCarousel({ cast }: { cast: CastMember[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" })
  }

  const filtered = cast?.filter((c) => c.profile_path) ?? []

  if (filtered.length === 0) return null

  return (
    <div className="relative group">
      {/* Scroll left */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto py-3 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filtered.map((c, i) => (
          <motion.div
            key={c.cast_id ?? c.id ?? i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="flex-shrink-0 w-24 text-center group/card"
          >
            <div className="relative mx-auto w-20 h-20 mb-2">
              <img
                src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                alt={c.name}
                className="w-full h-full object-cover rounded-full ring-2 ring-surface-3 group-hover/card:ring-primary transition-all duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <p className="text-xs font-semibold text-white truncate px-1">{c.name}</p>
            <p className="text-[10px] text-gray-500 truncate px-1 mt-0.5">{c.character}</p>
          </motion.div>
        ))}
      </div>

      {/* Scroll right */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
