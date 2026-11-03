// src/components/PlayerModal.tsx
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion"
import { X, Server as ServerIcon } from "lucide-react"
import type { Server, PlayerEvent } from "../utils/servers"
import { fetchAvailableServers } from "../utils/primeflix"

const StreamPlayer = lazy(() => import("./StreamPlayer"))

type Props = {
  open: boolean
  onClose: () => void
  servers: Server[]
  title: string
  subtitle?: string
  posterPath?: string | null
  // Shown behind our own player while it loads
  backdropPath?: string | null
  // Progress events from servers that send them (Nova, Cinezo, CineSrc)
  onPlayerEvent?: (e: PlayerEvent) => void
  // Shown on top of the video, e.g. the Up Next card
  overlay?: ReactNode
  // Servers to open on instead of the default (by name, first one the title has wins), e.g. the viewer's pick
  initialServers?: string[]
  // Fired when the viewer picks a server (e.g. to remember it)
  onServerChange?: (name: string) => void
}

// Some servers send time updates several times a second; pass them on at most this often
const TIMEUPDATE_EVERY_MS = 5000
// Streams can stall just short of the end and never say "ended" (seen on VidSpark): this close counts as the end
const END_SLACK_S = 2

// Swipe-to-close: this far down, or this fast
const SWIPE_CLOSE_PX = 120
const SWIPE_CLOSE_VELOCITY = 600

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches

