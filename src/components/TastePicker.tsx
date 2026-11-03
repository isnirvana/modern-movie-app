// src/components/TastePicker.tsx
// "Pick a few titles you love": a poster grid (trending plus the most watched movies and shows) and a search,
// for profiles with nothing to go on yet, or to fine-tune later. Picks are saved as favourites (utils/favourites.ts),
// which For You treats as strong seeds.
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Search, X } from "lucide-react"
import { useTmdbList } from "../hooks/useTmdbList"
import { useMultiSearch } from "../hooks/useMultiSearch"
import { useDebounced } from "../hooks/useDebounced"
import { setFavourites, type Favourite } from "../utils/favourites"

export const MIN_PICKS = 3

type Option = Omit<Favourite, "pickedAt">
export type Filter = "all" | "movie" | "tv"

const keyOf = (o: { type: string; id: number }) => `${o.type}-${o.id}`
const toOption = (item: any): Option | null =>
  item.poster_path && (item.media_type === "movie" || item.media_type === "tv")
    ? { type: item.media_type, id: item.id, title: item.title || item.name || "", poster_path: item.poster_path }
    : null

// Takes turns from each list, leaving out repeats
function interleave(lists: Option[][]) {
  const seen = new Set<string>()
  const out: Option[] = []
  for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) {
    for (const list of lists) {
      const o = list[i]
      if (!o || seen.has(keyOf(o))) continue
      seen.add(keyOf(o))
      out.push(o)
    }
  }
  return out
}

type Props = {
  initial: Favourite[]
  onDone: () => void
  // Shown in a dialog (the bar sits at the dialog's bottom) rather than on the page (above the phone tab bar)
  inDialog?: boolean
  startOn?: Filter
}

export default function TastePicker({ initial, onDone, inDialog = false, startOn = "all" }: Props) {
  const [picked, setPicked] = useState<Option[]>(() => initial.map(({ type, id, title, poster_path }) => ({ type, id, title, poster_path })))
  const [filter, setFilter] = useState<Filter>(startOn)
  const [query, setQuery] = useState("")
  const search = useDebounced(query.trim(), 300)

  const trending = useTmdbList("/trending/all/week")
  const movies = useTmdbList("/discover/movie?sort_by=vote_count.desc", "movie")
  const shows = useTmdbList("/discover/tv?sort_by=vote_count.desc", "tv")
  const results = useMultiSearch(search)

  const options = (list?: any[]) => (list ?? []).map(toOption).filter(Boolean) as Option[]
  const grid = (search ? options(results.data) : interleave([options(trending.data), options(movies.data), options(shows.data)])).filter(
    (o) => filter === "all" || o.type === filter
  )
  const loading = search ? results.isLoading : trending.isLoading && movies.isLoading && shows.isLoading
  const isPicked = (o: Option) => picked.some((p) => keyOf(p) === keyOf(o))
  const toggle = (o: Option) => setPicked((list) => (isPicked(o) ? list.filter((p) => keyOf(p) !== keyOf(o)) : [...list, o]))

  const save = () => {
    setFavourites(picked)
    onDone()
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie or show"
            aria-label="Search titles"
            className="search-input w-full bg-white/[0.06] border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm outline-none focus:border-primary/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </label>
        <Segmented value={filter} onChange={setFilter} id={inDialog ? "picker-dialog" : "picker"} />
      </div>

      {/* Posters */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-5 pb-28">
        {loading
          ? Array.from({ length: 18 }).map((_, i) => <div key={i} className="rounded-xl skeleton" style={{ aspectRatio: "2/3" }} />)
          : grid.map((o) => {
              const on = isPicked(o)
              return (
                <button
                  key={keyOf(o)}
                  type="button"
                  onClick={() => toggle(o)}
                  aria-pressed={on}
                  aria-label={o.title}
                  className="group relative rounded-xl overflow-hidden bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ aspectRatio: "2/3" }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w342${o.poster_path}`}
                    alt=""
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover transition duration-300 ${on ? "scale-105 brightness-50" : "group-hover:scale-105"}`}
                  />
                  <span className={`absolute inset-0 rounded-xl ring-inset transition ${on ? "ring-[3px] ring-primary" : "ring-1 ring-white/10"}`} />
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-glow">
                          <Check size={22} strokeWidth={3} />
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="absolute inset-x-0 bottom-0 p-2 pt-6 bg-gradient-to-t from-black/90 to-transparent text-left text-[11px] font-medium leading-tight line-clamp-2">
                    {o.title}
                  </span>
                </button>
              )
            })}
        {!loading && grid.length === 0 && (
          <p className="col-span-full text-sm text-gray-500 text-center py-12">No titles found{search ? ` for "${search}"` : ""}.</p>
        )}
      </div>

      {/* What's picked, and Done */}
      <div
        className={`sticky z-20 mt-auto -mx-5 md:-mx-0 px-5 md:px-4 py-3 md:rounded-2xl border-t md:border border-white/[0.08] flex items-center gap-3 ${
          inDialog ? "bottom-0 md:bottom-5" : "bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-4"
        }`}
        style={{ background: "rgba(16,16,24,0.96)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="flex -space-x-3 shrink-0">
          {picked.slice(-4).map((p) => (
            <img
              key={keyOf(p)}
              src={`https://image.tmdb.org/t/p/w92${p.poster_path}`}
              alt=""
              className="w-8 h-12 rounded-md object-cover ring-2 ring-[#101018]"
            />
          ))}
        </div>
        <p className="flex-1 min-w-0 text-sm">
          {picked.length >= MIN_PICKS ? (
            <span className="text-white font-medium">{picked.length} picked</span>
          ) : (
            <span className="text-gray-400">
              Pick <span className="text-white font-medium">{MIN_PICKS - picked.length}</span> more
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={picked.length < MIN_PICKS && initial.length === 0}
          className="btn-primary py-2.5 px-5 text-sm disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {initial.length ? "Save" : "Show my picks"}
        </button>
      </div>
    </div>
  )
}

// All | Movies | Shows
export function Segmented({ value, onChange, id }: { value: Filter; onChange: (f: Filter) => void; id: string }) {
  const options: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "movie", label: "Movies" },
    { value: "tv", label: "Shows" },
  ]
  return (
    <div className="inline-flex self-start p-1 rounded-xl bg-white/[0.06] border border-white/[0.08]" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${value === o.value ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          {value === o.value && (
            <motion.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-lg bg-primary" transition={{ type: "spring", damping: 30, stiffness: 400 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

