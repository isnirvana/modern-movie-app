// src/pages/TVDetails.tsx
import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useTVDetails } from "../hooks/useTVDetails"
import { useSeasonDetails } from "../hooks/useSeasonDetails"
import CastCarousel from "../components/CastCarousel"
import PlayerModal from "../components/PlayerModal"
import MobilePlayBar from "../components/MobilePlayBar"
import VideoRow from "../components/VideoRow"
import MyListButton from "../components/MyListButton"
import DetailsSection, { CertBadge, StatusPill } from "../components/DetailsSection"
import { tvCertification, tvDetails, tvStatus, languageName } from "../utils/details"
import MediaRow from "../components/MediaRow"
import { pickVideos, relatedItems, youtubeEmbed, type Video } from "../utils/media"
import NextUpCard from "../components/NextUpCard"
import EpisodeList, { type Episode, type Season } from "../components/EpisodeList"
import { tvServers, RESUME_SERVER } from "../utils/servers"
import { getEntry, resumeTime, saveProgress, markUpNext, formatTime } from "../utils/watchHistory"
import { useHistoryEntry } from "../hooks/useWatchHistory"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Star, Calendar, ChevronLeft, Tv, Clapperboard } from "lucide-react"

export default function TVDetails() {
  const { id } = useParams<{ id: string }>()
  const tvId = Number(id)
  const { data: tv, isLoading } = useTVDetails(tvId)
  const navigate = useNavigate()

  // Start on the last episode watched, if any
  const saved = useHistoryEntry("tv", tvId)
  const [season, setSeason] = useState(() => getEntry("tv", tvId)?.season ?? 1)
  const { data: seasonData } = useSeasonDetails(tvId, season)
  const episodes: Episode[] = seasonData?.episodes || []
  const [episode, setEpisode] = useState(() => getEntry("tv", tvId)?.episode ?? 1)
  // The season shown in the episode list; separate so browsing doesn't move the Play button
  const [browseSeason, setBrowseSeason] = useState(season)
  const { data: browseData, isLoading: browseLoading } = useSeasonDetails(tvId, browseSeason)
  const [watching, setWatching] = useState(false)
  const [startAt, setStartAt] = useState(0)
  const [showNext, setShowNext] = useState(false)
  const [video, setVideo] = useState<Video | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // If the chosen episode isn't in the loaded season, fall back to the season's first episode
  useEffect(() => {
    if (episodes.length && !episodes.some((ep) => ep.episode_number === episode)) {
      setEpisode(episodes[0].episode_number)
    }
  }, [episodes, episode])

  // Play the selected episode, or a specific one (from an episode card); resumes if it was left part-way
  const play = (s = season, ep = episode) => {
    setSeason(s)
    setEpisode(ep)
    setStartAt(resumeTime(getEntry("tv", tvId), s, ep))
    setShowNext(false)
    setWatching(true)
  }

  // Opened from Continue Watching (?play=1): go straight into the player
  useEffect(() => {
    if (tv && searchParams.get("play")) {
      play()
      setSearchParams({}, { replace: true })
    }
  }, [tv])

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
  const seasons: Season[] = tv.seasons ?? []
  const episodeName = episodes.find((ep) => ep.episode_number === episode)?.name

  // Trailers & extras, and "More Like This"
  const videos = pickVideos(tv.videos?.results)
  const trailer = videos.find((v) => v.type === "Trailer") ?? videos[0]
  const related = relatedItems(tv, "tv")
  // Age rating, status, creators, network
  const cert = tvCertification(tv)
  const status = tvStatus(tv.status)
  const details = tvDetails(tv)
  const seasonCount: number = tv.number_of_seasons ?? seasons.filter((s) => s.season_number > 0).length
  const foreignLanguage = tv.original_language && tv.original_language !== "en" ? languageName(tv.original_language) : null

  const listItem = {
    type: "tv" as const,
    id: tv.id,
    title: tv.name,
    poster_path: tv.poster_path,
    backdrop_path: tv.backdrop_path,
    vote_average: tv.vote_average,
    first_air_date: tv.first_air_date,
  }

  const resumeAt = resumeTime(saved, season, episode)
  const playLabel = resumeAt > 0
    ? `Resume S${season} E${episode} · ${formatTime(resumeAt)}`
    : `Play S${season} E${episode}`

  // Next aired episode: the next one in this season, else episode 1 of the next season
  const hasAired = (date?: string) => !date || new Date(date) <= new Date()
  const index = episodes.findIndex((ep) => ep.episode_number === episode)
  let next: { season: number; episode: number; name?: string; still?: string | null } | null = null
  if (index >= 0 && index < episodes.length - 1) {
    const ep = episodes[index + 1]
    if (hasAired(ep.air_date)) next = { season, episode: ep.episode_number, name: ep.name, still: ep.still_path }
  } else if (index === episodes.length - 1) {
    const nextSeason = seasons.find((s) => s.season_number === season + 1)
    if (nextSeason && nextSeason.air_date && hasAired(nextSeason.air_date)) next = { season: season + 1, episode: 1 }
  }

  const playNext = () => {
    if (!next) return
    setShowNext(false)
    setStartAt(0)
    setSeason(next.season)
    setEpisode(next.episode)
    setBrowseSeason(next.season)
  }

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
            <CertBadge cert={cert} />
            {year && <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-500" /> {year}</span>}
            {seasonCount > 0 && <span>{seasonCount} Season{seasonCount > 1 ? "s" : ""}</span>}
            {foreignLanguage && <span>{foreignLanguage}</span>}
            <StatusPill status={status} />
          </div>

          {tv.overview && (
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{tv.overview}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {trailer && (
              <button onClick={() => setVideo(trailer)} className="btn-secondary py-2 px-4 text-sm">
                <Clapperboard size={15} /> Trailer
              </button>
            )}
            <MyListButton item={listItem} className="btn-secondary py-2 px-4 text-sm" iconSize={15} />
          </div>
        </motion.div>

        <MobilePlayBar>
          <button onClick={() => play()} className="btn-primary w-full justify-center py-3.5 text-base">
            <Play size={16} fill="white" /> {playLabel}
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
              <CertBadge cert={cert} large />
              {year && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-500" /> {year}</span>}
              {seasonCount > 0 && <span className="text-gray-400">{seasonCount} Season{seasonCount > 1 ? "s" : ""}</span>}
              {foreignLanguage && <span className="text-gray-400">{foreignLanguage}</span>}
              <StatusPill status={status} large />
            </div>
            {tv.overview && (
              <p className="text-sm text-gray-300 max-w-lg line-clamp-3 leading-relaxed">{tv.overview}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => play()} className="btn-primary">
                <Play size={16} fill="white" /> {playLabel}
              </button>
              {trailer && (
                <button onClick={() => setVideo(trailer)} className="btn-secondary">
                  <Clapperboard size={16} /> Trailer
                </button>
              )}
              <MyListButton item={listItem} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Episodes ─────────────────────────────────── */}
      <EpisodeList
        seasons={seasons}
        activeSeason={browseSeason}
        onSeasonChange={setBrowseSeason}
        episodes={(browseData?.episodes as Episode[]) ?? []}
        loading={browseLoading}
        current={{ season, episode }}
        progress={
          saved?.season != null && saved.episode != null && saved.duration > 0
            ? { season: saved.season, episode: saved.episode, percent: Math.min(100, (saved.time / saved.duration) * 100) }
            : undefined
        }
        fallbackImage={tv.backdrop_path}
        onPlay={(ep) => play(browseSeason, ep)}
      />

      <VideoRow videos={videos} onPlay={setVideo} />

      <DetailsSection
        rows={details.rows}
        companies={details.companies}
        companiesLabel={tv.networks?.length ? "Network" : "Studios"}
      />

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

      {/* ── More Like This ───────────────────────────── */}
      <MediaRow title="More Like This" items={related} />

      <PlayerModal
        open={watching}
        onClose={() => { setWatching(false); setShowNext(false) }}
        servers={tvServers(tvId, season, episode, tv.external_ids?.imdb_id ?? tv.imdb_id, startAt)}
        // Cinezo can't start mid-way, so resumes open on a server that takes a start time
        initialServer={startAt > 0 ? RESUME_SERVER : undefined}
        onPlayerEvent={(e) => {
          saveProgress({
            type: "tv",
            id: tvId,
            title: tv.name,
            poster: tv.poster_path,
            backdrop: tv.backdrop_path,
            season,
            episode,
            time: e.currentTime,
            duration: e.duration,
          })
          if (e.event === "ended" && next) {
            markUpNext({ type: "tv", id: tvId, title: tv.name, poster: tv.poster_path, backdrop: tv.backdrop_path, season: next.season, episode: next.episode })
            setShowNext(true)
          }
        }}
        overlay={
          <AnimatePresence>
            {showNext && next && (
              <NextUpCard
                key={`${next.season}-${next.episode}`}
                label={`S${next.season} E${next.episode}`}
                name={next.name}
                stillPath={next.still}
                onPlay={playNext}
                onCancel={() => setShowNext(false)}
              />
            )}
          </AnimatePresence>
        }
        title={tv.name}
        subtitle={`Season ${season} · Episode ${episode}${episodeName ? ` · ${episodeName}` : ""}`}
        posterPath={tv.poster_path}
        backdropPath={tv.backdrop_path}
      />

      {/* Trailer popup (reuses the player shell; one source, so no server switcher) */}
      <PlayerModal
        open={!!video}
        onClose={() => setVideo(null)}
        servers={video ? [{ name: "YouTube", src: youtubeEmbed(video.key) }] : []}
        title={tv.name}
        subtitle={video?.name}
      />
    </div>
  )
}
