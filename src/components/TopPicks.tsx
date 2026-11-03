// src/components/TopPicks.tsx
// "Top picks for you" row. Needs at least two watched titles (with one, "Because you watched" already covers it).
import MediaRow from "./MediaRow"
import { useTopPicks } from "../hooks/useTopPicks"

export default function TopPicks() {
  const { items, isLoading, seeds } = useTopPicks()
  if (seeds.length < 2) return null
  return <MediaRow title="Top picks for you" items={items} isLoading={isLoading} to="/for-you" />
}
