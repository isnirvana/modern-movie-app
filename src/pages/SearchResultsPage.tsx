// src/pages/SearchResultsPage.tsx
import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import MovieCard from "../components/MovieCard"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = "https://api.themoviedb.org/3"

export default function SearchResultsPage() {
  // 1) Read the ?query=… param
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("query") || ""

  // 2) Filter tab state: "all" | "movie" | "tv"
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all")

  useEffect(() => {
    // reset filter when query changes
    setFilter("all")
  }, [query])

  // 3) Fetch results with React Query v5 object syntax
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

  // 4) Derive filtered list
  const filtered =
    filter === "all"
      ? results
      : results.filter((r: any) => r.media_type === filter)

  return (
    <div className="p-4 max-w-6xl mx-auto text-white">
      {/* Search input & button */}
      <div className="mb-6 flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setSearchParams({ query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearchParams({ query })
          }}
          placeholder="Search movies or TV shows..."
          className="flex-1 p-2 bg-surface rounded-l text-white placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={() => setSearchParams({ query })}
          className="px-4 bg-primary rounded-r hover:bg-primary/80 transition"
        >
          Search
        </button>
      </div>

      {/* Header */}
      {query && (
        <h1 className="text-2xl font-semibold mb-4">
          Results for “<span className="text-primary">{query}</span>”
        </h1>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        {(["all", "movie", "tv"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded
              ${
                filter === f
                  ? "bg-primary text-black"
                  : "bg-surface text-gray-400 hover:bg-surface/80"
              }
            `}
          >
            {f === "all" ? "All" : f === "movie" ? "Movies" : "TV Shows"}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {isLoading && <p>Loading results…</p>}
      {error && (
        <p className="text-red-400">Error loading results. Please try again.</p>
      )}

      {/* No results */}
      {!isLoading && !error && filtered.length === 0 && (
        <p>No {filter === "all" ? "" : filter} results found.</p>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((item: any) => (
          <Link
            key={`${item.media_type}-${item.id}`}
            to={
              item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`
            }
          >
            <MovieCard movie={item} />
          </Link>
        ))}
      </div>
    </div>
  )
}
