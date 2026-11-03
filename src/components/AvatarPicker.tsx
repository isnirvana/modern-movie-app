// src/components/AvatarPicker.tsx
// Choosing a profile's avatar: a popular actor's or a well-known director's photo (TMDB), anyone found by
// search, or the colour-and-initial tile. Picks are saved as TMDB image paths (utils/profiles.ts).
import { useState, type ReactNode } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { Check, Search, X } from "lucide-react"
import ProfileAvatar from "./ProfileAvatar"
import { useDebounced } from "../hooks/useDebounced"
import { fetchPeople } from "../utils/api"
import type { Profile } from "../utils/profiles"

type Person = {
  id: number
  name: string
  profile_path: string
  adult?: boolean
  known_for_department?: string
  known_for?: { vote_count?: number }[]
}
type Tab = "actors" | "directors"

const DAY = 1000 * 60 * 60 * 24
// TMDB's popular people change weekly and include many little-known names: keep actors known for at least one
// widely watched title (this many votes)
const FAMOUS_VOTES = 3000

// Found by name (TMDB's popular people are nearly all actors); each is one small, long-cached search
const DIRECTORS = [
  "Christopher Nolan",
  "Steven Spielberg",
  "Greta Gerwig",
  "Denis Villeneuve",
  "Quentin Tarantino",
  "Martin Scorsese",
  "Hayao Miyazaki",
  "Bong Joon-ho",
  "Jordan Peele",
  "James Cameron",
  "Wes Anderson",
  "Guillermo del Toro",
  "Kathryn Bigelow",
  "Spike Lee",
  "Taika Waititi",
  "Sofia Coppola",
  "Ridley Scott",
  "David Fincher",
  "Peter Jackson",
  "Chloé Zhao",
]

// People with a photo, each once, no adult listings
function usable(list: (Person | null | undefined)[]) {
  const seen = new Set<number>()
  const out: Person[] = []
  for (const p of list) {
    if (!p || p.adult || !p.profile_path || seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  return out
}

type Props = {
  profile: Pick<Profile, "name" | "color" | "kids">
  value?: string
  onPick: (avatar: string | undefined) => void
}

export default function AvatarPicker({ profile, value, onPick }: Props) {
  const [tab, setTab] = useState<Tab>("actors")
  const [query, setQuery] = useState("")
  const search = useDebounced(query.trim(), 300)

  // A page at a time, each shown as it arrives
  const actors = useQueries({
    queries: [1, 2, 3, 4, 5].map((page) => ({
      queryKey: ["avatar-actors", page],
      queryFn: () =>
        fetchPeople("/person/popular", { page }).then((found: Person[]) =>
          found.filter((p) => p.known_for_department === "Acting" && (p.known_for ?? []).some((t) => (t.vote_count ?? 0) >= FAMOUS_VOTES))
        ),
      staleTime: DAY,
      enabled: tab === "actors" && !search,
    })),
  })
  const directors = useQueries({
    queries: DIRECTORS.map((name) => ({
      queryKey: ["avatar-director", name],
      queryFn: () =>
        fetchPeople("/search/person", { query: name }).then(
          (found: Person[]) => found.find((p) => p.known_for_department === "Directing") ?? found[0] ?? null
        ),
      staleTime: Infinity,
      enabled: tab === "directors" && !search,
    })),
  })
  const results = useQuery({
    queryKey: ["avatar-search", search],
    queryFn: () => fetchPeople("/search/person", { query: search }),
    enabled: !!search,
  })

  const people = usable(search ? results.data ?? [] : (tab === "actors" ? actors : directors).flatMap((q) => q.data ?? []))
  const loading = search ? results.isLoading : (tab === "actors" ? actors : directors).every((q) => q.isLoading)

  const tile = (selected: boolean, label: string, picture: ReactNode, onClick: () => void, key: string | number) => (
    <button key={key} type="button" onClick={onClick} className="group flex flex-col items-center gap-1.5 min-w-0" aria-pressed={selected} aria-label={label}>
      <span className="relative">
        <span
          className={`block rounded-[20px] ring-offset-2 ring-offset-[#16161f] transition ${
            selected ? "ring-[3px] ring-white" : "ring-0 group-hover:ring-2 group-hover:ring-white/50"
          }`}
        >
          {picture}
        </span>
        {selected && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-glow">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={`text-[11px] leading-tight w-full truncate text-center ${selected ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
        {label}
      </span>
    </button>
  )

  return (
    <div>
      <label className="relative block">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an actor or director"
          aria-label="Search people"
          className="search-input w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:border-primary/60"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Clear search">
            <X size={15} />
          </button>
        )}
      </label>

      {!search && (
        <div className="flex p-1 mt-3 rounded-xl bg-white/[0.06] border border-white/[0.08]" role="tablist">
          {(["actors", "directors"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-x-3 gap-y-4 mt-4 max-h-[46vh] overflow-y-auto -mx-1 px-1 pt-2 pb-1">
        {!search && tile(!value, "Initial", <ProfileAvatar profile={profile} size={68} />, () => onPick(undefined), "initial")}
        {loading
          ? Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-[68px] h-[68px] rounded-[20px] skeleton" />
                <div className="h-2.5 w-12 rounded skeleton" />
              </div>
            ))
          : people.map((p) =>
              tile(
                value === p.profile_path,
                p.name,
                <PersonPhoto path={p.profile_path} />,
                () => onPick(p.profile_path),
                p.id
              )
            )}
        {!loading && search && people.length === 0 && (
          <p className="col-span-full text-sm text-gray-500 text-center py-8">No one found for "{search}".</p>
        )}
      </div>
      <p className="text-[10px] text-gray-600 mt-3 text-center">Photos from TMDB</p>
    </div>
  )
}

// A person's photo in the grid: shimmering until it has loaded, then fading in
function PersonPhoto({ path }: { path: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span className="relative block w-[68px] h-[68px] rounded-[19px] overflow-hidden skeleton">
      <img
        src={`https://image.tmdb.org/t/p/w185${path}`}
        alt=""
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-[50%_18%] transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      <span className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }} />
    </span>
  )
}
