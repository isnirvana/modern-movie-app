// src/utils/details.ts
// Turns TMDB detail responses into the facts shown in the header and the Details section

export type DetailRow = { label: string; value: string }
export type Company = { id: number; name: string; logo_path?: string | null }
export type StatusTone = "good" | "neutral" | "bad"

const PREFERRED_COUNTRY = "US"

// Age rating, e.g. "PG-13". Prefers the US theatrical rating, then any US rating, then any country's.
export function movieCertification(m: any): string | null {
  const countries: any[] = m?.release_dates?.results ?? []
  const pick = (c: any) => {
    const dates: any[] = (c?.release_dates ?? []).filter((d: any) => d.certification)
    return (dates.find((d) => d.type === 3) ?? dates[0])?.certification ?? null
  }
  const us = pick(countries.find((c) => c.iso_3166_1 === PREFERRED_COUNTRY))
  if (us) return us
  for (const c of countries) {
    const cert = pick(c)
    if (cert) return cert
  }
  return null
}

// Age rating for a show, e.g. "TV-MA"
export function tvCertification(tv: any): string | null {
  const ratings: any[] = (tv?.content_ratings?.results ?? []).filter((r: any) => r.rating)
  return (ratings.find((r) => r.iso_3166_1 === PREFERRED_COUNTRY) ?? ratings[0])?.rating ?? null
}

// "ko" → "Korean"
export function languageName(code?: string): string | null {
  if (!code) return null
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code
  } catch {
    return code
  }
}

// 190000000 → "$190M", 711800000 → "$711.8M", 1200000000 → "$1.2B"
export function formatMoney(n?: number): string | null {
  if (!n || n <= 0) return null
  const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]]
  for (const [size, suffix] of units) {
    if (n >= size) return `$${+(n / size).toFixed(1)}${suffix}`
  }
  return `$${n}`
}

// 166 → "2h 46m", 45 → "45m"
export function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`
}

export const formatDate = (date?: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  date ? new Date(date).toLocaleDateString("en-GB", opts) : null

const joinNames = (people: any[], max = 4) =>
  [...new Set(people.map((p) => p.name))].slice(0, max).join(", ") || null

export function tvStatus(status?: string): { label: string; tone: StatusTone } | null {
  if (!status) return null
  if (status === "Returning Series") return { label: "Returning Series", tone: "good" }
  if (status === "Canceled") return { label: "Canceled", tone: "bad" }
  if (status === "Ended") return { label: "Ended", tone: "neutral" }
  return { label: status, tone: "neutral" } // In Production, Planned, Pilot
}

const rows = (list: [string, string | null | undefined][]): DetailRow[] =>
  list.filter((r): r is [string, string] => !!r[1]).map(([label, value]) => ({ label, value }))

export function movieDetails(m: any): { rows: DetailRow[]; companies: Company[] } {
  const crew: any[] = m?.credits?.crew ?? []
  const directors = crew.filter((c) => c.job === "Director")
  const writers = crew.filter((c) => c.department === "Writing")
  return {
    rows: rows([
      [directors.length > 1 ? "Directors" : "Directed by", joinNames(directors)],
      ["Written by", joinNames(writers)],
      ["Released", formatDate(m?.release_date)],
      ["Runtime", formatRuntime(m?.runtime)],
      ["Language", languageName(m?.original_language)],
      ["Budget", formatMoney(m?.budget)],
      ["Box office", formatMoney(m?.revenue)],
    ]),
    companies: (m?.production_companies ?? []).slice(0, 6),
  }
}

// "S3 E5 · Fri, 14 Nov 2025"
const episodeLine = (ep: any) =>
  ep
    ? `S${ep.season_number} E${ep.episode_number}${ep.air_date ? ` · ${formatDate(ep.air_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}` : ""}`
    : null

export function tvDetails(tv: any): { rows: DetailRow[]; companies: Company[] } {
  const seasons = tv?.number_of_seasons
  const episodes = tv?.number_of_episodes
  const runtimes: number[] = tv?.episode_run_time ?? []
  // TMDB often leaves episode_run_time empty; fall back to the latest episode's own runtime
  const avgRuntime = runtimes.length
    ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length)
    : tv?.last_episode_to_air?.runtime ?? null
  return {
    rows: rows([
      ["Created by", joinNames(tv?.created_by ?? [])],
      ["Status", tvStatus(tv?.status)?.label],
      ["Next episode", episodeLine(tv?.next_episode_to_air)],
      ["Last aired", tv?.next_episode_to_air ? null : episodeLine(tv?.last_episode_to_air)],
      ["First aired", formatDate(tv?.first_air_date)],
      [
        "Seasons",
        seasons ? `${seasons} Season${seasons > 1 ? "s" : ""}${episodes ? ` · ${episodes} Episodes` : ""}` : null,
      ],
      ["Episode length", avgRuntime ? `~${formatRuntime(avgRuntime)}` : null],
      ["Language", languageName(tv?.original_language)],
    ]),
    companies: (tv?.networks?.length ? tv.networks : tv?.production_companies ?? []).slice(0, 6),
  }
}
