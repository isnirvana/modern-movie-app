// src/pages/MovieDetail.tsx
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMovieDetails } from "../hooks/useMovieDetails"
import CastCarousel from "../components/CastCarousel"
import { motion, AnimatePresence } from "framer-motion"
import { Play, X, Star, Clock, Calendar, ChevronLeft } from "lucide-react"

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const { data: m, isLoading } = useMovieDetails(movieId)
  const [watching, setWatching] = useState(false)
  const navigate = useNavigate()
  const imdbId = m?.imdb_id

  useEffect(() => {
    if (!watching) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [watching])

  if (isLoading || !m) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-gray-400 text-sm">Loading movie…</p>
        </div>
      </div>
    )
  }

  const year = m.release_date ? new Date(m.release_date).getFullYear() : null
  const rating = m.vote_average ?? 0
  const genres: { id: number; name: string }[] = m.genres ?? []

  return (
    <div className="text-white">

      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT — Portrait poster + info below
      ══════════════════════════════════════════════ */}
      <div className="md:hidden -mt-14">
        {/* Poster */}
        <div className="relative w-full" style={{ aspectRatio: "3/3", maxHeight: "72vh" }}>
          <img
            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
            alt={m.title}
            className="w-full h-full object-cover object-top"
            style={{ maxHeight: "72vh" }}
          />
          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40"
            style={{ background: "linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.8) 40%, transparent 100%)" }}
          />
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-16 left-4 flex items-center gap-1 text-sm text-white/80 hover:text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg"
          >
            <ChevronLeft size={15} /> Back
          </button>
        </div>

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-5 pt-2 pb-8 space-y-3"
        >
          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <span key={g.id} className="px-2.5 py-0.5 text-[10px] rounded-full bg-white/10 text-gray-300 font-medium">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-2xl font-black leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {m.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {rating > 0 && (
              <span className="flex items-center gap-1 text-gold font-semibold">
                <Star size={11} fill="currentColor" /> {rating.toFixed(1)}
              </span>
            )}
            {year && <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-500" /> {year}</span>}
            {m.runtime && <span className="flex items-center gap-1"><Clock size={11} className="text-gray-500" /> {m.runtime} min</span>}
          </div>

          {m.overview && (
            <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed">{m.overview}</p>
          )}

          <button onClick={() => setWatching(true)} className="btn-primary w-full justify-center py-3">
            <Play size={15} fill="white" /> Watch Now
          </button>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT — Cinematic backdrop banner
      ══════════════════════════════════════════════ */}
      <div className="hidden md:block relative w-full -mt-14" style={{ height: "90vh", minHeight: 520 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${m.backdrop_path})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/40 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-12 flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition glass px-3 py-1.5 rounded-lg"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="absolute bottom-12 left-16 flex flex-row gap-8 items-end max-w-5xl">
          {m.poster_path && (
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
              alt={m.title}
              className="w-44 rounded-2xl shadow-card ring-1 ring-white/10 flex-shrink-0"
            />
          )}

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="space-y-4 pb-2"
          >
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 text-xs rounded-full glass text-gray-300 font-medium">{g.name}</span>
                ))}
              </div>
            )}
            <h1 className="text-5xl xl:text-6xl font-black leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {m.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              {rating > 0 && (
                <span className="flex items-center gap-1.5 text-gold font-semibold">
                  <Star size={14} fill="currentColor" /> {rating.toFixed(1)}/10
                </span>
              )}
              {year && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-500" /> {year}</span>}
              {m.runtime && <span className="flex items-center gap-1.5"><Clock size={13} className="text-gray-500" /> {m.runtime} min</span>}
            </div>
            {m.overview && (
              <p className="text-sm text-gray-300 max-w-lg line-clamp-4 leading-relaxed">{m.overview}</p>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setWatching(true)} className="btn-primary">
                <Play size={16} fill="white" /> Watch Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {m.credits?.cast?.length > 0 && (
        <section className="px-5 md:px-16 py-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
            <h2 className="section-heading">Cast</h2>
          </div>
          <CastCarousel cast={m.credits.cast} />
        </section>
      )}

      <AnimatePresence>
        {watching && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[79] bg-black/85"
              style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWatching(false)}
            />

            <motion.div
              key="mobile-panel"
              className="md:hidden fixed inset-0 z-[80] flex flex-col"
              style={{
                background: "linear-gradient(160deg, #0f1117 0%, #0a0c14 100%)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
                style={{
                  background: "linear-gradient(90deg, rgba(108,99,255,0.14) 0%, rgba(247,37,133,0.07) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {m.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    alt={m.title}
                    className="w-9 h-14 object-cover rounded-lg flex-shrink-0 ring-1 ring-white/10"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-primary/70 font-semibold mb-0.5">Now Watching</p>
                  <h3 className="text-sm font-bold text-white leading-snug truncate">{m.title}</h3>
                  {m.release_date && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(m.release_date).getFullYear()}{m.runtime ? ` · ${m.runtime} min` : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setWatching(false)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="flex-shrink-0 h-[2px]" style={{ background: "linear-gradient(90deg,#6c63ff,#f72585,transparent)" }} />
              <div className="flex-1 relative bg-black" style={{ minHeight: 0 }}>
                <iframe
                  src={imdbId ? `https://vidfast.vc/movie/${imdbId}` : ""}
                  allowFullScreen
                  allow="autoplay; fullscreen"
                  className="absolute inset-0 w-full h-full"
                  style={{ border: "none" }}
                />
              </div>
            </motion.div>

            <motion.div
              key="desktop-panel"
              className="hidden md:flex fixed inset-0 z-[80] items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative w-full max-w-5xl rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #0f1117 0%, #0a0c14 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.85)",
                }}
                initial={{ scale: 0.93, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{
                    background: "linear-gradient(90deg, rgba(108,99,255,0.14) 0%, rgba(247,37,133,0.07) 100%)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {m.poster_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                      alt={m.title}
                      className="w-9 h-14 object-cover rounded-lg flex-shrink-0 ring-1 ring-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-primary/70 font-semibold mb-0.5">Now Watching</p>
                    <h3 className="text-base font-bold text-white leading-snug truncate">{m.title}</h3>
                    {m.release_date && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(m.release_date).getFullYear()}{m.runtime ? ` · ${m.runtime} min` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setWatching(false)}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    aria-label="Close"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#6c63ff,#f72585,transparent)" }} />
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={imdbId ? `https://vidfast.vc/movie/${imdbId}` : ""}
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    className="absolute inset-0 w-full h-full"
                    style={{ border: "none" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
