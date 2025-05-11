import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useGenreMovies } from "../hooks/useGenreMovies"
import MovieCard from "../components/MovieCard"
import LoadingSkeleton from "../components/LoadingSkeleton"

const GENRE_API = "https://api.themoviedb.org/3/genre/movie/list?language=en"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function GenrePage() {
  const { id } = useParams()
  const [genreName, setGenreName] = useState("")
  const [sort, setSort] = useState("popularity.desc")

  const { data, fetchNextPage, hasNextPage, isLoading, isFetching } =
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

  return (
    <>
      <div className="flex items-center mb-4 space-x-4">
        <h1 className="text-xl font-semibold text-white">Genre: {genreName}</h1>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-gray-700 p-1 rounded text-white"
        >
          <option value="popularity.desc">Popularity</option>
          <option value="release_date.desc">Release Date</option>
          <option value="vote_average.desc">Rating</option>
        </select>
      </div>

      {/* <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {data.pages.flatMap((p) =>
          p.results.map((m) => <MovieCard key={m.id} movie={m} />)
        )}
      </div> */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {data.pages.flatMap((p) =>
          p.results.map((m) => (
            <Link
              key={m.id}
              to={m.media_type === "tv" ? `/tv/${m.id}` : `/movie/${m.id}`}
            >
              <MovieCard movie={m} />
            </Link>
          ))
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
          >
            {isFetching ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  )
}
