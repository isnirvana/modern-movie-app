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
import LoadingSkeleton from "../components/LoadingSkeleton"
import { useTrending } from "../hooks/useTrending"

export default function Home() {
  // ←—— Add your React Query hook here
  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isFetchingNextPage = false,
  } = useTrending()

  // ←—— Flatten pages into a single array
  const movies = data?.pages.flatMap((page) => page.results) || []

  if (!data) {
    // still loading first page
    return <LoadingSkeleton />
  }

  return (
    <>
      {/* Optional: show HeroCarousel of first 5 */}
      <HeroCarousel items={movies.slice(0, 5)} />

      {/* Infinite‐load shelf */}
      <ContentShelf
        title="Trending Now"
        items={movies}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  )
}
