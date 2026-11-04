// src/pages/ForYouPage.tsx
// Recommendations for the profile in use, from its watch history, My List and the titles it says it loves,
// ranked by utils/recommend.ts: the top pick in the spotlight (its trailer playing), the profile's taste as genre
// chips, top picks with why each is there, new releases that fit, "Because you watched" for its strongest titles,
// then more of its genres. All / Movies / Shows narrows the whole page (?type=movie|tv). No title shows up twice:
// rows appear in order, each once the ones above it are in, so nothing is taken out of a row already on screen.
// A profile with nothing to go on starts with the taste picker.
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Heart, Info, Play, Sparkles, Star, X } from "lucide-react"
import MediaRow from "../components/MediaRow"
import MyListButton from "../components/MyListButton"
import TitleLogo from "../components/TitleLogo"
import HeroTrailer, { MuteButton, type TrailerStatus } from "../components/HeroTrailer"
import PopularOnLumoflix from "../components/PopularOnLumoflix"
import { RowSkeleton, SpotlightSkeleton } from "../components/PageSkeletons"
import TastePicker, { Segmented, type Filter } from "../components/TastePicker"
import { useTopPicks } from "../hooks/useTopPicks"
import { useTmdbList } from "../hooks/useTmdbList"
import { useGenres } from "../hooks/useGenres"
import { useTitleExtras } from "../hooks/useTitleExtras"
import { useActiveProfile } from "../hooks/useProfiles"
import { useFavourites } from "../hooks/useFavourites"
import { useVisualViewport, visibleAreaStyle } from "../hooks/useVisualViewport"
import { because, byTaste, favouriteType, reason, topGenres, withoutExcluded, type Pick, type Seed, type Taste } from "../utils/recommend"
import { genrePath, type Genre, type MediaType } from "../utils/genres"

const BECAUSE_ROWS = 3
const PICKS_ROW = 14
// Picks ranked before narrowing to movies or shows, so each still has plenty
const PICKS_RANKED = 60
// A row with fewer titles left than this (after taking out ones already shown) is dropped
const MIN_ROW = 6
// "New for you": out within this many days
const NEW_DAYS = 60

const keyOf = (item: any) => `${item.media_type}-${item.id}`
const titleOf = (item: any) => item.title || item.name || ""
const yearOf = (item: any) => (item.release_date || item.first_air_date || "").slice(0, 4)
const detailPath = (item: any) => `/${item.media_type === "tv" ? "tv" : "movie"}/${item.id}`
const daysAgoISO = (days: number) => new Date(Date.now() - days * 86_400_000).toLocaleDateString("en-CA")

// Recent, popular titles in some genres (any of them)
function newPath(type: MediaType, genres: number[]) {
  if (!genres.length) return ""
  const date = type === "tv" ? "first_air_date.gte" : "primary_release_date.gte"
  return `/discover/${type}?sort_by=popularity.desc&vote_count.gte=20&with_genres=${genres.join("|")}&${date}=${daysAgoISO(NEW_DAYS)}`
}

type TypedGenre = Genre & { type: MediaType }
const tagged = (list: Genre[], type: MediaType): TypedGenre[] => list.map((g) => ({ ...g, type }))

// Takes turns from each list
const interleave = (a: any[], b: any[]) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => [a[i], b[i]]).flat().filter(Boolean)

