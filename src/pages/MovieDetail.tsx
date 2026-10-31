// src/pages/MovieDetail.tsx
import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useMovieDetails } from "../hooks/useMovieDetails"
import CastCarousel from "../components/CastCarousel"
import PlayerModal from "../components/PlayerModal"
import MobilePlayBar from "../components/MobilePlayBar"
import VideoRow from "../components/VideoRow"
import MediaRow from "../components/MediaRow"
import { pickVideos, relatedItems, youtubeEmbed, type Video } from "../utils/media"
import { movieServers, RESUME_SERVER } from "../utils/servers"
import { getEntry, resumeTime, saveProgress, formatTime } from "../utils/watchHistory"
import { useHistoryEntry } from "../hooks/useWatchHistory"
import { motion } from "framer-motion"
import { Play, Star, Clock, Calendar, ChevronLeft, Clapperboard } from "lucide-react"

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const { data: m, isLoading } = useMovieDetails(movieId)
  const [watching, setWatching] = useState(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Saved progress → "Resume" button and the player's start time
  const saved = useHistoryEntry("movie", movieId)
  const resumeAt = resumeTime(saved)
  const [startAt, setStartAt] = useState(0)
  const [video, setVideo] = useState<Video | null>(null)

  const play = () => {
    setStartAt(resumeTime(getEntry("movie", movieId)))
    setWatching(true)
  }

  // Opened from Continue Watching (?play=1): go straight into the player
  useEffect(() => {
    if (m && searchParams.get("play")) {
      play()
      setSearchParams({}, { replace: true })
    }
  }, [m])

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
  const playLabel = resumeAt > 0 ? `Resume · ${formatTime(resumeAt)}` : "Watch Now"

  // Trailers & extras, and "More Like This"
  const videos = pickVideos(m.videos?.results)
  const trailer = videos.find((v) => v.type === "Trailer") ?? videos[0]
  const related = relatedItems(m, "movie")

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

          {trailer && (
            <button onClick={() => setVideo(trailer)} className="btn-secondary py-2 px-4 text-sm">
              <Clapperboard size={15} /> Trailer
            </button>
          )}

        </motion.div>

        <MobilePlayBar>
          <button onClick={play} className="btn-primary w-full justify-center py-3.5 text-base">
            <Play size={16} fill="white" /> {playLabel}
          </button>
        </MobilePlayBar>
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
              <button onClick={play} className="btn-primary">
                <Play size={16} fill="white" /> {playLabel}
              </button>
              {trailer && (
                <button onClick={() => setVideo(trailer)} className="btn-secondary">
                  <Clapperboard size={16} /> Trailer
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <VideoRow videos={videos} onPlay={setVideo} />

      {m.credits?.cast?.length > 0 && (
        <section className="px-5 md:px-16 py-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
            <h2 className="section-heading">Cast</h2>
          </div>
          <CastCarousel cast={m.credits.cast} />
        </section>
      )}

      {/* ── More Like This ───────────────────────────── */}
      <MediaRow title="More Like This" items={related} />

      <PlayerModal
        open={watching}
        onClose={() => setWatching(false)}
        servers={movieServers(movieId, m.imdb_id, startAt)}
        // Cinezo can't start mid-way, so resumes open on a server that takes a start time
        initialServer={startAt > 0 ? RESUME_SERVER : undefined}
        onPlayerEvent={(e) =>
          saveProgress({
            type: "movie",
            id: movieId,
            title: m.title,
            poster: m.poster_path,
            backdrop: m.backdrop_path,
            time: e.currentTime,
            duration: e.duration,
          })
        }
        title={m.title}
        subtitle={[year, m.runtime ? `${m.runtime} min` : null].filter(Boolean).join(" · ") || undefined}
        posterPath={m.poster_path}
      />

      {/* Trailer popup (reuses the player shell; one source, so no server switcher) */}
      <PlayerModal
        open={!!video}
        onClose={() => setVideo(null)}
        servers={video ? [{ name: "YouTube", src: youtubeEmbed(video.key) }] : []}
        title={m.title}
        subtitle={video?.name}
      />
    </div>
  )
}
