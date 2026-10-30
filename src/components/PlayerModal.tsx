// src/components/PlayerModal.tsx
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Server as ServerIcon } from "lucide-react"
import type { Server } from "../utils/servers"

type Props = {
  open: boolean
  onClose: () => void
  servers: Server[]
  title: string
  subtitle?: string
  posterPath?: string | null
}

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches

export default function PlayerModal({ open, onClose, servers, title, subtitle, posterPath }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [serverIndex, setServerIndex] = useState(0)
  const server = servers[Math.min(serverIndex, servers.length - 1)]
  const src = server?.src ?? ""

  // Every time the player opens, start on the default server
  useEffect(() => {
    if (open) setServerIndex(0)
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

  // Show the spinner again whenever the source changes (e.g. new episode)
  useEffect(() => setLoaded(false), [src])

  const desktop = isDesktop()

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
            {/* Header bar */}
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3 md:px-5 md:py-4"
              style={{
                background: "linear-gradient(90deg, rgba(108,99,255,0.14) 0%, rgba(247,37,133,0.07) 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                paddingTop: desktop ? undefined : "max(0.75rem, env(safe-area-inset-top))",
              }}
            >
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

            {/* Server switcher */}
            {servers.length > 1 && (
              <div
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 md:px-5 overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold flex-shrink-0">
                  <ServerIcon size={12} /> Server
                </span>
                {servers.map((s, i) => {
                  const active = s === server
                  return (
                    <button
                      key={s.name}
                      onClick={() => setServerIndex(i)}
                      aria-pressed={active}
                      className={`flex-shrink-0 px-3 py-1 text-xs rounded-full font-medium transition-colors ${
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
              <iframe
                key={src}
                src={src}
                title={title}
                onLoad={() => setLoaded(true)}
                allowFullScreen
                allow="autoplay; fullscreen"
                sandbox={server?.sandbox ? "allow-scripts allow-same-origin allow-presentation" : undefined}
                className="absolute inset-0 w-full h-full"
                style={{ border: "none" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
