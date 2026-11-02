// src/components/SearchTypeahead.tsx
import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Search as SearchIcon, Loader2, Tv, Film, Clock, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRecentSearches } from "../hooks/useRecentSearches"
import { addRecentSearch, removeRecentSearch, clearRecentSearches } from "../utils/recentSearches"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = "https://api.themoviedb.org/3"

export default function SearchTypeahead({ autoFocus }: { autoFocus?: boolean }) {
  const [input, setInput] = useState("")
  const [debounced, setDebounced] = useState("")
  // Open while the box is focused and empty: shows recent searches
  const [showRecent, setShowRecent] = useState(false)
  const recent = useRecentSearches()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input.trim()), 400)
    return () => clearTimeout(timer)
  }, [input])

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["typeahead", debounced],
    queryFn: async () => {
      const res = await axios.get(`${TMDB_BASE}/search/multi`, {
        params: { api_key: API_KEY, query: debounced },
      })
      return res.data.results.filter(
        (item: any) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          item.poster_path
      )
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDebounced("")
        setShowRecent(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const goToDetail = (item: any) => {
    addRecentSearch(input)
    const path = item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`
    navigate(path)
    setInput("")
    setDebounced("")
    setShowRecent(false)
  }

  const goToSearchPage = () => {
    if (input.trim()) {
      addRecentSearch(input)
      navigate(`/search?query=${encodeURIComponent(input.trim())}`)
      setInput("")
      setDebounced("")
      setShowRecent(false)
    }
  }

  const searchFor = (q: string) => {
    addRecentSearch(q)
    navigate(`/search?query=${encodeURIComponent(q)}`)
    setShowRecent(false)
    inputRef.current?.blur()
  }

  const showDropdown = debounced.length >= 2
  const showRecentList = showRecent && !input && recent.length > 0

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
        {isFetching ? (
          <Loader2 size={16} className="text-gray-400 shrink-0 animate-spin" />
        ) : (
          <SearchIcon size={16} className="text-gray-400 shrink-0" />
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowRecent(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowRecent(false)
              e.currentTarget.blur()
            }
            if (e.key === "Enter") {
              if (suggestions.length > 0) goToDetail(suggestions[0])
              else goToSearchPage()
            }
          }}
          ref={inputRef}
          placeholder="Search movies or TV…"
          className="bg-transparent text-sm text-white placeholder-gray-500 flex-1 focus:outline-none"
        />
        {input && (
          <button
            onClick={() => { setInput(""); setDebounced("") }}
            className="text-gray-500 hover:text-white transition text-xs leading-none"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {showRecentList && (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full glass-dark rounded-xl shadow-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-500">Recent</span>
              <button onClick={clearRecentSearches} className="text-[11px] font-medium text-primary hover:text-white transition-colors">
                Clear
              </button>
            </div>
            <ul className="pb-1">
              {recent.map((q) => (
                <li key={q} className="group flex items-center hover:bg-primary/12 transition-colors">
                  <button onClick={() => searchFor(q)} className="flex-1 min-w-0 flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-200">
                    <Clock size={14} className="text-gray-500 shrink-0" />
                    <span className="truncate">{q}</span>
                  </button>
                  <button
                    onClick={() => removeRecentSearch(q)}
                    className="mr-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-500 opacity-0 group-hover:opacity-100 hover:text-white transition"
                    aria-label={`Remove "${q}" from recent searches`}
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {showDropdown && (
          <motion.ul
            key="results"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full glass-dark rounded-xl shadow-card overflow-hidden max-h-80 overflow-y-auto"
          >
            {isFetching && (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" /> Searching…
              </li>
            )}
            {!isFetching && suggestions.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500">No results found.</li>
            )}
            {!isFetching &&
              suggestions.map((item: any) => (
                <li
                  key={`${item.media_type}-${item.id}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-primary/12 cursor-pointer transition-colors"
                  onClick={() => goToDetail(item)}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-9 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.title || item.name}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] mt-0.5 px-2 py-0.5 rounded-full bg-surface-3 text-gray-400">
                      {item.media_type === "tv" ? (
                        <><Tv size={9} /> TV Show</>
                      ) : (
                        <><Film size={9} /> Movie</>
                      )}
                    </span>
                  </div>
                </li>
              ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
