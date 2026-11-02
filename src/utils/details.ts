// src/utils/details.ts
// Turns TMDB detail responses into the facts shown in the header and the Details section

import { formatReleaseDate, isReleased, todayISO } from "./media"

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

// Only recent movies get the cinema check: older ones often have no digital date listed at all
const THEATRICAL_WINDOW_DAYS = 120

// Out in cinemas but not yet digitally: { digital } is the first digital release still ahead, if TMDB lists one.
// null when it isn't in that window (not out yet, already out digitally, or not a cinema release).
export function inTheatersOnly(m: any): { digital?: string } | null {
  const today = todayISO()
  const cutoff = new Date(Date.now() - THEATRICAL_WINDOW_DAYS * 86400000).toLocaleDateString("en-CA")
  if (!m?.release_date || m.release_date > today || m.release_date < cutoff) return null

  // TMDB release types: 2 limited theatrical, 3 theatrical, 4 digital
  const dates: { type: number; date: string }[] = (m.release_dates?.results ?? []).flatMap((c: any) =>
    (c.release_dates ?? []).map((d: any) => ({ type: d.type, date: String(d.release_date ?? "").slice(0, 10) })),
  )
  if (!dates.some((d) => (d.type === 2 || d.type === 3) && d.date && d.date <= today)) return null
  const digital = dates.filter((d) => d.type === 4 && d.date).map((d) => d.date).sort()
  if (digital.some((d) => d <= today)) return null
  return { digital: digital[0] }
}

// What's next for a running show: "Season 3 premieres 14 Dec 2026" or "Next episode 14 Nov 2026 · S2 E5".
// null when nothing is scheduled (or the show itself hasn't premiered — that's "Coming soon" instead).
export function nextEpisodeLabel(tv: any): string | null {
  const next = tv?.next_episode_to_air
  if (!next?.air_date || next.air_date < todayISO() || !isReleased(tv)) return null
  const date = formatReleaseDate(next.air_date)
  return next.episode_number === 1
    ? `Season ${next.season_number} premieres ${date}`
    : `Next episode ${date} · S${next.season_number} E${next.episode_number}`
}
