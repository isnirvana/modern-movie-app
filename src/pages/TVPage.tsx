import { useTrendingTV } from "../hooks/useTrendingTV"
import ContentShelf from "../components/ContentShelf"
import LoadingSkeleton from "../components/LoadingSkeleton"

export default function TVPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTrendingTV()

  const shows = data?.pages.flatMap((p) => p.results) || []

  if (isLoading) return <LoadingSkeleton />

  return (
    <>
      <h1 className="text-3xl text-white mb-6">TV Shows</h1>
      <ContentShelf
        title="Trending TV"
        items={shows}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  )
}
