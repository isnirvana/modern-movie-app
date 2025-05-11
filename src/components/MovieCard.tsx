// // src/components/MovieCard.tsx
// import { motion } from "framer-motion"
// import { Star } from "lucide-react"

// interface Movie {
//   id: number
//   title: string
//   vote_average: number
//   runtime?: number
//   poster_path: string
// }

// export default function MovieCard({ movie }: { movie: Movie }) {
//   return (
//     <motion.div
//       whileHover={{ scale: 1.03 }}
//       transition={{ duration: 0.2 }}
//       className="bg-surface rounded-lg overflow-hidden flex flex-col"
//     >
//       {/* Fixed aspect ratio container */}
//       <div className="relative w-full aspect-[2/3]">
//         <img
//           src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
//           alt={movie.title}
//           className="object-cover w-full h-full"
//           loading="lazy"
//         />
//       </div>

//       {/* Info footer */}
//       <div className="p-3 flex-1 flex flex-col justify-between">
//         <h3 className="text-sm font-semibold text-white line-clamp-2">
//           {movie.title}
//         </h3>
//         <div className="mt-2 flex items-center text-gray-300 text-xs space-x-2">
//           <Star size={14} className="text-yellow-400" />
//           <span>{movie.vote_average.toFixed(1)}</span>
//           {movie.runtime != null && (
//             <>
//               <span>•</span>
//               <span>{movie.runtime} min</span>
//             </>
//           )}
//         </div>
//       </div>
//     </motion.div>
//   )
// }

import { motion } from "framer-motion"
import { Star } from "lucide-react"

interface Movie {
  id: number
  title: string
  vote_average?: number // make optional
  runtime?: number
  poster_path: string
}

export default function MovieCard({ movie }: { movie: Movie }) {
  // Safely default vote_average to 0
  const rating = movie.vote_average ?? 0

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="bg-surface rounded-lg overflow-hidden flex flex-col"
    >
      {/* Poster */}
      <div className="relative w-full aspect-[2/3]">
        <img
          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
          alt={movie.title}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-white line-clamp-2">
          {movie.title}
        </h3>
        <div className="mt-2 flex items-center text-gray-300 text-xs space-x-2">
          <Star size={14} className="text-yellow-400" />
          <span>{rating.toFixed(1)}</span>
          {movie.runtime != null && (
            <>
              <span>•</span>
              <span>{movie.runtime} min</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