export default function PlayerModal({ open, onClose, servers, title, subtitle, posterPath, backdropPath, onPlayerEvent, overlay, initialServers, onServerChange }: Props) {
  const [loaded, setLoaded] = useState(false)
  // The server the viewer picked; null means one of `initialServers`, or else the default (the first, Cinezo)
  const [serverName, setServerName] = useState<string | null>(null)

  // `stream` servers only show for titles they have, so look that up first (they all share one API)
  const streamApi = servers.find((s) => s.stream)?.src
  const [lookup, setLookup] = useState<{ api: string; names: Set<string> } | null>(null)
  const available = lookup && lookup.api === streamApi ? lookup.names : null

  useEffect(() => {
    if (!open || !streamApi) return
    const ctrl = new AbortController()
    fetchAvailableServers(streamApi, ctrl.signal)
      .catch(() => new Set<string>())
      .then((names) => !ctrl.signal.aborted && setLookup({ api: streamApi, names }))
    return () => ctrl.abort()
  }, [open, streamApi])

  const visible = servers.filter((s) => !s.stream || available?.has(s.name))
  // While a new episode's lookup runs, stay on a picked stream server instead of briefly loading another one
  const wanted = serverName ? [serverName] : initialServers ?? []
  const waiting = !!streamApi && !available && wanted.some((name) => servers.find((s) => s.name === name)?.stream)
  const server = waiting
    ? undefined
    : wanted.map((name) => visible.find((s) => s.name === name)).find(Boolean) ?? visible[0]
  const src = server?.src ?? ""

  // Every time the player opens, start on the default server (or the requested one)
  useEffect(() => {
    if (open) setServerName(null)
  }, [open])

  // Phones: whenever a player goes fullscreen, turn to landscape (and let go after), in case the server doesn't
  useEffect(() => {
    if (!open || isDesktop()) return
    // Missing on older iPhones
    const orientation = screen.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined
    const onFullscreenChange = () => {
      if (document.fullscreenElement) orientation?.lock?.("landscape").catch(() => {})
      else orientation?.unlock?.()
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [open])

  // Lock page scroll + close on Escape while open
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  // Pass the active server's progress on to the parent. Refs keep this stable while the parent re-renders.
  const onPlayerEventRef = useRef(onPlayerEvent)
  onPlayerEventRef.current = onPlayerEvent
  const lastDuration = useRef(NaN)
  const lastSent = useRef(0)
  const endedSent = useRef(false)

  const report = useCallback((ev: PlayerEvent) => {
    let { currentTime, duration } = ev
    if (Number.isFinite(duration) && duration > 0) lastDuration.current = duration
    else duration = lastDuration.current
    // "ended" may come without times — it means the end
    if (ev.event === "ended" && !Number.isFinite(currentTime)) currentTime = duration
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return

    const atEnd = ev.event === "timeupdate" && duration - currentTime <= END_SLACK_S
    const event = atEnd ? "ended" : ev.event

    // Pass "ended" on once per playthrough, whether it was sent or reached
    if (event === "ended") {
      if (endedSent.current) return
      endedSent.current = true
    } else if (duration - currentTime > END_SLACK_S) {
      endedSent.current = false
    }

    if (event === "timeupdate") {
      const now = Date.now()
      if (now - lastSent.current < TIMEUPDATE_EVERY_MS) return
      lastSent.current = now
    }
    onPlayerEventRef.current?.({ event, currentTime, duration })
  }, [])

  // Iframe servers send their progress as messages
  const events = server?.events

  useEffect(() => {
    if (!open || !events) return
    const onMessage = (e: MessageEvent) => {
      // Only trust messages from the server that's playing
      if (e.origin !== events.origin) return
      const ev = events.parse(e.data)
      if (ev) report(ev)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [open, events, report])

  // Whenever the source changes (e.g. new episode): show the spinner again and start progress afresh
  useEffect(() => {
    setLoaded(false)
    lastDuration.current = NaN
    lastSent.current = 0
    endedSent.current = false
  }, [src, server?.name])

  const pickServer = (name: string) => {
    setServerName(name)
    onServerChange?.(name)
  }

  // Keep the active server's chip in view (the switcher scrolls sideways on phones)
  const switcherRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    switcherRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [server?.name, open])

  const desktop = isDesktop()

  // Phones: drag the header down to close, like dismissing an app sheet (the video itself takes all touches)
  const dragControls = useDragControls()
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > SWIPE_CLOSE_PX || info.velocity.y > SWIPE_CLOSE_VELOCITY) onClose()
  }

  // The server picker: in the top bar on desktop, along the bottom on phones (thumb reach)
  const switcher = visible.length > 1 && (
    <div
      ref={switcherRef}
      className={
        desktop
          ? "flex items-center gap-1.5 min-w-0 overflow-x-auto"
          : "order-last flex-shrink-0 flex items-center gap-2 px-4 py-3 overflow-x-auto border-t border-white/[0.06]"
      }
      style={{ scrollbarWidth: "none" }}
    >
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold flex-shrink-0 mr-1">
        <ServerIcon size={12} /> Server
      </span>
      {visible.map((s, i) => {
        const active = s === server
        return (
          <button
            key={s.name}
            onClick={() => pickServer(s.name)}
            aria-pressed={active}
            title={i === 0 ? "Default server" : undefined}
            className={`flex-shrink-0 rounded-full font-medium transition-colors ${
              desktop ? "px-3.5 py-1.5 text-[13px]" : "px-4 py-2 text-sm"
            } ${active ? "bg-white text-gray-900" : "bg-white/[0.07] text-gray-300 hover:bg-white/[0.14] hover:text-white"}`}
          >
            {s.name}
            {i === 0 && !desktop && <span className="ml-1 text-[9px] text-gray-500">Default</span>}
          </button>
        )
      })}
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="absolute inset-0 bg-black" onClick={onClose} />

          {/* Full screen: a sheet that slides up on phones, a cinema view on desktop */}
          <motion.div
            role="dialog"
            aria-modal="true"
            drag={desktop ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            onDragEnd={onDragEnd}
            aria-label={`Now watching ${title}`}
            className="relative z-10 flex flex-col w-full h-full overflow-hidden"
            style={{
              background: desktop ? "#000" : "linear-gradient(145deg, #0f1117 0%, #0a0c14 100%)",
              paddingBottom: desktop ? 0 : "env(safe-area-inset-bottom)",
            }}
            initial={desktop ? { opacity: 0 } : { y: "100%" }}
            animate={desktop ? { opacity: 1 } : { y: 0 }}
            exit={desktop ? { opacity: 0 } : { y: "100%" }}
            transition={desktop ? { duration: 0.2 } : { type: "spring", damping: 32, stiffness: 320 }}
          >
            {desktop ? (
              // Desktop top bar: what's playing, the server picker, close
              <div className="relative flex-shrink-0 flex items-center gap-6 h-16 [@media(max-height:500px)]:h-12 px-6 border-b border-white/[0.06] bg-gradient-to-b from-[#0d0d14] to-black">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-white truncate">{title}</h3>
                  {subtitle && <p className="text-xs text-gray-500 truncate mt-0.5 [@media(max-height:500px)]:hidden">{subtitle}</p>}
                </div>
                {switcher}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-full text-sm font-medium text-gray-300 bg-white/[0.07] hover:bg-white/[0.14] hover:text-white transition-colors"
                  aria-label="Close player"
                  title="Close (Esc)"
                >
                  <X size={16} /> Close
                </button>
                <div className="absolute left-0 right-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, #6c63ff, #f72585 40%, transparent 80%)" }} />
              </div>
            ) : (
              // Phone header (also the swipe-down handle)
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="relative flex-shrink-0 flex items-center gap-3 px-4 py-3 touch-none"
                style={{
                  background: "linear-gradient(90deg, rgba(108,99,255,0.14) 0%, rgba(247,37,133,0.07) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: "max(0.75rem, env(safe-area-inset-top))",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/25"
                  style={{ top: "max(0.3rem, calc(env(safe-area-inset-top) - 0.45rem))" }}
                />
                {posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                    alt={title}
                    className="w-9 h-14 object-cover rounded-lg flex-shrink-0 ring-1 ring-white/10"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-primary/70 font-semibold mb-0.5">Now Watching</p>
                  <h3 className="text-sm font-bold text-white leading-snug truncate">{title}</h3>
                  {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/15"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  aria-label="Close player"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {!desktop && switcher}
            {!desktop && (
              <div className="flex-shrink-0 h-[2px] w-full" style={{ background: "linear-gradient(90deg, #6c63ff, #f72585, transparent)" }} />
            )}

            {/* Player: the largest 16:9 frame that fits, centred on black (on an upright phone too, so the
                player's own controls sit on the picture rather than at the far edges of the screen) */}
            <div className="relative w-full bg-black flex-1 min-h-0 flex items-center justify-center" style={{ containerType: "size" }}>
              <div className="player-frame relative aspect-video w-[min(100cqw,calc(100cqh*16/9))]">
                {!loaded && <Loading title={title} subtitle={subtitle} server={server?.name} backdropPath={backdropPath} />}
                {!server ? null : server.stream ? (
                  <Suspense fallback={null}>
                    <StreamPlayer
                      key={`${server.name}:${src}`}
                      server={server.name}
                      api={src}
                      subtitlesApi={server.stream.subtitles}
                      startAt={server.stream.startAt}
                      title={title}
                      subtitle={subtitle}
                      backdropPath={backdropPath}
                      fallback={visible[0] !== server ? { name: visible[0].name, onSelect: () => pickServer(visible[0].name) } : undefined}
                      onLoad={() => setLoaded(true)}
                      onEvent={report}
                    />
                  </Suspense>
                ) : (
                  <iframe
                    key={src}
                    src={src}
                    title={title}
                    onLoad={() => setLoaded(true)}
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; screen-wake-lock"
                    // allow-orientation-lock: players turn the phone to landscape when going fullscreen (Cinezo does)
                    sandbox={server.sandbox ? "allow-scripts allow-same-origin allow-presentation allow-orientation-lock" : undefined}
                    className="absolute inset-0 w-full h-full"
                    style={{ border: "none" }}
                  />
                )}
                {overlay}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// While a server's page loads: the title over its blurred backdrop, like our own player's loading screen
function Loading({ title, subtitle, server, backdropPath }: { title: string; subtitle?: string; server?: string; backdropPath?: string | null }) {
  return (
    <div className="absolute inset-0 z-[1] overflow-hidden bg-black">
      {backdropPath && (
        <img
          src={`https://image.tmdb.org/t/p/w1280${backdropPath}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      <div className="relative h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="stream-ring w-14 h-14 rounded-full" />
        <div className="min-w-0 max-w-md">
          {server && <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">{server}</p>}
          <p className="mt-1 text-lg md:text-2xl font-bold text-white truncate">{title}</p>
          {subtitle && <p className="player-extra mt-0.5 text-xs md:text-sm text-gray-400 truncate">{subtitle}</p>}
        </div>
        <div className="player-extra stream-bar w-40 h-[3px] rounded-full bg-white/10 overflow-hidden" />
      </div>
    </div>
  )
}
