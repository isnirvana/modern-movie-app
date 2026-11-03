// src/components/BecauseYouWatched.tsx
// Home row of recommendations for a title the viewer watched (from TMDB, released titles only).
// Leaves out titles they already started.
import MediaRow from "./MediaRow"
import { useTmdbList } from "../hooks/useTmdbList"
import { withoutExcluded, type Seed } from "../utils/recommend"

export default function BecauseYouWatched({ seed, exclude }: { seed: Seed; exclude: Set<string> }) {
  const { data = [], isLoading } = useTmdbList(`/${seed.type}/${seed.id}/recommendations`, seed.type)
  return (
    <MediaRow kicker="Because you watched" title={seed.title} items={withoutExcluded(data, exclude)} isLoading={isLoading} />
  )
}
