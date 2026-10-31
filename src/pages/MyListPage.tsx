// src/pages/MyListPage.tsx
import { useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Bookmark, Plus, X, LayoutGrid, Film, Tv } from "lucide-react"
import MovieCard from "../components/MovieCard"
import { useMyList } from "../hooks/useMyList"
import { removeFromMyList } from "../utils/myList"

const filters = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "movie", label: "Movies", icon: Film },
  { key: "tv", label: "TV Shows", icon: Tv },
] as const

export default function MyListPage() {
  const list = useMyList()
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all")
  const shown = filter === "all" ? list : list.filter((i) => i.type === filter)

  return (
    <div className="px-5 md:px-12 py-8 md:py-10 min-h-[70vh]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-accent" />
          <div>
            <h1 className="section-heading text-2xl">My List</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {list.length} {list.length === 1 ? "title" : "titles"} · saved on this device
            </p>
          </div>
        </div>

        {list.length > 0 && (
          <div className="flex items-center gap-2">
            {filters.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === key ? "bg-primary text-white" : "glass text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5">
            <Bookmark size={26} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Your list is empty</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">
            Tap <span className="inline-flex items-center gap-0.5 text-white font-medium"><Plus size={13} />My List</span> on any movie or show to save it here for later.
          </p>
          <Link to="/" className="btn-primary mt-7">Browse titles</Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-center py-20 text-gray-500">
          No {filter === "movie" ? "movies" : "TV shows"} in your list yet.
        </p>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence initial={false}>
            {shown.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/${item.type}/${item.id}`}>
                  <MovieCard movie={{ ...item, media_type: item.type }} />
                </Link>
                <button
                  onClick={() => removeFromMyList(item.type, item.id)}
                  className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label={`Remove ${item.title} from My List`}
                >
                  <X size={13} /> Remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
