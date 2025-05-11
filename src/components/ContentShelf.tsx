// src/components/ContentShelf.tsx
import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import MovieCard from "./MovieCard"

interface ContentShelfProps {
  title: string
  /** flat list of already-fetched items (for infinite mode or static mode) */
  items: Array<{
    id: number
    media_type?: "movie" | "tv"
    [key: string]: any
  }>
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  initialCount?: number
  increment?: number
}

export default function ContentShelf({
  title,
  items,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  initialCount = 12,
  increment = 12,
}: ContentShelfProps) {
  const [visible, setVisible] = useState(initialCount)

  // Debug: ensure media_type is present
  console.log("First shelf item:", items[0])

  const handleLoadMoreStatic = () => {
    setVisible((v) => Math.min(v + increment, items.length))
  }

  const displayItems = items.slice(0, fetchNextPage ? items.length : visible)

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">{title}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-hidden">
        {displayItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              to={
                item.media_type === "tv"
                  ? `/tv/${item.id}`
                  : `/movie/${item.id}`
              }
            >
              <MovieCard movie={item} />
            </Link>
          </motion.div>
        ))}
      </div>

      {fetchNextPage && hasNextPage !== undefined ? (
        hasNextPage ? (
          <div className="flex justify-center mt-6">
            <button
              onClick={fetchNextPage}
              disabled={isFetchingNextPage}
              className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
            >
              {isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          </div>
        ) : null
      ) : (
        visible < items.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMoreStatic}
              className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
            >
              Load More
            </button>
          </div>
        )
      )}
    </section>
  )
}
