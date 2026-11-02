// src/pages/SearchResultsPage.tsx
import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import MovieCard from "../components/MovieCard"
import { motion } from "framer-motion"
import { Search, Loader2, Film, Tv, LayoutGrid, Clock, X, ArrowUpLeft } from "lucide-react"
import { useRecentSearches } from "../hooks/useRecentSearches"
import { addRecentSearch, removeRecentSearch, clearRecentSearches } from "../utils/recentSearches"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = "https://api.themoviedb.org/3"

const tabs = [
  { key: "all", label: "All", icon: <LayoutGrid size={14} /> },
  { key: "movie", label: "Movies", icon: <Film size={14} /> },
  { key: "tv", label: "TV Shows", icon: <Tv size={14} /> },
] as const

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("query") || ""
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all")
  const [input, setInput] = useState(query)
  const recent = useRecentSearches()
  // Nothing searched or being typed: show recent searches (or the prompt)
  const idle = !query && !input.trim()

  // Keep the box in sync when the URL changes (e.g. navbar search)
  useEffect(() => {
    setInput(query)
  }, [query])

  // Update the URL shortly after typing stops, replacing instead of piling up history
  useEffect(() => {
    const next = input.trim()
    if (next === query) return
    const timer = setTimeout(() => setSearchParams(next ? { query: next } : {}, { replace: true }), 400)
    return () => clearTimeout(timer)
  }, [input, query, setSearchParams])

  useEffect(() => {
    setFilter("all")
  }, [query])

  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["searchResults", query],
    queryFn: async () => {
      const res = await axios.get(`${TMDB_BASE}/search/multi`, {
        params: { api_key: API_KEY, query },
      })
      return res.data.results.filter(
        (item: any) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          item.poster_path
      )
    },
    enabled: !!query,
    staleTime: 1000 * 60,
  })

  const filtered =
    filter === "all"
      ? results
      : results.filter((r: any) => r.media_type === filter)

  return (
    <div className="min-h-[70vh] px-5 md:px-12 pt-8 pb-16 text-white">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center glass rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
          <Search size={18} className="text-gray-400 shrink-0 mr-3" />
          {/* 16px text on phones so iOS doesn't zoom in; the "search" key closes the keyboard */}
          <input
            type="search"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={input}
            autoFocus={!query}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                setSearchParams({ query: input.trim() })
                addRecentSearch(input)
                e.currentTarget.blur()
              }
            }}
            placeholder="Search movies or TV shows…"
            className="search-input flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base md:text-sm"
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="-my-2 -mr-2 ml-1 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white active:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Heading */}
      {query && (
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Results for{" "}
          <span className="text-gradient">"{query}"</span>
          {!isLoading && (
            <span className="text-sm font-normal text-gray-500 ml-3">
              {filtered.length} found
            </span>
          )}
        </motion.h1>
      )}

      {/* Filter Tabs */}
      {query && <div className="flex items-center gap-2 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === t.key
                ? "bg-primary text-white shadow-glow"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>}

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Loading results…
        </div>
      )}
      {error && (
        <p className="text-center py-12 text-red-400">
          Error loading results. Please try again.
        </p>
      )}
      {idle && recent.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-300">Recent searches</h2>
            <button
              onClick={clearRecentSearches}
              className="-mr-2 px-2 py-2 text-xs font-medium text-primary hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {recent.map((q) => (
              <li key={q} className="flex items-center">
                <button
                  onClick={() => {
                    setInput(q)
                    setSearchParams({ query: q })
                  }}
                  className="flex-1 min-w-0 flex items-center gap-3 py-3.5 text-left text-[15px] text-gray-200 active:text-white"
                >
                  <Clock size={16} className="text-gray-500 shrink-0" />
                  <span className="truncate">{q}</span>
                </button>
                {/* Fill the box without searching yet, to refine it */}
                <button
                  onClick={() => setInput(q)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 active:bg-white/10"
                  aria-label={`Edit "${q}"`}
                >
                  <ArrowUpLeft size={16} />
                </button>
                <button
                  onClick={() => removeRecentSearch(q)}
                  className="-mr-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-white active:bg-white/10"
                  aria-label={`Remove "${q}" from recent searches`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {idle && recent.length === 0 && (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg font-medium text-gray-400">Search for a movie or TV show</p>
          <p className="text-sm mt-1">Start typing above to see results.</p>
        </div>
      )}
      {query && !isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-24 text-gray-500">
          <p className="text-5xl mb-4">🎬</p>
          <p className="text-lg font-medium text-gray-400">No results found</p>
          <p className="text-sm mt-1">Try a different search term or filter.</p>
        </div>
      )}

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        {filtered.map((item: any, i: number) => (
          <motion.div
            key={`${item.media_type}-${item.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.35 }}
          >
            <Link to={item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`} onClick={() => addRecentSearch(query)}>
              <MovieCard movie={item} />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
