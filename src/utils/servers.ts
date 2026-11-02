// src/utils/servers.ts
// Streaming servers, in the order they appear in the player. The first one is the default.
// Cinezo leads because it reports progress reliably; `stream` servers only show up for titles they have.

import { PRIMEFLIX_API, SUBTITLES_API } from "./primeflix"

export type PlayerEvent = {
  event: "play" | "pause" | "timeupdate" | "seeked" | "ended"
  currentTime: number // NaN when the server didn't say
  duration: number // NaN when the server didn't say
}

export type Server = {
  name: string
  // Embed page URL, or for a `stream` server the API its stream is looked up from
  src: string
  // Blocks pop-ups and redirects; set to false for a server that refuses to play sandboxed
  sandbox?: boolean
  // Progress messages this server sends (powers Continue Watching, Resume and Up Next)
  events?: {
    origin: string
    // Turns one of the server's messages into a PlayerEvent, or null to ignore it
    parse: (data: any) => PlayerEvent | null
  }
  // Played in our own player instead of an iframe; `name` is the server's key in the API's response
  stream?: {
    subtitles: string
    startAt: number
  }
}

// The server Resume opens on: it accepts a start time (Cinezo can't start mid-way)
export const RESUME_SERVER = "CineSrc"
// Servers that can start mid-way
const RESUMABLE = ["CineSrc", "Nova"]

// The server the viewer last picked, kept in this browser so the player opens on it next time
const PREFERRED_KEY = "lumo:server"

export function getPreferredServer(): string | null {
  try {
    return localStorage.getItem(PREFERRED_KEY)
  } catch {
    return null
  }
}

export function setPreferredServer(name: string) {
  try {
    localStorage.setItem(PREFERRED_KEY, name)
  } catch {
    // Storage blocked — just don't remember it
  }
}

// Servers to open on, in order (the first one the title has wins, else the default):
// the viewer's pick, but resumes need one that can start mid-way
export function openingServers(startAt: number): string[] {
  const preferred = getPreferredServer()
  if (startAt <= 0) return preferred ? [preferred] : []
  return preferred && RESUMABLE.includes(preferred) ? [preferred, RESUME_SERVER] : [RESUME_SERVER]
}

// primeflix servers that play directly. Luna and Orion's hosts refuse other sites; they play in primeflix's own player instead (our "Luna" server).
const STREAM_SERVERS = ["Nova"]

const streamServers = (path: string, startAt: number): Server[] =>
  STREAM_SERVERS.map((name) => ({
    name,
    src: `${PRIMEFLIX_API}${path}`,
    stream: { subtitles: `${SUBTITLES_API}${path}`, startAt },
  }))

// Cinezo: { type: "PLAYER_EVENT", data: { event, currentTime, duration, … } }
// (its docs call it WATCH_PROGRESS with `eventType`, so accept that too)
const CINEZO_EVENTS: Server["events"] = {
  origin: "https://player.cinezo.live",
  parse: (msg) => {
    if (msg?.type !== "PLAYER_EVENT" && msg?.type !== "WATCH_PROGRESS") return null
    const d = msg.data ?? {}
    return { event: d.event ?? d.eventType, currentTime: Number(d.currentTime), duration: Number(d.duration) }
  },
}

// CineSrc: flat messages, { type: "cinesrc:timeupdate", currentTime, duration }
const CINESRC_TYPES: Record<string, PlayerEvent["event"]> = {
  "cinesrc:timeupdate": "timeupdate",
  "cinesrc:seeked": "seeked",
  "cinesrc:ended": "ended",
}
const CINESRC_EVENTS: Server["events"] = {
  origin: "https://cinesrc.st",
  parse: (msg) => {
    const event = CINESRC_TYPES[msg?.type]
    if (!event) return null
    return { event, currentTime: Number(msg.currentTime), duration: Number(msg.duration) }
  },
}

// Cinezo: our purple/pink, autoplay (the viewer just pressed Play)
const CINEZO_PARAMS = "?primarycolor=6c63ff&secondarycolor=f72585&autoplay=true"

// CineSrc: our purple ("#" encoded); when resuming, jump straight to `startAt` without its Continue/Restart prompt
const cinesrcParams = (startAt = 0) =>
  `color=%236c63ff${startAt > 0 ? `&t=${startAt}&continueprompt=false` : ""}`

export function movieServers(tmdbId: number, imdbId?: string | null, startAt = 0): Server[] {
  const servers: Server[] = [
    { name: "Cinezo", src: `https://player.cinezo.live/embed/movie/${tmdbId}${CINEZO_PARAMS}`, sandbox: true, events: CINEZO_EVENTS },
    { name: "CineSrc", src: `https://cinesrc.st/embed/movie/${tmdbId}?${cinesrcParams(startAt)}`, sandbox: true, events: CINESRC_EVENTS },
    ...streamServers(`/movie/${tmdbId}`, startAt),
  ]
  servers.push({ name: "Luna", src: `https://primeflix.ru/player/movie/${tmdbId}`, sandbox: true })
  if (imdbId) servers.push({ name: "CDNM", src: `https://share.cdnm.ink/embed/imdb/${imdbId}`, sandbox: true })
  return servers
}

export function tvServers(tmdbId: number, season: number, episode: number, imdbId?: string | null, startAt = 0): Server[] {
  const servers: Server[] = [
    {
      name: "Cinezo",
      src: `https://player.cinezo.live/embed/tv/${tmdbId}/${season}/${episode}${CINEZO_PARAMS}`,
      sandbox: true,
      events: CINEZO_EVENTS,
    },
    // CineSrc's own auto-next is off: our Up Next card handles that and keeps the page in sync
    {
      name: "CineSrc",
      src: `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}&autonext=false&${cinesrcParams(startAt)}`,
      sandbox: true,
      events: CINESRC_EVENTS,
    },
    ...streamServers(`/tv/${tmdbId}/${season}/${episode}`, startAt),
  ]
  servers.push({ name: "Luna", src: `https://primeflix.ru/player/tv/${tmdbId}/${season}/${episode}`, sandbox: true })
  if (imdbId) servers.push({ name: "VidFast", src: `https://vidfast.vc/tv/${imdbId}/${season}/${episode}?nextButton=false`, sandbox: true })
  return servers
}
