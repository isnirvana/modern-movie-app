// src/pages/PersonPage.tsx
// An actor's, director's or other filmmaker's page, opened from a cast member or a crew name on a title page:
// photo and facts over a backdrop from their best-known title, links (IMDb, Instagram…), biography,
// "Known for", and the filmography by department (Acting, Directing…) and kind (movies / shows), by year.
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Cake, ExternalLink, Facebook, Flower2, Globe, Instagram, MapPin, Twitter, Youtube } from "lucide-react"
import MediaRow from "../components/MediaRow"
import { RowSkeleton } from "../components/PageSkeletons"
import { Segmented, type Filter } from "../components/TastePicker"
import { usePerson } from "../hooks/usePerson"
import { formatDate } from "../utils/details"
import { ageOf, creditCounts, departments, filmography, knownFor, socialLinks, type Credit, type SocialLink } from "../utils/person"

// What to call someone by their main department
const ROLE_NAMES: Record<string, string> = {
  Acting: "Actor",
  Directing: "Director",
  Writing: "Writer",
  Production: "Producer",
  Sound: "Composer",
  Camera: "Cinematographer",
  Editing: "Editor",
  Creator: "Creator",
}
// Filmography rows shown before "Show all"
const FIRST_ROWS = 30
// Biographies longer than this start folded
const LONG_BIO = 600

const SOCIAL_ICONS: Record<SocialLink["kind"], typeof Globe> = {
  imdb: ExternalLink,
  instagram: Instagram,
  x: Twitter,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: ExternalLink,
  web: Globe,
}

