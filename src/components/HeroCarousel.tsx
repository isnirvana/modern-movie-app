// src/components/HeroCarousel.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Info, Star } from "lucide-react"

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

export default function HeroCarousel({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (paused || items.length === 0) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [items.length, paused])

  if (items.length === 0) return null

  const current = items[index]
  const title = current.title || current.name || ""
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
            {/* Bottom fade into bg */}
            <div
              className="absolute bottom-0 left-0 right-0 h-40"
              style={{
                background: "linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.85) 40%, transparent 100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Content below poster */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-content-${current.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="px-5 pt-3 pb-6 space-y-3"
          >
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/25">
                <Star size={10} fill="currentColor" /> {rating.toFixed(1)}
              </span>
            )}
            <h1
              className="text-2xl font-black leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {title}
            </h1>
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

        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/30 to-transparent" />

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
            <h1
              className="text-5xl xl:text-6xl font-black leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {title}
            </h1>
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
              className={`rounded-full transition-all duration-400 ${i === index ? "w-7 h-2 bg-primary shadow-glow" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
