// src/pages/GenrePage.tsx
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useGenreMovies } from "../hooks/useGenreMovies"
import MovieCard from "../components/MovieCard"
import LoadingSkeleton from "../components/LoadingSkeleton"
import { motion } from "framer-motion"
import { SlidersHorizontal, Loader2 } from "lucide-react"

const GENRE_API = "https://api.themoviedb.org/3/genre/movie/list?language=en"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "vote_average.desc", label: "Highest Rated" },
]

export default function GenrePage() {
  const { id } = useParams()
  const [genreName, setGenreName] = useState("")
  const [sort, setSort] = useState("popularity.desc")

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, isFetching } =
    useGenreMovies(Number(id), sort)

  useEffect(() => {
    async function fetchGenres() {
      const res = await fetch(`${GENRE_API}&api_key=${API_KEY}`)
      const json = await res.json()
      const genre = json.genres.find((g: any) => g.id === Number(id))
      setGenreName(genre?.name || "Unknown")
    }
    fetchGenres()
  }, [id])

  if (isLoading) return <LoadingSkeleton />

  const allItems = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="px-6 md:px-12 py-10">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h1 className="section-heading text-2xl">{genreName}</h1>
        </div>

        {/* Sort selector */}
        <div className="relative flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 glass rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-surface-2 text-white">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {allItems.map((item: any) => (
          <motion.div
            key={item.id}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
          >
            <Link to={item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`}>
              <MovieCard movie={item} />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage || isFetching}
            className="btn-primary disabled:opacity-50"
          >
            {isFetchingNextPage || isFetching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading…
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  )
}
