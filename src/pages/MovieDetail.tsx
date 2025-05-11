// import { useParams } from "react-router-dom"
// import { useMovieDetails } from "../hooks/useMovieDetails"
// import CastCarousel from "../components/CastCarousel"
// import { useState } from "react"
// import { motion, AnimatePresence } from "framer-motion"

// export default function MovieDetail() {
//   const { id } = useParams()
//   const { data, isLoading, error } = useMovieDetails(Number(id)) // Handling possible error in API call
//   const [watching, setWatching] = useState(false)

//   // Show loading message or error message
//   if (isLoading) return <p>Loading...</p>
//   if (error) return <p>Error loading movie details: {error.message}</p>

//   // Destructuring data from the fetched API response
//   const {
//     title,
//     overview,
//     poster_path,
//     backdrop_path,
//     release_date,
//     runtime,
//     vote_average,
//     credits,
//   } = data

//   return (
//     <>
//       {/* Backdrop image */}
//       <div
//         className="h-96 bg-cover bg-center rounded"
//         style={{
//           backgroundImage: `url(https://image.tmdb.org/t/p/original${backdrop_path})`,
//         }}
//       />

//       {/* Movie details section */}
//       <div className="mt-4 flex flex-col md:flex-row">
//         {/* Poster image */}
//         <img
//           src={`https://image.tmdb.org/t/p/w342${poster_path}`}
//           alt={title}
//           className="rounded"
//         />
//         <div className="md:ml-6">
//           {/* Movie title and other metadata */}
//           <h1 className="text-3xl font-bold">{title}</h1>
//           <p>
//             {release_date} • {runtime} min • ⭐ {vote_average}
//           </p>
//           <p className="mt-4">{overview}</p>

//           {/* Watch Now Button */}
//           <button
//             onClick={() => setWatching(true)}
//             className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-500"
//           >
//             Watch Now
//           </button>
//         </div>
//       </div>

//       {/* Cast section */}
//       <h2 className="text-2xl mt-8">Cast</h2>
//       <CastCarousel cast={credits.cast} />

//       {/* Watch Modal */}
//       <AnimatePresence>
//         {watching && (
//           <motion.div
//             className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <iframe
//               src={`https://www.2embed.cc/embed/${id}`}
//               allowFullScreen
//               className="w-full h-full"
//             />
//             <button
//               onClick={() => setWatching(false)}
//               className="absolute top-4 right-4 text-white text-2xl"
//             >
//               ×
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   )
// }

// src/pages/MovieDetail.tsx
import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMovieDetails } from "../hooks/useMovieDetails"
import CastCarousel from "../components/CastCarousel"
import { motion, AnimatePresence } from "framer-motion"

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const { data: m, isLoading } = useMovieDetails(movieId)
  const [watching, setWatching] = useState(false)

  if (isLoading || !m) return <p className="p-6 text-white">Loading…</p>

  return (
    <div className="text-white">
      {/* Hero: 90vh */}
      <div
        className="relative h-[85vh] bg-cover bg-center"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${m.backdrop_path})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute bottom-20 left-10 max-w-2xl space-y-10">
          <h1 className="text-5xl font-extrabold">{m.title}</h1>
          <p className="text-sm max-w-lg line-clamp-3">{m.overview}</p>
          <button
            onClick={() => setWatching(true)}
            className="flex items-center px-6 py-3 bg-white text-black rounded-lg hover:brightness-110 transition"
          >
            ▶ Play
          </button>
        </div>
      </div>

      {/* Cast */}
      <div className="mt-8 px-6">
        <h2 className="text-2xl font-semibold mb-4">Cast</h2>
        <CastCarousel cast={m.credits.cast} />
      </div>

      {/* 2Embed Modal */}
      <AnimatePresence>
        {watching && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <iframe
              src={`https://www.2embed.cc/embed/${movieId}`}
              allowFullScreen
              className="w-full h-full"
            />
            <button
              onClick={() => setWatching(false)}
              className="absolute top-4 right-4 text-white text-3xl"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
