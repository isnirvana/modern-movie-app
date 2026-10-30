// src/components/ContentShelf.tsx
import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import MovieCard from "./MovieCard"

interface ContentShelfProps {
  title: string
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

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
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

  const handleLoadMoreStatic = () => {
    setVisible((v) => Math.min(v + increment, items.length))
  }

  const displayItems = items.slice(0, fetchNextPage ? items.length : visible)

  return (
    <section className="px-5 md:px-12 py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="section-heading">{title}</h2>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        {displayItems.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            initial={false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <Link
              to={item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`}
            >
              <MovieCard movie={item} />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Load More */}
      {fetchNextPage ? (
        hasNextPage ? (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="btn-primary disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Loading…
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        ) : null
      ) : (
        visible < items.length && (
          <div className="flex justify-center mt-10">
            <button onClick={handleLoadMoreStatic} className="btn-primary">
              Load More
            </button>
          </div>
        )
      )}
    </section>
  )
}
