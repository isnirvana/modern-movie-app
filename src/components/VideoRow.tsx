// src/components/VideoRow.tsx
// "Trailers & Extras": a side-scrolling row of YouTube videos for a title
import { useRef } from "react"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { youtubeThumb, type Video } from "../utils/media"

export default function VideoRow({ videos, onPlay }: { videos: Video[]; onPlay: (video: Video) => void }) {
  const rowRef = useRef<HTMLDivElement>(null)

  if (videos.length === 0) return null

  const scroll = (dir: "left" | "right") => {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: (dir === "right" ? 1 : -1) * row.clientWidth * 0.85, behavior: "smooth" })
  }

  return (
    <section className="py-6 md:py-8">
      <div className="flex items-center gap-3 px-5 md:px-16 mb-4">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">Trailers &amp; Extras</h2>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-4 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label="Scroll videos left"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto px-5 md:px-16 pb-2 snap-x snap-mandatory scroll-px-5 md:scroll-px-16"
          style={{ scrollbarWidth: "none" }}
        >
          {videos.map((v) => (
            <button
              key={v.key}
              onClick={() => onPlay(v)}
              className="group/vid flex-shrink-0 w-[70vw] max-w-[300px] sm:w-64 md:w-72 snap-start text-left"
              aria-label={`Play ${v.name}`}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-2">
                <img
                  src={youtubeThumb(v.key)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/vid:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/35 transition-colors">
                  <span className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                    <Play size={18} fill="white" className="ml-0.5" />
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500">{v.type}</p>
              <h3 className="mt-0.5 text-sm font-semibold text-white line-clamp-2">{v.name}</h3>
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-4 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label="Scroll videos right"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
