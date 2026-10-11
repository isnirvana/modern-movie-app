// src/pages/MoviesPage.tsx
import { useTrending } from "../hooks/useTrending"
import ContentShelf from "../components/ContentShelf"
import LoadingSkeleton from "../components/LoadingSkeleton"

export default function MoviesPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTrending()

  const movies = data?.pages.flatMap((p) => p.results) || []

  if (isLoading) return <LoadingSkeleton />

  return (
    <ContentShelf
      title="Movies & Shows"
      items={movies}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  )
}
