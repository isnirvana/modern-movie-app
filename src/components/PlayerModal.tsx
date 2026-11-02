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

  const report = useCallback((ev: PlayerEvent) => {
    let { currentTime, duration } = ev
    if (Number.isFinite(duration) && duration > 0) lastDuration.current = duration
    else duration = lastDuration.current
    // "ended" may come without times — it means the end
    if (ev.event === "ended" && !Number.isFinite(currentTime)) currentTime = duration
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return

    if (ev.event === "timeupdate") {
      const now = Date.now()
      if (now - lastSent.current < TIMEUPDATE_EVERY_MS) return
      lastSent.current = now
    }
    onPlayerEventRef.current?.({ event: ev.event, currentTime, duration })
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col md:items-center md:justify-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black md:bg-black/85"
            style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
            onClick={onClose}
          />

          {/* Panel: full-screen on mobile, centered card on desktop */}
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
            className="relative z-10 flex flex-col w-full h-full md:h-auto md:max-w-5xl md:rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #0f1117 0%, #0a0c14 100%)",
              border: desktop ? "1px solid rgba(255,255,255,0.08)" : "none",
              boxShadow: "0 24px 80px rgba(0,0,0,0.85)",
              paddingBottom: desktop ? 0 : "env(safe-area-inset-bottom)",
            }}
            initial={desktop ? { scale: 0.94, opacity: 0, y: 20 } : { y: "100%" }}
            animate={desktop ? { scale: 1, opacity: 1, y: 0 } : { y: 0 }}
            exit={desktop ? { scale: 0.96, opacity: 0 } : { y: "100%" }}
            transition={desktop ? { duration: 0.25, ease: "easeOut" } : { type: "spring", damping: 32, stiffness: 320 }}
          >
            {/* Header bar (also the swipe-down handle on phones) */}
            <div
              onPointerDown={(e) => !desktop && dragControls.start(e)}
              className="relative flex-shrink-0 flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 touch-none md:touch-auto"
              style={{
                background: "linear-gradient(90deg, rgba(108,99,255,0.14) 0%, rgba(247,37,133,0.07) 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                paddingTop: desktop ? undefined : "max(0.75rem, env(safe-area-inset-top))",
              }}
            >
              {/* Grab handle (phones) */}
              <span
                aria-hidden="true"
                className="md:hidden absolute left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/25"
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
                <h3 className="text-sm md:text-base font-bold text-white leading-snug truncate">{title}</h3>
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

            {/* Server switcher — under the video on phones (thumb reach), under the header on desktop */}
            {visible.length > 1 && (
              <div
                ref={switcherRef}
                className="order-last md:order-none flex-shrink-0 flex items-center gap-2 px-4 py-3 md:py-2 md:px-5 overflow-x-auto border-t md:border-t-0 md:border-b border-white/[0.06]"
              >
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold flex-shrink-0">
                  <ServerIcon size={12} /> Server
                </span>
                {visible.map((s, i) => {
                  const active = s === server
                  return (
                    <button
                      key={s.name}
                      onClick={() => pickServer(s.name)}
                      aria-pressed={active}
                      className={`flex-shrink-0 px-4 py-2 md:px-3 md:py-1 text-sm md:text-xs rounded-full font-medium transition-colors ${
                        active ? "bg-primary text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {s.name}
                      {i === 0 && <span className={`ml-1 text-[9px] ${active ? "text-white/70" : "text-gray-500"}`}>Default</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Purple→pink accent line */}
            <div
              className="flex-shrink-0 h-[2px] w-full"
              style={{ background: "linear-gradient(90deg, #6c63ff, #f72585, transparent)" }}
            />

            {/* Player — fills remaining height on mobile, 16:9 on desktop */}
            <div className="relative w-full bg-black flex-1 min-h-0 md:flex-none md:aspect-video">
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              )}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
