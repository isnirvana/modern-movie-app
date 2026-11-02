// src/components/Top10Row.tsx
// Netflix-style "Top 10": big outlined rank numbers tucked behind each poster
import { useRef } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Item = { id: number; media_type?: string; title?: string; name?: string; poster_path?: string | null }

export default function Top10Row({ title, items, isLoading }: { title: string; items: Item[]; isLoading?: boolean }) {
  const scrollRef = useRef<HTMLOListElement>(null)
  const top = items.filter((i) => i.poster_path).slice(0, 10)

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: (dir === "right" ? 1 : -1) * el.clientWidth * 0.85, behavior: "smooth" })
  }

  if (!isLoading && top.length === 0) return null

  return (
    <section className="py-5 md:py-6">
      <div className="flex items-center gap-3 px-5 md:px-12 mb-4">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">{title}</h2>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft size={20} />
        </button>

        <ol
          ref={scrollRef}
          className="flex overflow-x-auto px-5 md:px-12 pb-2 snap-x snap-mandatory scroll-px-5 md:scroll-px-12"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex-shrink-0 flex items-end pr-3 md:pr-4">
                  <span className="w-12 md:w-16" />
                  <div className="w-28 sm:w-32 md:w-40 rounded-xl skeleton" style={{ aspectRatio: "2/3" }} />
                </li>
              ))
            : top.map((item, i) => {
                const name = item.title || item.name || ""
                return (
                  <li key={`${item.media_type}-${item.id}`} className="flex-shrink-0 snap-start pr-3 md:pr-4">
                    <Link
                      to={`/${item.media_type === "tv" ? "tv" : "movie"}/${item.id}`}
                      className="group/top flex items-end"
                      aria-label={`Number ${i + 1}: ${name}`}
                    >
                      {/* Rank: outlined numeral that the poster overlaps */}
                      <span
                        aria-hidden="true"
                        className={`top10-rank relative z-0 font-black leading-[0.8] select-none ${
                          i === 9 ? "-mr-6 md:-mr-8 tracking-[-0.12em]" : "-mr-3 md:-mr-4"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div
                        className="relative z-10 w-28 sm:w-32 md:w-40 rounded-xl overflow-hidden bg-surface shadow-card ring-1 ring-white/10 transition-transform duration-300 group-hover/top:-translate-y-1 group-active/top:scale-[0.97]"
                        style={{ aspectRatio: "2/3" }}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                  </li>
                )
              })}
        </ol>

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
