// src/components/HeroTrailer.tsx
// A muted trailer that plays behind a hero, like Netflix and Apple TV.
// Built for slow connections: it starts loading only after a delay (so the page and images come first),
// stays invisible until YouTube says it's actually playing, then fades in over the backdrop.
// If it isn't playing within LOAD_TIMEOUT_MS it's dropped, so a slow connection just keeps the backdrop.
import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

export type TrailerStatus = "waiting" | "loading" | "playing" | "done"

type Props = {
  videoKey?: string
  muted: boolean
  // Wait this long before loading anything
  delay?: number
  onStatus?: (status: TrailerStatus) => void
}

const LOAD_TIMEOUT_MS = 12000
// Fade out this close to the end, before YouTube's end screen shows
const END_MARGIN_S = 1.5
// After playback starts, wait a moment for YouTube's title overlay to go before showing it
const REVEAL_DELAY_MS = 700
const FADE_MS = 1000
const ORIGIN = "https://www.youtube-nocookie.com"

// Warm up the connection the first time a trailer is on the way
let preconnected = false
function preconnect() {
  if (preconnected) return
  preconnected = true
  for (const href of [ORIGIN, "https://i.ytimg.com"]) {
    const link = document.createElement("link")
    link.rel = "preconnect"
    link.href = href
    link.crossOrigin = ""
    document.head.appendChild(link)
  }
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function HeroTrailer({ videoKey, muted, delay = 2500, onStatus }: Props) {
  const [status, setStatus] = useState<TrailerStatus>("waiting")
  const [visible, setVisible] = useState(false)
  // Kept on screen for the fade-out after it's done
  const [leaving, setLeaving] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const visibleRef = useRef(false)
  visibleRef.current = visible

  // Stop: if it's showing, fade it out first (set together, so the player isn't dropped and remounted in between)
  const finish = () => {
    setStatus("done")
    if (visibleRef.current) setLeaving(true)
  }

  const onStatusRef = useRef(onStatus)
  onStatusRef.current = onStatus
  useEffect(() => onStatusRef.current?.(status), [status])

  const command = (func: string) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), ORIGIN)

  // A new video starts over: wait, then load
  useEffect(() => {
    setStatus("waiting")
    setVisible(false)
    setLeaving(false)
    if (!videoKey || reducedMotion()) return
    preconnect()
    const timer = setTimeout(() => setStatus("loading"), delay)
    return () => clearTimeout(timer)
  }, [videoKey, delay])

  // Too slow to start: give up and keep the backdrop
  useEffect(() => {
    if (status !== "loading") return
    const timer = setTimeout(finish, LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [status])

  // Fading out: hide, then remove the player
  useEffect(() => {
    if (!leaving) return
    setVisible(false)
    const timer = setTimeout(() => setLeaving(false), FADE_MS)
    return () => clearTimeout(timer)
  }, [leaving])

  // Fade in shortly after it starts playing
  useEffect(() => {
    if (status !== "playing") return
    const timer = setTimeout(() => setVisible(true), REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [status])

  // Follow YouTube's player state (it reports once we say we're listening)
  useEffect(() => {
    if (status !== "loading" && status !== "playing") return
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return
      let msg: any
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }
      const info = msg.info ?? {}
      const state = msg.event === "onStateChange" ? info : info.playerState
      if (state === 1) setStatus("playing")
      if (state === 0 || (info.duration > 0 && info.currentTime > 0 && info.duration - info.currentTime < END_MARGIN_S)) finish()
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [status])

  useEffect(() => {
    if (status === "playing") command(muted ? "mute" : "unMute")
  }, [muted, status])

  // Pause while the tab is in the background or the hero is scrolled out of view (saves data too)
  useEffect(() => {
    if (status !== "playing" || !box.current) return
    let onScreen = true
    const update = () => command(document.hidden || !onScreen ? "pauseVideo" : "playVideo")
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      update()
    })
    observer.observe(box.current)
    document.addEventListener("visibilitychange", update)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [status])

  if (!videoKey || (status !== "loading" && status !== "playing" && !leaving)) return null

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    enablejsapi: "1",
    origin: window.location.origin,
  })

  return (
    <div
      ref={box}
      className={`trailer-box absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <iframe
        ref={frame}
        src={`${ORIGIN}/embed/${videoKey}?${params}`}
        title="Trailer"
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        onLoad={(e) => e.currentTarget.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: videoKey, channel: "widget" }), ORIGIN)}
        className="trailer-frame"
      />
    </div>
  )
}

// Sound on/off for a playing trailer
export function MuteButton({ muted, onToggle, className = "" }: { muted: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? "Turn trailer sound on" : "Mute trailer"}
      className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm ring-1 ring-white/30 text-white hover:bg-black/60 transition-colors ${className}`}
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  )
}
