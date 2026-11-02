// src/components/MovieCard.tsx
import { motion } from "framer-motion"
import { Star, Play } from "lucide-react"
import { useState } from "react"
import { isReleased, formatReleaseDate } from "../utils/media"

interface Movie {
  id: number
  title?: string
  name?: string
  vote_average?: number
  runtime?: number
  poster_path?: string | null
  media_type?: string
  release_date?: string
  first_air_date?: string
}

export default function MovieCard({ movie }: { movie: Movie }) {
  const title = movie.title || movie.name || "Untitled"
  const rating = movie.vote_average ?? 0
  const date = movie.release_date || movie.first_air_date
  const year = date ? date.slice(0, 4) : null
  // Not out yet: badge it and show the date instead of the year, with no Play hint
  const upcoming = !isReleased(movie)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      whileHover="hover"
      className="relative rounded-2xl overflow-hidden bg-surface shadow-card cursor-pointer group"
      style={{ aspectRatio: "2/3" }}
    >
      {/* Poster */}
      {!imgError && movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-surface-2 flex items-center justify-center">
          <span className="text-4xl opacity-20">🎬</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-card-gradient opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Rating badge (top-right) */}
      {rating > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-gold">
          <Star size={10} fill="currentColor" />
          {rating.toFixed(1)}
        </div>
      )}

      {/* Badges (top-left): TV, Soon */}
      {(movie.media_type === "tv" || upcoming) && (
        <div className="absolute top-2 left-2 flex gap-1">
          {movie.media_type === "tv" && (
            <span className="px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-xs font-semibold">TV</span>
          )}
          {upcoming && (
            <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-xs font-semibold text-white ring-1 ring-white/20">
              Soon
            </span>
          )}
        </div>
      )}

      {/* Play button (appears on hover) */}
      {!upcoming && <motion.div
        variants={{ hover: { opacity: 1, scale: 1 } }}
        initial={{ opacity: 0, scale: 0.8 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-glow">
          <Play size={20} fill="white" className="ml-0.5" />
        </div>
      </motion.div>}

      {/* Title / info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-white">
          {title}
        </h3>
        {upcoming ? (
          <p className="text-xs font-medium text-[#b3aeff] mt-0.5 truncate">
            {date ? `Coming ${formatReleaseDate(date, true)}` : "Coming soon"}
          </p>
        ) : (year || movie.runtime != null) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {[year, movie.runtime != null ? `${movie.runtime} min` : null].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </motion.div>
  )
}
