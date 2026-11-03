// src/utils/recommend.ts
// Picks what the "Because you watched" Home rows are based on, using watch history

import type { HistoryEntry } from "./watchHistory"

export type Seed = Pick<HistoryEntry, "type" | "id" | "title">

const key = (t: { media_type?: string; type?: string; id: number }) => `${t.type ?? t.media_type}-${t.id}`

// The most recently watched titles (history is newest first)
export const pickSeeds = (history: HistoryEntry[], count = 2): Seed[] =>
  history.slice(0, count).map(({ type, id, title }) => ({ type, id, title }))

// Titles not worth recommending: already in Continue Watching
export const excludedKeys = (history: HistoryEntry[]) => new Set(history.map(key))

export const withoutExcluded = (items: any[], exclude: Set<string>) =>
  items.filter((item) => item.poster_path && !exclude.has(key(item)))