export default function ForYouPage() {
  const profile = useActiveProfile()
  const favourites = useFavourites()
  const [params, setParams] = useSearchParams()
  const filter: Filter = params.get("type") === "movie" || params.get("type") === "tv" ? (params.get("type") as MediaType) : "all"
  const setFilter = (f: Filter) => setParams(f === "all" ? {} : { type: f }, { replace: true })
  const [picker, setPicker] = useState<Filter | null>(null)

  const { picks: allPicks, isLoading: picksLoading, tasteLoading, seeds, lists, taste, exclude } = useTopPicks(PICKS_RANKED)
  const picks = filter === "all" ? allPicks : allPicks.filter((p) => p.item.media_type === filter)
  const type: MediaType = filter === "all" ? favouriteType(seeds) : filter
  const movieGenresQuery = useGenres("movie")
  const tvGenresQuery = useGenres("tv")
  const movieGenres = movieGenresQuery.data ?? []
  const tvGenres = tvGenresQuery.data ?? []
  // Until all this is in, the picks (and which genre rows to show) can still change
  const isLoading = picksLoading || tasteLoading || movieGenresQuery.isLoading || tvGenresQuery.isLoading
  const typeGenres = type === "tv" ? tvGenres : movieGenres
  const [genre1, genre2] = topGenres(taste, 2, typeGenres.map((g) => g.id))
  const nameOf = (id?: number) => typeGenres.find((g) => g.id === id)?.name
  const kind = type === "tv" ? "shows" : "movies"
  const released = type === "tv" ? "first_air_date.lte" : "primary_release_date.lte"
  const today = new Date().toLocaleDateString("en-CA")

  // New releases, for movies and/or shows
  const newMovies = useTmdbList(filter !== "tv" ? newPath("movie", topGenres(taste, 3, movieGenres.map((g) => g.id))) : "", "movie")
  const newShows = useTmdbList(filter !== "movie" ? newPath("tv", topGenres(taste, 3, tvGenres.map((g) => g.id))) : "", "tv")
  // Genre rows (fetched once the taste is known)
  const mix = useTmdbList(
    genre1 && genre2 ? `/discover/${type}?sort_by=popularity.desc&vote_count.gte=100&with_genres=${genre1},${genre2}` : "",
    type
  )
  const gems = useTmdbList(
    genre1 ? `/discover/${type}?sort_by=vote_average.desc&vote_count.gte=150&vote_count.lte=2000&${released}=${today}&with_genres=${genre1}` : "",
    type
  )
  const best = useTmdbList(genre2 ? `/discover/${type}?sort_by=vote_average.desc&vote_count.gte=1000&with_genres=${genre2}` : "", type)

  const dialog = (
    <AnimatePresence>
      {picker && <PickerDialog key="picker" startOn={picker} onClose={() => setPicker(null)} />}
    </AnimatePresence>
  )

  if (seeds.length === 0) return <Welcome name={profile.name} />

  // Rows in page order, each leaving out what the rows above it already show
  const shown = new Set(exclude)
  const take = (items: any[] = [], max = 20) => {
    const left = withoutExcluded(items, shown).slice(0, max)
    left.forEach((item) => shown.add(keyOf(item)))
    return left
  }
  const [spotlight, ...rest] = isLoading ? [] : picks
  if (spotlight) shown.add(keyOf(spotlight.item))
  const pickRow = rest.slice(0, PICKS_ROW)
  pickRow.forEach((p) => shown.add(keyOf(p.item)))

  // The rows below the top picks, in order, stopping (with a placeholder) at the first one still loading
  const rows: ReactNode[] = []
  let waiting = isLoading
  const row = (loading: boolean, build: () => ReactNode) => {
    if (waiting) return
    if (loading) waiting = true
    else rows.push(build())
  }
  row(newMovies.isLoading || newShows.isLoading, () => {
    const items = take(interleave(byTaste(newMovies.data ?? [], taste), byTaste(newShows.data ?? [], taste)))
    return items.length >= MIN_ROW && <MediaRow key="new" kicker="New for you" title="Just released, picked for your taste" items={items} />
  })
  seeds
    .map((seed, i) => ({ seed, list: lists[i] }))
    .filter(({ seed }) => seed.source !== "saved" && (filter === "all" || seed.type === filter))
    .slice(0, BECAUSE_ROWS)
    .forEach(({ seed, list }) =>
      row(false, () => {
        const items = take(list)
        return items.length >= MIN_ROW && <MediaRow key={`${seed.type}-${seed.id}`} kicker={because(seed)} title={seed.title} items={items} />
      })
    )
  row(mix.isLoading, () => {
    const items = take(mix.data)
    return genre1 && genre2 && items.length >= MIN_ROW && (
      <MediaRow key="mix" kicker="Your mix" title={`${nameOf(genre1)} & ${nameOf(genre2)} ${kind}`} items={items} />
    )
  })
  row(false, () => filter === "all" && <PopularOnLumoflix key="popular" />)
  row(gems.isLoading, () => {
    const items = take(gems.data)
    return genre1 && items.length >= MIN_ROW && (
      <MediaRow key="gems" kicker="Hidden gems" title={`Highly rated ${nameOf(genre1)} ${kind} you may have missed`} items={items} />
    )
  })
  row(best.isLoading, () => {
    const items = take(best.data)
    return genre2 && items.length >= MIN_ROW && (
      <MediaRow key="best" kicker="Best of a favourite" title={`Top-rated ${nameOf(genre2)} ${kind}`} items={items} to={genrePath(type, genre2)} />
    )
  })
  if (waiting) rows.push(<RowSkeleton key="loading" />)

  return (
    <div className="pb-6">
      {spotlight ? (
        <Spotlight key={keyOf(spotlight.item)} pick={spotlight} genres={[...movieGenres, ...tvGenres]} />
      ) : isLoading ? (
        <SpotlightSkeleton />
      ) : null}

      <TasteStrip
        name={profile.name}
        seeds={seeds}
        taste={taste}
        genres={
          filter === "all"
            ? [...tagged(movieGenres, "movie"), ...tagged(tvGenres, "tv").filter((g) => !movieGenres.some((m) => m.id === g.id))]
            : tagged(filter === "tv" ? tvGenres : movieGenres, filter)
        }
        filter={filter}
        onFilter={setFilter}
        onEdit={() => setPicker(filter)}
        favourites={favourites.length}
        loading={isLoading}
      />

      {!spotlight && !isLoading && (
        <NothingYet filter={filter} onPick={() => setPicker(filter)} />
      )}

      <PickRow picks={pickRow} isLoading={isLoading} />
      {rows}
      {dialog}
    </div>
  )
}

