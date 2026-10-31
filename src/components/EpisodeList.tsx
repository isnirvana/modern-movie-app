// src/components/EpisodeList.tsx
// Apple TV-style episode browser: season tabs over a side-scrolling row of episode cards
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"

export type Episode = {
  episode_number: number
  name: string
  overview?: string
  runtime?: number | null
  air_date?: string
  still_path?: string | null
}

export type Season = { season_number: number; name?: string; air_date?: string; episode_count?: number }

type Props = {
  seasons: Season[]
  activeSeason: number // the season being browsed
  onSeasonChange: (season: number) => void
  episodes: Episode[]
  loading?: boolean
  current: { season: number; episode: number } // the episode the Play button points at
  progress?: { season: number; episode: number; percent: number } // saved progress, if any
  fallbackImage?: string | null // used when an episode has no still
  onPlay: (episode: number) => void
}

const hasAired = (date?: string) => !!date && new Date(date) <= new Date()
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

export default function EpisodeList({
  seasons,
  activeSeason,
  onSeasonChange,
  episodes,
  loading,
  current,
  progress,
  fallbackImage,
  onPlay,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  // Regular seasons in order, Specials (season 0) last — like Apple TV
  const ordered = [...seasons.filter((s) => s.season_number > 0), ...seasons.filter((s) => s.season_number === 0)]

  // Bring the current episode into view when its season is shown; otherwise start at the beginning
  useEffect(() => {
    const row = rowRef.current
    if (!row || !episodes.length) return
    const el = activeSeason === current.season
      ? row.querySelector<HTMLElement>(`[data-episode="${current.episode}"]`)
      : null
    const padding = parseFloat(getComputedStyle(row).paddingLeft) || 0
    row.scrollTo({ left: el ? el.offsetLeft - row.offsetLeft - padding : 0, behavior: "auto" })
  }, [activeSeason, episodes.length])

  const scroll = (dir: "left" | "right") => {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: (dir === "right" ? 1 : -1) * row.clientWidth * 0.85, behavior: "smooth" })
  }

  return (
    <section className="py-6 md:py-8">
      {/* Header + season tabs */}
      <div className="px-5 md:px-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="section-heading">Episodes</h2>
        </div>

        {ordered.length > 1 && (
          <div
            className="flex gap-1 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 border-b border-white/[0.07]"
            role="tablist"
            aria-label="Seasons"
          >
            {ordered.map((s) => {
              const active = s.season_number === activeSeason
              const label = s.season_number === 0 ? "Specials" : s.name || `Season ${s.season_number}`
              return (
                <button
                  key={s.season_number}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSeasonChange(s.season_number)}
                  className={`relative flex-shrink-0 px-3 md:px-4 py-3 text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="season-tab"
                      className="absolute left-2 right-2 -bottom-px h-[3px] rounded-t-full bg-gradient-to-r from-primary to-accent"
                      transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Episode row */}
      <div className="relative group mt-5">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-4 top-[30%] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label="Scroll episodes left"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto px-5 md:px-16 pb-2 snap-x snap-mandatory scroll-px-5 md:scroll-px-16"
          style={{ scrollbarWidth: "none" }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[78vw] max-w-[320px] sm:w-72 md:w-80">
                  <div className="aspect-video rounded-xl skeleton" />
                  <div className="h-3 w-20 rounded skeleton mt-3" />
                  <div className="h-4 w-40 rounded skeleton mt-2" />
                  <div className="h-3 w-full rounded skeleton mt-2" />
                </div>
              ))
            : episodes.map((ep) => {
                const aired = hasAired(ep.air_date)
                const isCurrent = activeSeason === current.season && ep.episode_number === current.episode
                const percent =
                  progress && progress.season === activeSeason && progress.episode === ep.episode_number
                    ? progress.percent
                    : 0
                const image = ep.still_path ?? fallbackImage
                const meta = [
                  ep.runtime ? `${ep.runtime} min` : null,
                  ep.air_date ? formatDate(ep.air_date) : null,
                ].filter(Boolean).join(" · ")

                return (
                  <button
                    key={ep.episode_number}
                    data-episode={ep.episode_number}
                    onClick={() => aired && onPlay(ep.episode_number)}
                    disabled={!aired}
                    className="group/ep flex-shrink-0 w-[78vw] max-w-[320px] sm:w-72 md:w-80 snap-start text-left disabled:cursor-default"
                    aria-label={`Episode ${ep.episode_number}: ${ep.name}${aired ? "" : " (not aired yet)"}`}
                  >
                    {/* Still */}
                    <div
                      className={`relative aspect-video rounded-xl overflow-hidden bg-surface-2 ring-2 transition-shadow ${
                        isCurrent ? "ring-primary shadow-glow" : "ring-transparent"
                      }`}
                    >
                      {image && (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${image}`}
                          alt=""
                          loading="lazy"
                          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                            aired ? "group-hover/ep:scale-105" : "opacity-40 grayscale"
                          } ${ep.still_path ? "" : "opacity-50"}`}
                        />
                      )}

                      {aired ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/ep:bg-black/30 transition-colors">
                          <span className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity">
                            <Play size={18} fill="white" className="ml-0.5" />
                          </span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="px-3 py-1 rounded-full bg-black/60 text-xs font-semibold text-gray-200">
                            {ep.air_date ? `Coming ${formatDate(ep.air_date)}` : "Coming soon"}
                          </span>
                        </div>
                      )}

                      {percent > 0 && (
                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/20">
                          <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <p className="mt-3 text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500">
                      Episode {ep.episode_number}
                      {isCurrent && <span className="text-primary"> · {percent > 0 ? "Resume" : "Up next"}</span>}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-white line-clamp-1">{ep.name}</h3>
                    {ep.overview && (
                      <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-3">{ep.overview}</p>
                    )}
                    {meta && <p className="mt-2 text-[11px] text-gray-500">{meta}</p>}
                  </button>
                )
              })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-4 top-[30%] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
          aria-label="Scroll episodes right"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
