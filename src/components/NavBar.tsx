// src/components/NavBar.tsx
import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, ChevronDown, Film, Tv, Radio, Layers, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SearchTypeahead from "./SearchTypeahead"
import { useGenres } from "../hooks/useGenres"

export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [genresOpen, setGenresOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const { data: genres = [] } = useGenres()

  // Close everything on route change
  useEffect(() => {
    setDrawerOpen(false)
    setGenresOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  // Close on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false)
        setGenresOpen(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80)
    }
  }, [searchOpen])

  const navLinks = [
    { to: "/movies", label: "Movies", icon: <Film size={16} /> },
    { to: "/tv", label: "TV Shows", icon: <Tv size={16} /> },
    { to: "/live", label: "Live", icon: <Radio size={16} /> },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* ── Navbar bar ─────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07]"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => { setDrawerOpen((o) => !o); setSearchOpen(false) }}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold shrink-0"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-black shadow-glow">
              P
            </span>
            <span className="text-gradient hidden sm:inline">Prime</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? "bg-primary/20 text-primary"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {/* Genres dropdown (desktop) */}
            <div className="relative">
              <button
                onClick={() => setGenresOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  genresOpen ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Layers size={15} />
                Genres
                <motion.span animate={{ rotate: genresOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} />
                </motion.span>
              </button>

              <AnimatePresence>
                {genresOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 rounded-xl shadow-card w-44 overflow-auto max-h-72 py-1 z-50"
                    style={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {genres.map((g) => (
                      <li key={g.id}>
                        <Link
                          to={`/genre/${g.id}`}
                          onClick={() => setGenresOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-primary/15 transition-colors"
                        >
                          {g.name}
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop search bar */}
          <div className="hidden md:block flex-1 max-w-sm ml-auto">
            <SearchTypeahead />
          </div>

          {/* Mobile search icon button (far right) */}
          <button
            className="md:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
            style={{
              background: searchOpen ? "rgba(108,99,255,0.18)" : "transparent",
              color: searchOpen ? "#6c63ff" : "white",
            }}
            onClick={() => { setSearchOpen((o) => !o); setDrawerOpen(false) }}
            aria-label="Search"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* ── Mobile search bar (slides down below navbar) ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              key="mobile-search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden md:hidden border-t border-white/[0.07]"
            >
              <div className="px-4 py-3">
                <SearchTypeahead autoFocus />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Mobile Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-overlay"
              className="fixed inset-0 z-[60] bg-black/70"
              style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Sliding panel */}
            <motion.div
              key="drawer-panel"
              ref={drawerRef}
              className="fixed top-0 left-0 bottom-0 z-[70] w-72 flex flex-col overflow-y-auto"
              style={{
                background: "#0e0e18",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "4px 0 32px rgba(0,0,0,0.7)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
                <Link
                  to="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-black text-sm shadow-glow">
                    P
                  </span>
                  <span className="text-lg font-bold text-gradient">Prime</span>
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-col gap-1 px-3 pt-4 pb-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.to)
                        ? "bg-primary/20 text-primary"
                        : "text-gray-300 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}

                {/* Genres accordion */}
                <div>
                  <button
                    onClick={() => setGenresOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <Layers size={16} />
                      Genres
                    </span>
                    <motion.span animate={{ rotate: genresOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {genresOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-3 py-1 flex flex-col gap-0.5">
                          {genres.map((g) => (
                            <li key={g.id} className="list-none">
                              <Link
                                to={`/genre/${g.id}`}
                                onClick={() => setDrawerOpen(false)}
                                className="block px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                              >
                                {g.name}
                              </Link>
                            </li>
                          ))}
                        </div>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