// --- The top pick, big, with its trailer ---

function Spotlight({ pick, genres }: { pick: Pick; genres: Genre[] }) {
  const { item } = pick
  const type: MediaType = item.media_type === "tv" ? "tv" : "movie"
  const extras = useTitleExtras(type, item.id)
  const logo = extras.data ? extras.data.logo : extras.isError ? null : undefined
  const [muted, setMuted] = useState(true)
  const [trailer, setTrailer] = useState<TrailerStatus>("waiting")
  const title = titleOf(item)
  const genreNames = (item.genre_ids ?? [])
    .map((id: number) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3)

  return (
    <section className="relative -mt-14 h-[78vh] min-h-[520px] max-h-[820px] flex items-end overflow-hidden">
      {/* Phones get the portrait poster (a wide backdrop would be cropped to a sliver), like the Home hero */}
      <picture>
        {item.backdrop_path && <source media="(min-width: 768px)" srcSet={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`} />}
        <img
          src={`https://image.tmdb.org/t/p/w780${item.poster_path || item.backdrop_path}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </picture>
      <HeroTrailer videoKey={extras.data?.trailer?.key} muted={muted} onStatus={setTrailer} />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/25 to-transparent hidden md:block" />
      {/* Phones: a deeper fade, so the text sits on dark rather than on the poster's own artwork */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-bg via-bg/90 to-transparent md:hidden" />

      {trailer === "playing" && (
        <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} className="absolute z-10 top-20 right-5 md:top-auto md:bottom-14 md:right-12" />
      )}

      <div className="relative w-full px-5 md:px-12 pb-8 md:pb-14 max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-accent">
            <Sparkles size={12} /> Your top pick
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
            {pick.match}% match
          </span>
        </div>
        <TitleLogo
          title={title}
          logo={logo}
          textClassName="text-3xl md:text-5xl font-black leading-tight"
          logoClassName="max-h-20 md:max-h-28 max-w-[80%] md:max-w-md"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-sm text-gray-300">
          {(item.vote_average ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-gold font-semibold">
              <Star size={13} fill="currentColor" /> {item.vote_average.toFixed(1)}
            </span>
          )}
          {yearOf(item) && <span>{yearOf(item)}</span>}
          {type === "tv" && <span className="px-1.5 py-px rounded bg-white/15 text-xs font-semibold">TV</span>}
          {genreNames.length > 0 && <span className="text-gray-400">{genreNames.join(" · ")}</span>}
        </div>
        <p className="text-xs md:text-sm text-gray-400 mt-3 truncate">{reason(pick.because)}</p>
        {/* One line on phones too: Watch now takes the room, More info is just its icon */}
        <div className="flex items-center gap-2.5 md:gap-3 mt-5">
          <Link to={`${detailPath(item)}?play=1`} className="btn-primary flex-1 sm:flex-none justify-center whitespace-nowrap py-2.5 md:py-3 text-sm">
            <Play size={15} fill="currentColor" /> Watch now
          </Link>
          <Link to={detailPath(item)} className="btn-secondary py-2.5 px-3.5 sm:px-6 md:py-3 text-sm" aria-label="More info">
            <Info size={15} /> <span className="hidden sm:inline">More info</span>
          </Link>
          <MyListButton
            item={{
              type,
              id: item.id,
              title,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
              vote_average: item.vote_average,
              release_date: item.release_date,
              first_air_date: item.first_air_date,
            }}
            className="btn-secondary whitespace-nowrap py-2.5 px-4 sm:px-6 md:py-3 text-sm"
          />
        </div>
      </div>
    </section>
  )
}


// --- The heading: whose page, what it's based on, All / Movies / Shows, and the profile's favourite genres ---

function TasteStrip({ name, seeds, taste, genres, filter, onFilter, onEdit, favourites, loading }: {
  name: string
  seeds: Seed[]
  taste: Taste
  genres: TypedGenre[]
  filter: Filter
  onFilter: (f: Filter) => void
  onEdit: () => void
  favourites: number
  loading: boolean
}) {
  // "4 watched, 3 loved and 2 saved"
  const basis = (["watched", "loved", "saved"] as const)
    .map((source) => [seeds.filter((s) => s.source === source).length, source] as const)
    .filter(([n]) => n > 0)
    .map(([n, source]) => `${n} ${source}`)
  const chips = topGenres(taste, 6, genres.map((g) => g.id)).map((id) => {
    const genre = genres.find((g) => g.id === id)!
    return { id, name: genre.name, to: genrePath(genre.type, id), strength: taste.get(id) ?? 0 }
  })

  return (
    <section className="px-5 md:px-12 pt-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="section-heading text-2xl md:text-3xl">For {name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Based on {basis.length > 1 ? `${basis.slice(0, -1).join(", ")} and ${basis[basis.length - 1]}` : basis[0]} titles.
            Recent and finished ones count most.
          </p>
        </div>
        <Segmented value={filter} onChange={onFilter} id="for-you-type" />
      </div>

      <div className="flex items-center gap-2 mt-5 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 pb-1" style={{ scrollbarWidth: "none" }}>
        {(chips.length > 0 || loading) && (
          <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-gray-500 shrink-0 mr-1">Your taste</span>
        )}
        {loading &&
          !chips.length &&
          [104, 88, 120, 96].map((w, i) => <span key={i} className="shrink-0 h-8 rounded-full skeleton" style={{ width: w }} aria-hidden="true" />)}
        {chips.map((c) => (
          <Link
            key={c.id}
            to={c.to}
            className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium bg-white/[0.06] border border-white/10 hover:border-primary/50 hover:bg-primary/15 transition-colors"
          >
            {c.name}
            <span className="w-8 h-1 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
              <span className="block h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.max(15, c.strength * 100)}%` }} />
            </span>
          </Link>
        ))}
        <button
          onClick={onEdit}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-gray-300 border border-dashed border-white/20 hover:border-primary/60 hover:text-white transition-colors"
        >
          <Heart size={14} className="text-accent" /> {favourites ? `Titles you love · ${favourites}` : "Add titles you love"}
        </button>
      </div>
    </section>
  )
}

// Narrowed to movies or shows, with nothing of that kind to go on
function NothingYet({ filter, onPick }: { filter: Filter; onPick: () => void }) {
  const kind = filter === "tv" ? "shows" : filter === "movie" ? "movies" : "titles"
  return (
    <div className="mx-5 md:mx-12 my-6 rounded-2xl border border-white/[0.08] bg-surface/70 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
      <span className="w-12 h-12 shrink-0 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
        <Sparkles size={22} />
      </span>
      <div className="flex-1">
        <h2 className="font-semibold">No {kind} picks yet</h2>
        <p className="text-sm text-gray-400 mt-1">Watch a few {kind}, or pick some you love, and they'll show up here.</p>
      </div>
      <button onClick={onPick} className="btn-primary py-2.5 px-5 text-sm self-start sm:self-auto">
        <Heart size={15} /> Pick {kind} you love
      </button>
    </div>
  )
}

// --- Top picks: wide cards with the reason for each ---

function PickRow({ picks, isLoading }: { picks: Pick[]; isLoading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => {
    const el = scrollRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }
  if (!isLoading && !picks.length) return null

  const arrow = "hidden md:flex absolute top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card hover:bg-primary/30"
  return (
    <section className="py-5 md:py-6">
      <div className="flex items-center gap-3 px-5 md:px-12 mb-4">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">Top picks for you</h2>
      </div>
      <div className="relative group">
        <button onClick={() => scroll(-1)} className={`${arrow} left-3`} aria-label="Scroll top picks left">
          <ChevronLeft size={20} />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto px-5 md:px-12 pb-2 snap-x snap-mandatory scroll-px-5 md:scroll-px-12"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 sm:w-72 md:w-80">
                  <div className="aspect-video rounded-2xl skeleton" />
                  <div className="h-3 w-3/4 rounded skeleton mt-3" />
                </div>
              ))
            : picks.map((pick) => <PickCard key={keyOf(pick.item)} pick={pick} />)}
        </div>
        <button onClick={() => scroll(1)} className={`${arrow} right-3`} aria-label="Scroll top picks right">
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}

function PickCard({ pick }: { pick: Pick }) {
  const { item } = pick
  const title = titleOf(item)
  const image = item.backdrop_path ? `w780${item.backdrop_path}` : `w342${item.poster_path}`
  return (
    <Link to={detailPath(item)} className="group/card flex-shrink-0 w-64 sm:w-72 md:w-80 snap-start">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-2 shadow-card">
        <img
          src={`https://image.tmdb.org/t/p/${image}`}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {item.media_type === "tv" && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-[11px] font-semibold">TV</span>
        )}
        <div className="absolute left-3 right-3 bottom-2.5">
          <h3 className="text-sm md:text-base font-semibold truncate" title={title}>{title}</h3>
          <p className="text-[11px] text-gray-300 mt-0.5 flex items-center gap-2">
            {yearOf(item) && <span>{yearOf(item)}</span>}
            {(item.vote_average ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-gold">
                <Star size={10} fill="currentColor" /> {item.vote_average.toFixed(1)}
              </span>
            )}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 px-0.5 truncate group-hover/card:text-gray-300 transition-colors" title={reason(pick.because)}>
        {reason(pick.because)}
      </p>
    </Link>
  )
}

