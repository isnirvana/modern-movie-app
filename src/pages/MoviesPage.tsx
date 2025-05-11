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
    <>
      <h1 className="text-3xl text-white mb-6">All Movies</h1>
      <ContentShelf
        title="All Movies"
        items={movies}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  )
}
