// src/components/HeroCarousel.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Info, Star } from "lucide-react"
import TitleLogo from "./TitleLogo"
import HeroTrailer, { MuteButton, type TrailerStatus } from "./HeroTrailer"
import { useTitleExtras } from "../hooks/useTitleExtras"
import { useIsDesktop } from "../hooks/useMediaQuery"

interface HeroItem {
  id: number
  title?: string
  name?: string
  backdrop_path: string
  poster_path?: string
  overview?: string
  vote_average?: number
  media_type?: "movie" | "tv"
}

export default function HeroCarousel({ items: allItems }: { items: HeroItem[] }) {
  const items = allItems.filter((i) => i.backdrop_path)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [trailerStatus, setTrailerStatus] = useState<TrailerStatus>("waiting")
  // Sound stays as the viewer left it from slide to slide
  const [muted, setMuted] = useState(true)
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const current = items[Math.min(index, items.length - 1)]
  const next = items[(index + 1) % Math.max(items.length, 1)]
  const extras = useTitleExtras(current?.media_type || "movie", current?.id ?? 0)
  // Fetch the next slide's logo/trailer ahead of time
  useTitleExtras(next?.media_type || "movie", next?.id ?? 0)

  // Hold the slide while its trailer loads or plays; move on 6s after it's done (or straight away without one)
  const trailerBusy = trailerStatus === "loading" || trailerStatus === "playing"
  useEffect(() => {
    if (paused || trailerBusy || items.length === 0) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [items.length, paused, trailerBusy])

  if (!current) return null

  const title = current.title || current.name || ""
  // undefined while looking it up, null when there's none
  const logo = extras.data ? extras.data.logo : extras.isError ? null : undefined
  const trailer = (
    <HeroTrailer key={current.id} videoKey={extras.data?.trailer?.key} muted={muted} onStatus={setTrailerStatus} />
  )
  const muteButton = trailerStatus === "playing" && <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} />
  const rating = current.vote_average ?? 0

  const handlePlay = () => {
    const type = current.media_type || "movie"
    navigate(`/${type}/${current.id}`)
  }

  return (
    <>
      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT — Netflix-style portrait poster
      ══════════════════════════════════════════════ */}
      <div className="md:hidden relative w-full -mt-14">
        {/* Poster */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-${current.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full"
            style={{ aspectRatio: "3/3", maxHeight: "72vh" }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${current.poster_path || current.backdrop_path}`}
              alt={title}
              className="w-full h-full object-cover object-top"
              style={{ maxHeight: "72vh" }}
            />
            {!isDesktop && trailer}
            {/* Bottom fade into bg (tall: the title and buttons sit on it) */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[60%]"
              style={{
                background: "linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.92) 30%, rgba(10,10,15,0.5) 65%, transparent 100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {!isDesktop && muteButton && <div className="absolute top-20 right-4 z-10">{muteButton}</div>}

        {/* Content: pulled up over the poster's bottom fade so Watch Now sits well above the tab bar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-content-${current.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 -mt-32 px-5 pb-5 space-y-3"
          >
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/25">
                <Star size={10} fill="currentColor" /> {rating.toFixed(1)}
              </span>
            )}
            <TitleLogo
              title={title}
              logo={logo}
              textClassName="text-2xl font-black leading-tight"
              logoClassName="max-h-20 max-w-[75%]"
            />
            {current.overview && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {current.overview}
              </p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={handlePlay} className="btn-primary py-2.5 text-sm">
                <Play size={14} fill="currentColor" /> Watch Now
              </button>
              <button onClick={handlePlay} className="btn-secondary py-2.5 text-sm">
                <Info size={14} /> Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 pb-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${i === index ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/30"
                }`}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT — Cinematic wide backdrop
      ══════════════════════════════════════════════ */}
      <div
        className="hidden md:block relative w-full -mt-14 overflow-hidden"
        style={{ height: "92vh", minHeight: 520 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${current.backdrop_path})`,
            }}
          />
        </AnimatePresence>

        {isDesktop && trailer}

        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/30 to-transparent" />

        {isDesktop && muteButton && <div className="absolute bottom-24 right-16 z-10">{muteButton}</div>}

        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current.id}`}
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute bottom-24 left-16 max-w-xl space-y-5"
          >
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/25">
                <Star size={11} fill="currentColor" /> {rating.toFixed(1)} / 10
              </span>
            )}
            <TitleLogo
              title={title}
              logo={logo}
              textClassName="text-5xl xl:text-6xl font-black leading-tight"
              logoClassName="max-h-36 max-w-md"
            />
            {current.overview && (
              <p className="text-base text-gray-300 line-clamp-3 max-w-md leading-relaxed">
                {current.overview}
              </p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={handlePlay} className="btn-primary">
                <Play size={16} fill="currentColor" /> Watch Now
              </button>
              <button onClick={handlePlay} className="btn-secondary">
                <Info size={16} /> More Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`rounded-full transition-all duration-400 ${i === index ? "w-7 h-2 bg-primary shadow-glow" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
