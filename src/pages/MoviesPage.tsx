// src/pages/MoviesPage.tsx
import { useTrending } from "../hooks/useTrending"
import ContentShelf from "../components/ContentShelf"
import LoadingSkeleton from "../components/LoadingSkeleton"
import { isKidsMode } from "../utils/profiles"

export default function MoviesPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTrending("movie")

  const movies = data?.pages.flatMap((p) => p.results) || []

  if (isLoading) return <LoadingSkeleton />

  return (
    <ContentShelf
      title={isKidsMode() ? "Popular Kids Movies" : "Trending Movies"}
      items={movies}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  )
}
