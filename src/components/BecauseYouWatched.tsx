// src/components/BecauseYouWatched.tsx
// Home row of recommendations for a title the viewer watched (from TMDB, released titles only)
import MediaRow from "./MediaRow"
import { useTmdbList } from "../hooks/useTmdbList"
import type { HistoryEntry } from "../utils/watchHistory"

export default function BecauseYouWatched({ entry }: { entry: HistoryEntry }) {
  const { data = [], isLoading } = useTmdbList(`/${entry.type}/${entry.id}/recommendations`, entry.type)
  const items = data.filter((item: any) => item.poster_path)
  return <MediaRow title={`Because you watched ${entry.title}`} items={items} isLoading={isLoading} />
}
