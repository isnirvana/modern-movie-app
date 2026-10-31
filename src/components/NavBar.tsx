// src/components/NavBar.tsx
// Top bar. On phones it only shows the logo — navigation lives in BottomNav.
import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown, Film, Tv, Layers, Download, Bookmark } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SearchTypeahead from "./SearchTypeahead"
import Logo from "./Logo"
import { useGenres } from "../hooks/useGenres"
import { useInstallPrompt } from "../hooks/useInstallPrompt"
import MediaTypeToggle from "./MediaTypeToggle"
import { genrePath, type MediaType } from "../utils/genres"

export default function NavBar() {
  const [genresOpen, setGenresOpen] = useState(false)
  const genresRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const [genreType, setGenreType] = useState<MediaType>("movie")
  const { data: genres = [] } = useGenres(genreType)
  const { canInstall, install } = useInstallPrompt()

  // Close the genres menu on route change
  useEffect(() => {
    setGenresOpen(false)
  }, [location.pathname])

  // Close on Esc or a click anywhere else
  useEffect(() => {
    if (!genresOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setGenresOpen(false)
    const onClick = (e: MouseEvent) => {
      if (genresRef.current && !genresRef.current.contains(e.target as Node)) setGenresOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [genresOpen])

  const navLinks = [
    { to: "/movies", label: "Movies", icon: <Film size={16} /> },
    { to: "/tv", label: "TV Shows", icon: <Tv size={16} /> },
    { to: "/my-list", label: "My List", icon: <Bookmark size={16} /> },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07]"
      style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0" aria-label="Lumo home">
          <Logo />
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

          {/* Genres dropdown */}
          <div className="relative" ref={genresRef}>
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
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 rounded-xl shadow-card w-80 p-3 z-50"
                  style={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <MediaTypeToggle id="nav-genres" value={genreType} onChange={setGenreType} />
                  <ul className="grid grid-cols-2 gap-0.5 mt-3 max-h-80 overflow-auto">
                    {genres.map((g) => (
                      <li key={g.id}>
                        <Link
                          to={genrePath(genreType, g.id)}
                          onClick={() => setGenresOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-primary/15 transition-colors"
                        >
                          {g.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop search bar */}
        <div className="hidden md:block flex-1 max-w-sm ml-auto">
          <SearchTypeahead />
        </div>

        {/* Install app (desktop; on phones it's in the Genres sheet) */}
        {canInstall && (
          <button
            onClick={install}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 shrink-0"
          >
            <Download size={15} />
            Install
          </button>
        )}
      </div>
    </nav>
  )
}
