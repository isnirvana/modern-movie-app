// src/utils/servers.ts
// Streaming servers, in the order they appear in the player. The first one is the default.

export type Server = {
  name: string
  src: string
  // Blocks pop-ups and redirects; set to false for a server that refuses to play sandboxed
  sandbox?: boolean
}

const CINESRC_COLOR = "%236c63ff" // theme primary, "#" encoded

export function movieServers(tmdbId: number, imdbId?: string | null): Server[] {
  const servers: Server[] = [
    { name: "Cinezo", src: `https://player.cinezo.live/embed/movie/${tmdbId}`, sandbox: true },
    { name: "CineSrc", src: `https://cinesrc.st/embed/movie/${tmdbId}?color=${CINESRC_COLOR}`, sandbox: true },
  ]
  if (imdbId) servers.push({ name: "CDNM", src: `https://share.cdnm.ink/embed/imdb/${imdbId}`, sandbox: true })
  return servers
}

export function tvServers(tmdbId: number, season: number, episode: number, imdbId?: string | null): Server[] {
  const servers: Server[] = [
    { name: "Cinezo", src: `https://player.cinezo.live/embed/tv/${tmdbId}/${season}/${episode}`, sandbox: true },
    { name: "CineSrc", src: `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}&color=${CINESRC_COLOR}`, sandbox: true },
  ]
  if (imdbId) servers.push({ name: "VidFast", src: `https://vidfast.vc/tv/${imdbId}/${season}/${episode}?nextButton=false`, sandbox: true })
  return servers
}
