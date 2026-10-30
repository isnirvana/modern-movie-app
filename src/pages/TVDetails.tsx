// src/pages/TVDetails.tsx
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTVDetails } from "../hooks/useTVDetails"
import { useSeasonDetails } from "../hooks/useSeasonDetails"
import CastCarousel from "../components/CastCarousel"
import PlayerModal from "../components/PlayerModal"
import MobilePlayBar from "../components/MobilePlayBar"
import { tvServers } from "../utils/servers"
import { motion } from "framer-motion"
import { Play, Star, Calendar, ChevronLeft, ChevronDown, Tv } from "lucide-react"

export default function TVDetails() {
  const { id } = useParams<{ id: string }>()
  const tvId = Number(id)
  const { data: tv, isLoading } = useTVDetails(tvId)
  const navigate = useNavigate()

  const [season, setSeason] = useState(1)
  const { data: seasonData } = useSeasonDetails(tvId, season)
  const episodes = seasonData?.episodes || []
  const [episode, setEpisode] = useState(episodes[0]?.episode_number || 1)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    setEpisode(episodes[0]?.episode_number || 1)
  }, [season, episodes])

  if (isLoading || !tv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-gray-400 text-sm">Loading show…</p>
        </div>
      </div>
    )
  }

  const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : null
  const rating = tv.vote_average ?? 0
  const genres: { id: number; name: string }[] = tv.genres ?? []
  const seasons = tv.seasons ?? []

  const SeasonEpisodePickers = (
    <div className="flex flex-wrap gap-2">
      {/* Season */}
      <div className="relative">
        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="appearance-none pl-3 pr-7 py-2 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          {seasons.map((s: { season_number: number; name?: string }) => (
            <option key={s.season_number} value={s.season_number} className="bg-[#16161f] text-white">
              {s.name || `Season ${s.season_number}`}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {/* Episode */}
      <div className="relative">
        <select
          value={episode}
          onChange={(e) => setEpisode(Number(e.target.value))}
          disabled={!seasonData}
          className="appearance-none pl-3 pr-7 py-2 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          {episodes.map((ep: { episode_number: number; name: string }) => (
            <option key={ep.episode_number} value={ep.episode_number} className="bg-[#16161f] text-white">
              {ep.episode_number}. {ep.name}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )

  return (
    // Bottom padding on phones keeps the pinned play bar from covering the cast row
    <div className="text-white pb-24 md:pb-0">

      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT — Portrait poster + info below
      ══════════════════════════════════════════════ */}
      <div className="md:hidden -mt-14">
        {/* Poster */}
        <div className="relative w-full" style={{ aspectRatio: "3/3", maxHeight: "72vh" }}>
          <img
            src={`https://image.tmdb.org/t/p/w500${tv.poster_path}`}
            alt={tv.name}
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
          {/* TV badge */}
          <span className="absolute bottom-6 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-full bg-primary/80 text-white font-semibold">
            <Tv size={9} /> TV Series
          </span>
        </div>

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-5 pt-2 pb-6 space-y-3"
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
            {tv.name}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {rating > 0 && (
              <span className="flex items-center gap-1 text-gold font-semibold">
                <Star size={11} fill="currentColor" /> {rating.toFixed(1)}
              </span>
            )}
            {year && <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-500" /> {year}</span>}
            {seasons.length > 0 && <span>{seasons.length} Season{seasons.length > 1 ? "s" : ""}</span>}
          </div>

          {tv.overview && (
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{tv.overview}</p>
          )}

          {/* Pickers */}
          {SeasonEpisodePickers}
        </motion.div>

        <MobilePlayBar>
          <button onClick={() => setWatching(true)} className="btn-primary w-full justify-center py-3.5 text-base">
            <Play size={16} fill="white" /> Play S{season} E{episode}
          </button>
        </MobilePlayBar>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT — Cinematic backdrop banner
      ══════════════════════════════════════════════ */}
      <div className="hidden md:block relative w-full -mt-14" style={{ height: "90vh", minHeight: 560 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/65 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/40 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-12 flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition glass px-3 py-1.5 rounded-lg"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="absolute bottom-10 left-16 flex flex-row gap-8 items-end max-w-5xl">
          {tv.poster_path && (
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              src={`https://image.tmdb.org/t/p/w342${tv.poster_path}`}
              alt={tv.name}
              className="w-44 rounded-2xl shadow-card ring-1 ring-white/10 flex-shrink-0"
            />
          )}

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="space-y-4 pb-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-primary/20 text-primary font-semibold border border-primary/30">
                <Tv size={11} /> TV Series
              </span>
              {genres.map((g) => (
                <span key={g.id} className="px-3 py-1 text-xs rounded-full glass text-gray-300 font-medium">{g.name}</span>
              ))}
            </div>
            <h1 className="text-5xl xl:text-6xl font-black leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {tv.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              {rating > 0 && (
                <span className="flex items-center gap-1.5 text-gold font-semibold">
                  <Star size={14} fill="currentColor" /> {rating.toFixed(1)}/10
                </span>
              )}
              {year && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-500" /> {year}</span>}
              {seasons.length > 0 && <span className="text-gray-400">{seasons.length} Season{seasons.length > 1 ? "s" : ""}</span>}
            </div>
            {tv.overview && (
              <p className="text-sm text-gray-300 max-w-lg line-clamp-3 leading-relaxed">{tv.overview}</p>
            )}
            {SeasonEpisodePickers}
            <div className="pt-1">
              <button onClick={() => setWatching(true)} className="btn-primary">
                <Play size={16} fill="white" /> Play S{season} E{episode}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Cast ─────────────────────────────────────── */}
      {tv.credits?.cast?.length > 0 && (
        <section className="px-5 md:px-16 py-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
            <h2 className="section-heading">Cast</h2>
          </div>
          <CastCarousel cast={tv.credits.cast} />
        </section>
      )}

      <PlayerModal
        open={watching}
        onClose={() => setWatching(false)}
        servers={tvServers(tvId, season, episode, tv.external_ids?.imdb_id ?? tv.imdb_id)}
        title={tv.name}
        subtitle={`Season ${season} · Episode ${episode}`}
        posterPath={tv.poster_path}
      />
    </div>
  )
}
