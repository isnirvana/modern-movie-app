// src/components/SearchTypeahead.tsx
import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Search as SearchIcon } from "lucide-react"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = "https://api.themoviedb.org/3"

export default function SearchTypeahead() {
  const [input, setInput] = useState("")
  const [debounced, setDebounced] = useState("")
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce the input
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input.trim()), 500)
    return () => clearTimeout(timer)
  }, [input])

  // Fetch suggestions
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDebounced("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Navigate to detail
  const goToDetail = (item: any) => {
    const path =
      item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`
    navigate(path)
    setInput("")
    setDebounced("")
  }

  // Navigate to full search results
  const goToSearchPage = () => {
    if (input.trim()) {
      navigate(`/search?query=${encodeURIComponent(input.trim())}`)
      setInput("")
      setDebounced("")
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center bg-surface rounded overflow-hidden">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // if there’s a suggestion highlighted, go there; otherwise, go to search page
              if (suggestions.length > 0) {
                goToDetail(suggestions[0])
              } else {
                goToSearchPage()
              }
            }
          }}
          placeholder="Search movies or TV..."
          className="px-2 py-1 bg-surface text-white placeholder-gray-400 flex-1 focus:outline-none"
        />
        <button
          onClick={goToSearchPage}
          className="p-2 hover:bg-surface/80 transition"
        >
          <SearchIcon size={18} className="text-gray-400" />
        </button>
      </div>

      {debounced && (
        <ul className="absolute z-50 mt-1 w-full bg-surface rounded shadow-lg max-h-64 overflow-auto">
          {isFetching && <li className="p-2 text-gray-400">Loading...</li>}
          {!isFetching && suggestions.length === 0 && (
            <li className="p-2 text-gray-400">No results.</li>
          )}
          {!isFetching &&
            suggestions.map((item: any) => (
              <li
                key={`${item.media_type}-${item.id}`}
                className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => goToDetail(item)}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-8 h-12 object-cover rounded mr-2 flex-shrink-0"
                />
                <div>
                  <p className="text-sm text-white truncate">
                    {item.title || item.name}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">
                    {item.media_type === "tv" ? "TV Show" : "Movie"}
                  </p>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
