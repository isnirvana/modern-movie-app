// src/pages/GenrePage.tsx
import { useState } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { useGenreMovies } from "../hooks/useGenreMovies"
import { useGenres } from "../hooks/useGenres"
import MovieCard from "../components/MovieCard"
import LoadingSkeleton from "../components/LoadingSkeleton"
import MediaTypeToggle from "../components/MediaTypeToggle"
import { genrePath, matchGenre, SORT_OPTIONS, type MediaType, type SortKey } from "../utils/genres"
import { motion } from "framer-motion"
import { SlidersHorizontal, Loader2, ChevronDown } from "lucide-react"

export default function GenrePage() {
  const { id } = useParams()
  const genreId = Number(id)
  const [searchParams] = useSearchParams()
  const type: MediaType = searchParams.get("type") === "tv" ? "tv" : "movie"
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortKey>("popular")

  const { data: genres = [] } = useGenres(type)
  const { data: otherGenres = [] } = useGenres(type === "movie" ? "tv" : "movie")
  const genre = genres.find((g) => g.id === genreId)
  // Same genre on the other side, if there is one (e.g. Action ↔ Action & Adventure)
  const counterpart = matchGenre(genre, otherGenres)

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useGenreMovies(type, genreId, sort)

  const switchType = (next: MediaType) => {
    if (next !== type && counterpart) navigate(genrePath(next, counterpart.id), { replace: true })
  }

  if (isLoading) return <LoadingSkeleton />

  const allItems = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="px-5 md:px-12 py-8 md:py-10">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-accent" />
          <div>
            <h1 className="section-heading text-2xl">{genre?.name ?? "Genre"}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{type === "tv" ? "TV Shows" : "Movies"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MediaTypeToggle
            id="genre-page"
            value={type}
            onChange={switchType}
            disabled={counterpart ? [] : [type === "movie" ? "tv" : "movie"]}
          />

          {/* Sort selector */}
          <div className="relative flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-gray-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none pl-3 pr-8 py-2 glass rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-surface-2 text-white">
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {allItems.length === 0 ? (
        <p className="text-center py-24 text-gray-500">Nothing here yet. Try a different sort or switch type.</p>
      ) : (
        <motion.div
          key={`${type}-${sort}`}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
        >
          {allItems.map((item: any) => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
            >
              <Link to={`/${type}/${item.id}`}>
                <MovieCard movie={{ ...item, media_type: type }} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-primary disabled:opacity-50"
          >
            {isFetchingNextPage ? (
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
