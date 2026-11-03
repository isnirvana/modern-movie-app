// src/pages/TVPage.tsx
import { useTrendingTV } from "../hooks/useTrendingTV"
import ContentShelf from "../components/ContentShelf"
import LoadingSkeleton from "../components/LoadingSkeleton"
import { isKidsMode } from "../utils/profiles"

export default function TVPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTrendingTV()

  const shows = data?.pages.flatMap((p) => p.results) || []

  if (isLoading) return <LoadingSkeleton />

  return (
    <ContentShelf
      title={isKidsMode() ? "Popular Kids Shows" : "Trending TV Shows"}
      items={shows}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  )
}
