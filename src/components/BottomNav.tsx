// src/components/BottomNav.tsx
// Mobile-only tab bar (native app style) with a genres bottom sheet
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { Home, Film, Tv, Search, Layers, Download, X } from "lucide-react"
import { useGenres } from "../hooks/useGenres"
import { useInstallPrompt } from "../hooks/useInstallPrompt"

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/tv", label: "TV", icon: Tv },
  { to: "/search", label: "Search", icon: Search },
]

export default function BottomNav() {
  const location = useLocation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data: genres = [] } = useGenres()
  const { canInstall, install } = useInstallPrompt()
  const dragControls = useDragControls()

  // Close the sheet on navigation
  useEffect(() => setSheetOpen(false), [location.pathname])

  // Lock page scroll + close on Escape while the sheet is open
  useEffect(() => {
    if (!sheetOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [sheetOpen])

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)
  const genresActive = sheetOpen || location.pathname.startsWith("/genre/")

  const tabClass = (active: boolean) =>
    `relative flex-1 flex flex-col items-center justify-center gap-1 h-16 text-[10px] font-medium transition-colors select-none ${
      active ? "text-white" : "text-gray-500 active:text-gray-300"
    }`

  return (
    <>
      {/* ── Tab bar ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.07]"
        style={{
          background: "rgba(10,10,15,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Main"
      >
        <div className="flex items-stretch px-2">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = isActive(to) && !sheetOpen
            return (
              <Link key={to} to={to} className={tabClass(active)} aria-current={active ? "page" : undefined}>
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute top-0 h-[3px] w-8 rounded-b-full bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  />
                )}
                <Icon size={21} strokeWidth={active ? 2.4 : 1.8} className={active ? "text-primary" : ""} />
                {label}
              </Link>
            )
          })}
          <button onClick={() => setSheetOpen((o) => !o)} className={tabClass(genresActive)} aria-expanded={sheetOpen}>
            {genresActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute top-0 h-[3px] w-8 rounded-b-full bg-gradient-to-r from-primary to-accent"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            )}
            <Layers size={21} strokeWidth={genresActive ? 2.4 : 1.8} className={genresActive ? "text-primary" : ""} />
            Genres
          </button>
        </div>
      </nav>

      {/* ── Genres bottom sheet ─────────────────────────── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="sheet-backdrop"
              className="md:hidden fixed inset-0 z-[60] bg-black/70"
              style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Genres"
              className="md:hidden fixed left-0 right-0 bottom-0 z-[70] rounded-t-3xl flex flex-col"
              style={{
                background: "#0e0e18",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 -12px 40px rgba(0,0,0,0.6)",
                maxHeight: "75vh",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 340 }}
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setSheetOpen(false)
              }}
            >
              {/* Grab handle + header — swipe down here to close */}
              <div
                className="flex-shrink-0 pt-3 pb-2 px-5 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="mx-auto w-10 h-1.5 rounded-full bg-white/20 mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="section-heading text-lg">Genres</h2>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.07] text-gray-400"
                    aria-label="Close genres"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-5 pb-5">
                {canInstall && (
                  <button
                    onClick={() => { setSheetOpen(false); install() }}
                    className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-primary/30 to-accent/20 border border-primary/30"
                  >
                    <Download size={17} /> Install Lumo app
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {genres.map((g: { id: number; name: string }) => {
                    const active = location.pathname === `/genre/${g.id}`
                    return (
                      <Link
                        key={g.id}
                        to={`/genre/${g.id}`}
                        className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                          active ? "bg-primary text-white" : "bg-white/[0.05] text-gray-300 active:bg-white/10"
                        }`}
                      >
                        {g.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
