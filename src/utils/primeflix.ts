// src/utils/primeflix.ts
// Direct HLS streams for our own player. primeflix.ru lists its servers (Nova, Luna, …) with AES-GCM
// encrypted stream URLs; subtitles come from vdrk. Both use the same path: /movie/{id} or /tv/{id}/{s}/{e}.

export const PRIMEFLIX_API = "https://primeflix.ru/api"
export const SUBTITLES_API = "https://sub.vdrk.site/v2"

const KEY_HEX = "7f3e9c2a8b5d1f4e6a9c3b7d2e5f8a1c4b6d9e2f5a8c1b4d7e9f2a5c8b1d4e7f"

export type Subtitle = { label: string; file: string }

type SourceList = Record<string, { url: string; language: string; flag: string; type: string }>

const hexToBytes = (hex: string) => Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16))

function base64UrlToBytes(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

let keyPromise: Promise<CryptoKey> | null = null
const getKey = () =>
  (keyPromise ??= crypto.subtle.importKey("raw", hexToBytes(KEY_HEX), { name: "AES-GCM" }, false, ["decrypt"]))

// Payload: 12-byte IV, then ciphertext + 16-byte tag
async function decryptUrl(payload: string) {
  const data = base64UrlToBytes(payload)
  if (data.length < 28) throw new Error("Ciphertext too short")
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: data.slice(0, 12) }, await getKey(), data.slice(12))
  return new TextDecoder().decode(plain)
}

async function fetchSources(api: string, signal?: AbortSignal) {
  const res = await fetch(api, { signal })
  if (!res.ok) throw new Error(`Stream lookup failed (${res.status})`)
  return (await res.json()) as SourceList
}

const hasStream = (source?: SourceList[string]) => !!source?.url && source.type === "hls"

// Names of the servers that have an HLS stream for this title
export async function fetchAvailableServers(api: string, signal?: AbortSignal): Promise<Set<string>> {
  const sources = await fetchSources(api, signal)
  return new Set(Object.keys(sources).filter((name) => hasStream(sources[name])))
}

// The HLS URL `server` has for this title, or null if it doesn't have it
export async function fetchStreamUrl(api: string, server: string, signal?: AbortSignal): Promise<string | null> {
  const source = (await fetchSources(api, signal))[server]
  return hasStream(source) ? decryptUrl(source.url) : null
}

// Subtitles are a nice-to-have: any failure just means none
export async function fetchSubtitles(api: string, signal?: AbortSignal): Promise<Subtitle[]> {
  try {
    const res = await fetch(api, { signal })
    if (!res.ok) return []
    const list = await res.json()
    return Array.isArray(list) ? list.filter((s) => s?.label && s?.file) : []
  } catch {
    return []
  }
}