// --- Nothing to go on yet: the taste picker, on the page ---

function Welcome({ name }: { name: string }) {
  return (
    <div className="px-5 md:px-12 pt-8 md:pt-12 pb-6 max-w-7xl mx-auto">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-accent">
          <Sparkles size={12} /> Personal picks
        </span>
        <h1 className="section-heading text-3xl md:text-4xl mt-4 leading-tight">{name}, what do you love?</h1>
        <p className="text-sm md:text-base text-gray-400 mt-2 leading-relaxed">
          Pick at least 3 movies or shows you've enjoyed. We'll rank recommendations from them, and they get better
          the more you watch.
        </p>
      </div>
      <div className="mt-7">
        <TastePicker initial={[]} onDone={() => window.scrollTo({ top: 0 })} />
      </div>
    </div>
  )
}

// --- The taste picker, to fine-tune later ---

function PickerDialog({ startOn, onClose }: { startOn: Filter; onClose: () => void }) {
  const favourites = useFavourites()
  // Above the on-screen keyboard while searching, so the Save bar stays reachable
  const visible = useVisualViewport()

  // Lock page scroll and close on Escape while open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-black/70 flex md:items-center md:justify-center md:p-6"
      style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", ...visibleAreaStyle(visible) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Titles you love"
        className="w-full h-full md:h-[85vh] md:max-w-5xl md:rounded-3xl flex flex-col overflow-hidden shadow-card"
        style={{ background: "#0e0e18", border: "1px solid rgba(255,255,255,0.08)" }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 pt-5 pb-4 border-b border-white/[0.07]" style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}>
          <div>
            <h2 className="section-heading text-xl">Titles you love</h2>
            <p className="text-sm text-gray-400 mt-0.5">Tap to add or remove. These shape your picks along with what you watch.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full bg-white/[0.07] flex items-center justify-center text-gray-400 hover:text-white" aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 md:px-6 pt-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <TastePicker initial={favourites} startOn={startOn} inDialog onDone={onClose} />
        </div>
      </motion.div>
    </motion.div>
  )
}
