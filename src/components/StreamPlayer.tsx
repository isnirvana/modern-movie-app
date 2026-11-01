// src/components/StreamPlayer.tsx
// Our own player (Vidstack) for servers that give us a direct HLS stream. Loaded lazily by PlayerModal.
import { useEffect, useRef, useState } from "react"
import { MediaPlayer, MediaProvider, Track, isHLSProvider, type MediaPlayerInstance } from "@vidstack/react"
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
  // Fired once we know whether there's something to play (hides PlayerModal's spinner)
  onLoad: () => void
  onEvent: (e: PlayerEvent) => void
}

type State = { status: "loading" } | { status: "ready"; url: string; subtitles: Subtitle[] } | { status: "error"; message: string }

export default function StreamPlayer({ server, api, subtitlesApi, startAt, title, onLoad, onEvent }: Props) {
  const [state, setState] = useState<State>({ status: "loading" })
  const player = useRef<MediaPlayerInstance>(null)

  // Callbacks change every parent render; refs keep the lookup from re-running
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    Promise.all([fetchStreamUrl(api, server, ctrl.signal), fetchSubtitles(subtitlesApi, ctrl.signal)])
      .then(([url, subtitles]) =>
        setState(
          url
            ? { status: "ready", url, subtitles }
            : { status: "error", message: `${server} doesn't have this title. Try another server.` },
        ),
      )
      .catch((err) => {
        if (ctrl.signal.aborted) return
        console.error(`[${server}]`, err)
        setState({ status: "error", message: `${server} isn't responding right now. Try another server.` })
      })
      .finally(() => !ctrl.signal.aborted && onLoadRef.current())
    return () => ctrl.abort()
  }, [server, api, subtitlesApi])

  const emit = (event: PlayerEvent["event"]) => {
    const s = player.current?.state
    if (s) onEvent({ event, currentTime: s.currentTime, duration: s.duration })
  }

  if (state.status === "loading") return null
  if (state.status === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-gray-400">
        {state.message}
      </div>
    )
  }

  return (
    <MediaPlayer
      ref={player}
      className="lumo-player"
      title={title}
      src={{ src: state.url, type: "application/x-mpegurl" }}
      crossOrigin
      playsInline
      autoPlay
      // Bundled hls.js (instead of Vidstack's CDN copy), only fetched when a stream plays
      onProviderChange={(provider) => {
        if (isHLSProvider(provider)) provider.library = () => import("hls.js")
      }}
      onCanPlay={() => {
        // Resume once, on the first load only (not after every quality switch)
        const p = player.current
        if (p && startAt > 0 && p.state.currentTime < 1) p.currentTime = startAt
      }}
      onPlay={() => emit("play")}
      onPause={() => emit("pause")}
      onTimeUpdate={() => emit("timeupdate")}
      onSeeked={() => emit("seeked")}
      onEnded={() => emit("ended")}
    >
      <MediaProvider>
        {state.subtitles.map((s) => (
          <Track key={s.file} src={s.file} kind="subtitles" label={s.label} />
        ))}
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  )
}
