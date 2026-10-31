// src/utils/servers.ts
// Streaming servers, in the order they appear in the player. The first one is the default.

export type PlayerEvent = {
  event: "play" | "pause" | "timeupdate" | "seeked" | "ended"
  currentTime: number // NaN when the server didn't say
  duration: number // NaN when the server didn't say
}

export type Server = {
  name: string
  src: string
  // Blocks pop-ups and redirects; set to false for a server that refuses to play sandboxed
  sandbox?: boolean
  // Progress messages this server sends (powers Continue Watching, Resume and Up Next)
  events?: {
    origin: string
    // Turns one of the server's messages into a PlayerEvent, or null to ignore it
    parse: (data: any) => PlayerEvent | null
  }
}

// The server Resume opens on: it accepts a start time (Cinezo can't start mid-way)
export const RESUME_SERVER = "CineSrc"

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
  ]
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
  ]
  if (imdbId) servers.push({ name: "VidFast", src: `https://vidfast.vc/tv/${imdbId}/${season}/${episode}?nextButton=false`, sandbox: true })
  return servers
}
