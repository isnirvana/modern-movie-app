// src/components/NavBar.tsx
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SearchTypeahead from "./SearchTypeahead"
import { useGenres } from "../hooks/useGenres"

export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [genresOpen, setGenresOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { data: genres = [] } = useGenres()

  // close drawer on outside click or Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setDrawerOpen(false)
      }
      if (
        e instanceof MouseEvent &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener("keydown", handler)
    document.addEventListener("mousedown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
      document.removeEventListener("mousedown", handler)
    }
  }, [])

  return (
    <nav className="bg-black text-white px-4 py-3 flex items-center justify-between shadow-md relative z-50">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center space-x-4">
        <button
          className="md:hidden p-2"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {drawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="text-2xl font-bold">
          Prime
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/movies" className="hover:text-blue-400 transition">
            Movies
          </Link>
          <Link to="/tv" className="hover:text-blue-400 transition">
            TV
          </Link>
          <Link to="/live" className="hover:text-blue-400 transition">
            Live
          </Link>
          {/* genre dropdown for desktop */}
          <div className="relative">
            <button
              onClick={() => setGenresOpen((o) => !o)}
              className="flex items-center hover:text-blue-400 transition"
            >
              Genres{" "}
              {genresOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {genresOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute mt-2 bg-gray-800 border border-gray-700 rounded shadow-lg w-40 overflow-auto max-h-60"
              >
                {genres.map((g) => (
                  <li key={g.id}>
                    <Link
                      to={`/genre/${g.id}`}
                      onClick={() => setGenresOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-700 text-sm"
                    >
                      {g.name}
                    </Link>
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>
      </div>

      {/* Center (desktop): Search */}
      <div className="hidden md:block flex-1 mx-6 max-w-lg">
        <SearchTypeahead />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* sliding drawer */}
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-64 bg-gray-900 z-50 shadow-lg flex flex-col p-6 overflow-y-auto"
              ref={drawerRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
            >
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="text-2xl font-bold mb-6 block"
              >
                Prime
              </Link>
              <Link
                to="/movies"
                onClick={() => setDrawerOpen(false)}
                className="mb-4 text-lg hover:text-blue-400"
              >
                Movies
              </Link>
              <Link
                to="/tv"
                onClick={() => setDrawerOpen(false)}
                className="mb-4 text-lg hover:text-blue-400"
              >
                TV
              </Link>
              <Link
                to="/live"
                onClick={() => setDrawerOpen(false)}
                className="mb-4 text-lg hover:text-blue-400"
              >
                Live
              </Link>

              {/* nested genres */}
              <div className="mt-4">
                <button
                  onClick={() => setGenresOpen((o) => !o)}
                  className="w-full text-left flex items-center justify-between mb-2 text-lg hover:text-blue-400"
                >
                  Genres{" "}
                  {genresOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {genresOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {genres.map((g) => (
                        <li key={g.id}>
                          <Link
                            to={`/genre/${g.id}`}
                            onClick={() => setDrawerOpen(false)}
                            className="block px-2 py-1 rounded hover:bg-gray-800 text-sm"
                          >
                            {g.name}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Search on mobile */}
              <div className="mt-auto pt-6">
                <SearchTypeahead />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
