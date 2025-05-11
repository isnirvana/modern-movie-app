// import { useParams } from 'react-router-dom';
// import { useSearch } from '../hooks/useSearch';
// import MovieCard from '../components/MovieCard';
// import LoadingSkeleton from '../components/LoadingSkeleton';
// import { useState } from 'react';

// export default function SearchPage() {
//   const { query } = useParams();
//   const [page, setPage] = useState(1);
//   const { data, isLoading } = useSearch(query || '', page);

//   if (isLoading) return <LoadingSkeleton />;
//   if (!data || data.results.length === 0)
//     return <p>No results for "{query}"</p>;

//   return (
//     <>
//       <h1 className="text-xl mb-4">Results for "{query}"</h1>
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {data.results.map(m => (
//           <MovieCard key={m.id} movie={m} />
//         ))}
//       </div>
//       {data.page < data.total_pages && (
//         <button
//           onClick={() => setPage(p => p + 1)}
//           className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
//         >
//           Load More
//         </button>
//       )}
//     </>
//   );
// }

import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      setError("")

      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${searchTerm}`
        )
        const filtered = res.data.results.filter(
          (item: any) => item.media_type === "movie" || item.media_type === "tv"
        )
        setResults(filtered)
      } catch (err) {
        setError("Failed to fetch search results.")
      } finally {
        setLoading(false)
      }
    }

    const delayDebounce = setTimeout(fetchResults, 600)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <input
        type="text"
        className="w-full p-3 text-sm rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        placeholder="Search for movies or TV shows..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading && <p className="mt-4 text-gray-400">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {searchTerm && results.length > 0 && (
        <h2 className="text-lg font-semibold mt-6 mb-4">
          Results for: <span className="text-blue-400">{searchTerm}</span>
        </h2>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {results.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05 }}
            className="bg-gray-900 rounded-lg overflow-hidden shadow-md"
          >
            <Link to={`/${item.media_type}/${item.id}`}>
              <img
                src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                alt={item.title || item.name}
                className="w-full h-[240px] object-cover"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate">
                  {item.title || item.name}
                </h3>
                <p className="text-xs text-gray-400 capitalize">
                  {item.media_type}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
