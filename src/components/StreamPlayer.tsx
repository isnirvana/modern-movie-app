// src/components/StreamPlayer.tsx
// Our own player (Vidstack) for servers that give us a direct HLS stream. Loaded lazily by PlayerModal.
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { MediaPlayer, MediaProvider, Poster, Track, isHLSProvider, type MediaPlayerInstance } from "@vidstack/react"
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default"
import "@vidstack/react/player/styles/default/theme.css"
import "@vidstack/react/player/styles/default/layouts/video.css"
import { fetchStreamUrl, fetchSubtitles, type Subtitle } from "../utils/primeflix"
import type { PlayerEvent } from "../utils/servers"

type Props = {
  server: string
  api: string
  subtitlesApi: string
  startAt: number
  title: string
  subtitle?: string
  // TMDB backdrop, shown while loading and as the poster
  backdropPath?: string | null
  // Another server to offer when this one can't play (e.g. the default)
  fallback?: { name: string; onSelect: () => void }
  // Fired once this player shows its own loading screen (hides PlayerModal's spinner)
  onLoad: () => void
  onEvent: (e: PlayerEvent) => void
}

type State = { status: "loading" } | { status: "ready"; url: string; subtitles: Subtitle[] } | { status: "error"; message: string }

// After this long without playable video, suggest another server
const SLOW_AFTER_MS = 12000

export default function StreamPlayer({ server, api, subtitlesApi, startAt, title, subtitle, backdropPath, fallback, onLoad, onEvent }: Props) {
  const [state, setState] = useState<State>({ status: "loading" })
  const [canPlay, setCanPlay] = useState(false)
  const [slow, setSlow] = useState(false)
  const player = useRef<MediaPlayerInstance>(null)

  // Our loading screen takes over from PlayerModal's spinner straight away
  useEffect(() => onLoad(), [])

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    setCanPlay(false)
    setSlow(false)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    Promise.all([fetchStreamUrl(api, server, ctrl.signal), fetchSubtitles(subtitlesApi, ctrl.signal)])
      .then(([url, subtitles]) =>
        setState(
          url
            ? { status: "ready", url, subtitles }
            : { status: "error", message: `${server} doesn't have this title.` },
        ),
      )
      .catch((err) => {
        if (ctrl.signal.aborted) return
        console.error(`[${server}]`, err)
        setState({ status: "error", message: `${server} isn't responding right now.` })
      })
    return () => {
      ctrl.abort()
      clearTimeout(slowTimer)
    }
  }, [server, api, subtitlesApi])

  const emit = (event: PlayerEvent["event"]) => {
    const s = player.current?.state
    if (s) onEvent({ event, currentTime: s.currentTime, duration: s.duration })
  }

  const backdrop = backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : undefined
  const error = state.status === "error" ? state.message : null

  return (
    <>
      {state.status === "ready" && (
        <MediaPlayer
          ref={player}
          className="lumo-player"
          title={title}
          src={{ src: state.url, type: "application/x-mpegurl" }}
          poster={backdrop}
          crossOrigin
          playsInline
          autoPlay
          // Bundled hls.js (instead of Vidstack's CDN copy), only fetched when a stream plays
          onProviderChange={(provider) => {
            if (isHLSProvider(provider)) provider.library = () => import("hls.js")
          }}
          onCanPlay={() => {
            setCanPlay(true)
            // Resume once, on the first load only (not after every quality switch)
            const p = player.current
            if (p && startAt > 0 && p.state.currentTime < 1) p.currentTime = startAt
          }}
          onError={(err) => {
            console.error(`[${server}]`, err)
            // Errors after it started playing are Vidstack's to show; before that, it never loaded
            if (!player.current?.state.canPlay) setState({ status: "error", message: `${server} couldn't load this stream.` })
          }}
          onPlay={() => emit("play")}
          onPause={() => emit("pause")}
          onTimeUpdate={() => emit("timeupdate")}
          onSeeked={() => emit("seeked")}
          onEnded={() => emit("ended")}
        >
          <MediaProvider>
            <Poster className="vds-poster" />
            {state.subtitles.map((s) => (
              <Track key={s.file} src={s.file} kind="subtitles" label={s.label} />
            ))}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      )}

      <AnimatePresence>
        {(!canPlay || error) && (
          <motion.div
            key="stream-screen"
            className="absolute inset-0 z-10 overflow-hidden bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {backdrop && (
              <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

            <div className="relative h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
              {error ? (
                <>
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <AlertCircle size={26} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="text-base md:text-lg font-semibold text-white">{error}</p>
                    <p className="mt-1 text-sm text-gray-400">Another server should have it.</p>
                  </div>
                  {fallback && (
                    <button
                      onClick={fallback.onSelect}
                      className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-sm font-semibold text-white transition-colors"
                    >
                      Play on {fallback.name}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="stream-ring w-14 h-14 rounded-full" />
                  <div className="min-w-0 max-w-md">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">{server}</p>
                    <p className="mt-1 text-lg md:text-2xl font-bold text-white truncate">{title}</p>
                    {subtitle && <p className="mt-0.5 text-xs md:text-sm text-gray-400 truncate">{subtitle}</p>}
                  </div>
                  <div className="stream-bar w-40 h-[3px] rounded-full bg-white/10 overflow-hidden" />
                  <p className="text-xs text-gray-400">
                    {state.status === "loading" ? "Finding the best stream…" : startAt > 0 ? "Picking up where you left off…" : "Starting playback…"}
                  </p>
                  {slow && fallback && (
                    <button
                      onClick={fallback.onSelect}
                      className="text-xs text-gray-300 underline underline-offset-4 hover:text-white transition-colors"
                    >
                      Taking a while? Play on {fallback.name}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