export default function PersonPage() {
  const { id } = useParams()
  const { data: person, isLoading, isError } = usePerson(Number(id))

  if (isLoading) return <PersonSkeleton />
  if (isError || !person) return <NotFound />

  const known = knownFor(person)
  const backdrop = known.find((c) => c.backdrop_path)?.backdrop_path
  const age = ageOf(person.birthday, person.deathday)
  const counts = creditCounts(person)
  const links = socialLinks(person)

  return (
    <div className="pb-10">
      {/* ── Header: photo, name, facts, links ── */}
      <section className="relative -mt-14 pt-14 overflow-hidden">
        {backdrop && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${backdrop}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top opacity-35 scale-105 blur-[2px]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(108,99,255,0.18),transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-12 pt-8 md:pt-16 pb-8 md:pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          <Portrait person={person} />
          <div className="min-w-0 text-center md:text-left">
            {person.known_for_department && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-gray-200">
                {ROLE_NAMES[person.known_for_department] ?? person.known_for_department}
              </span>
            )}
            <h1 className="font-display font-extrabold tracking-tight text-4xl md:text-6xl leading-[1.05] mt-3">{person.name}</h1>

            <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 mt-4 text-sm text-gray-300">
              {person.birthday && (
                <span className="inline-flex items-center gap-1.5">
                  <Cake size={15} className="text-gray-500" />
                  {formatDate(person.birthday)}
                  {!person.deathday && age !== null && <span className="text-gray-500">· {age}</span>}
                </span>
              )}
              {person.deathday && (
                <span className="inline-flex items-center gap-1.5">
                  <Flower2 size={15} className="text-gray-500" />
                  Died {formatDate(person.deathday)}
                  {age !== null && <span className="text-gray-500">· aged {age}</span>}
                </span>
              )}
              {person.place_of_birth && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <MapPin size={15} className="text-gray-500 shrink-0" />
                  <span className="truncate">{person.place_of_birth}</span>
                </span>
              )}
            </div>

            {(counts.movies > 0 || counts.shows > 0) && (
              <p className="text-sm text-gray-500 mt-2">
                {[counts.movies && `${counts.movies} movie${counts.movies === 1 ? "" : "s"}`, counts.shows && `${counts.shows} show${counts.shows === 1 ? "" : "s"}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {links.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-5">
                {links.map((l) => {
                  const Icon = SOCIAL_ICONS[l.kind]
                  return (
                    <a
                      key={l.kind}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        l.kind === "imdb"
                          ? "bg-[#f5c518] text-black border-transparent hover:brightness-95"
                          : "bg-white/[0.06] border-white/10 text-gray-200 hover:bg-white/[0.12] hover:text-white"
                      }`}
                    >
                      {l.kind !== "imdb" && <Icon size={14} />}
                      {l.label}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Biography name={person.name} text={person.biography} />

      {known.length > 0 && <MediaRow title="Known for" items={known} />}

      <Filmography person={person} />
    </div>
  )
}

// Their photo, or their initial on a tile when TMDB has none
function Portrait({ person }: { person: any }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative w-40 md:w-64 shrink-0 aspect-[2/3] rounded-3xl overflow-hidden shadow-card ring-1 ring-white/10 bg-surface-2">
      {person.profile_path ? (
        <img
          src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
          alt={person.name}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-6xl text-white/30">
          {person.name?.charAt(0)}
        </span>
      )}
      {person.profile_path && !loaded && <div className="absolute inset-0 skeleton" />}
    </div>
  )
}

function Biography({ name, text }: { name: string; text?: string }) {
  const [open, setOpen] = useState(false)
  const bio = text?.trim()
  const long = (bio?.length ?? 0) > LONG_BIO

  return (
    <section className="max-w-6xl mx-auto px-5 md:px-12 py-4 md:py-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">Biography</h2>
      </div>
      {bio ? (
        <div className="max-w-3xl">
          <div className={`relative text-[15px] leading-relaxed text-gray-300 space-y-4 ${long && !open ? "max-h-44 overflow-hidden" : ""}`}>
            {bio.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {long && !open && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent" />}
          </div>
          {long && (
            <button onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-primary hover:underline">
              {open ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">There's no biography for {name} yet.</p>
      )}
    </section>
  )
}

// --- Filmography ---

function Filmography({ person }: { person: any }) {
  const tabs = departments(person)
  const main = tabs.find((t) => t.name === person.known_for_department)?.name ?? tabs[0]?.name
  const [dept, setDept] = useState(main)
  const [kind, setKind] = useState<Filter>("all")
  const [showAll, setShowAll] = useState(false)
  useEffect(() => setShowAll(false), [dept, kind])

  if (!tabs.length || !dept) return null

  const credits = filmography(person, dept).filter((c) => kind === "all" || c.type === kind)
  const shown = showAll ? credits : credits.slice(0, FIRST_ROWS)
  // Grouped by year, keeping the order (upcoming first, then newest)
  const groups: { label: string; credits: Credit[] }[] = []
  for (const c of shown) {
    const label = !c.released ? "Upcoming" : c.date?.slice(0, 4) || "Year unknown"
    const last = groups[groups.length - 1]
    if (last?.label === label) last.credits.push(c)
    else groups.push({ label, credits: [c] })
  }

  return (
    <section className="max-w-6xl mx-auto px-5 md:px-12 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">Filmography</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 pb-1" style={{ scrollbarWidth: "none" }}>
          {tabs.map((t) => (
            <button
              key={t.name}
              onClick={() => setDept(t.name)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                dept === t.name ? "bg-white text-gray-900" : "bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              {t.name}
              <span className="text-xs text-gray-500">{t.count}</span>
            </button>
          ))}
        </div>
        <Segmented value={kind} onChange={setKind} id="person-kind" />
      </div>

      {credits.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">Nothing here.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g) => (
            <div key={g.label} className="md:grid md:grid-cols-[88px_1fr] md:gap-6">
              <h3 className={`text-sm font-semibold mb-2 md:mb-0 md:pt-4 ${g.label === "Upcoming" ? "text-primary" : "text-gray-500"}`}>{g.label}</h3>
              <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-surface/50 overflow-hidden">
                {g.credits.map((c) => (
                  <li key={c.key}>
                    <CreditRow credit={c} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!showAll && credits.length > FIRST_ROWS && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setShowAll(true)} className="btn-secondary py-2.5 text-sm">
            Show all {credits.length}
          </button>
        </div>
      )}
    </section>
  )
}

function CreditRow({ credit: c }: { credit: Credit }) {
  const details = [c.roles.join(", "), c.type === "tv" && c.episodes > 0 ? `${c.episodes} episode${c.episodes === 1 ? "" : "s"}` : null]
    .filter(Boolean)
    .join(" · ")
  return (
    <Link to={`/${c.type}/${c.id}`} className="group flex items-center gap-4 px-3 md:px-4 py-3 hover:bg-white/[0.04] transition-colors">
      <span className="w-11 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-surface-2">
        {c.poster_path && (
          <img src={`https://image.tmdb.org/t/p/w92${c.poster_path}`} alt="" loading="lazy" className="w-full h-full object-cover" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-medium truncate group-hover:text-primary transition-colors">{c.title}</span>
          {c.type === "tv" && <span className="shrink-0 px-1.5 py-px rounded bg-white/10 text-[10px] font-semibold text-gray-300">TV</span>}
        </span>
        {details && <span className="block text-sm text-gray-400 truncate mt-0.5">{details}</span>}
      </span>
      {!c.released && c.date && <span className="shrink-0 text-xs text-gray-500">{formatDate(c.date, { day: "numeric", month: "short", year: "numeric" })}</span>}
    </Link>
  )
}

// --- Loading and missing ---

function PersonSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="max-w-6xl mx-auto px-5 md:px-12 pt-8 md:pt-16 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
        <div className="w-40 md:w-64 aspect-[2/3] rounded-3xl skeleton" />
        <div className="flex flex-col items-center md:items-start gap-3 w-full max-w-md">
          <div className="h-6 w-20 rounded-full skeleton" />
          <div className="h-12 md:h-16 w-4/5 rounded-xl skeleton" />
          <div className="h-4 w-3/5 rounded-md skeleton" />
          <div className="flex gap-2 mt-2">
            <div className="h-8 w-20 rounded-full skeleton" />
            <div className="h-8 w-28 rounded-full skeleton" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 md:px-12 space-y-2.5 py-4">
        {[100, 96, 98, 70].map((w, i) => (
          <div key={i} className="h-3.5 rounded-md skeleton max-w-3xl" style={{ width: `${w}%` }} />
        ))}
      </div>
      <RowSkeleton />
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5">
      <h1 className="section-heading text-2xl">We couldn't find this person</h1>
      <p className="text-sm text-gray-400 mt-2">Check your connection, or go back and try again.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-6 py-2.5 text-sm">
        <ArrowLeft size={16} /> Go back
      </button>
    </div>
  )
}
