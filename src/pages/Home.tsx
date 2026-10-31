// import { useTrending } from '../hooks/useTrending';
// import MovieCard from '../components/MovieCard';
// import LoadingSkeleton from '../components/LoadingSkeleton';
// import { useRef } from 'react';

// export default function Home() {
//   const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = useTrending();
//   const loadMoreRef = useRef<HTMLButtonElement>(null);

//   if (isLoading) return <LoadingSkeleton />;

//   return (
//     <>
//       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
//         {data.pages.flatMap(p =>
//           p.results.map(m => <MovieCard key={m.id} movie={m} />)
//         )}
//       </div>
//       {hasNextPage && (
//         <button
//           ref={loadMoreRef}
//           onClick={() => fetchNextPage()}
//           disabled={isFetching}
//           className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
//         >
//           {isFetching ? 'Loading...' : 'Load More'}
//         </button>
//       )}
//     </>
//   );
// }

// src/pages/Home.tsx
import HeroCarousel from "../components/HeroCarousel"
import ContentShelf from "../components/ContentShelf"
import MediaRow from "../components/MediaRow"
import ContinueWatching from "../components/ContinueWatching"
import { useMyList } from "../hooks/useMyList"
import LoadingSkeleton from "../components/LoadingSkeleton"
import { useTrending } from "../hooks/useTrending"
import { useTmdbList } from "../hooks/useTmdbList"

export default function Home() {
  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isFetchingNextPage = false,
  } = useTrending()

  const popularMovies = useTmdbList("/movie/popular", "movie")
  const popularTV = useTmdbList("/tv/popular", "tv")
  const topRated = useTmdbList("/movie/top_rated", "movie")
  const nowPlaying = useTmdbList("/movie/now_playing", "movie")
  const myList = useMyList()

  // Flatten pages into a single array
  const items = data?.pages.flatMap((page) => page.results) || []

  if (!data) {
    // still loading first page
    return <LoadingSkeleton />
  }

  return (
    <>
      <HeroCarousel items={items.slice(0, 6)} />

      <div className="md:-mt-6 relative z-10">
        <ContinueWatching />
        <MediaRow title="My List" items={myList.map((i) => ({ ...i, media_type: i.type }))} to="/my-list" />
        <MediaRow title="Now Playing" items={nowPlaying.data ?? []} isLoading={nowPlaying.isLoading} />
        <MediaRow title="Popular Movies" items={popularMovies.data ?? []} isLoading={popularMovies.isLoading} to="/movies" />
        <MediaRow title="Popular TV Shows" items={popularTV.data ?? []} isLoading={popularTV.isLoading} to="/tv" />
        <MediaRow title="Top Rated" items={topRated.data ?? []} isLoading={topRated.isLoading} />
      </div>

      {/* Infinite-load grid */}
      <ContentShelf
        title="Trending Now"
        items={items}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  )
}
