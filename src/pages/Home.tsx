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
import Top10Row from "../components/Top10Row"
import BecauseYouWatched from "../components/BecauseYouWatched"
import { useWatchHistory } from "../hooks/useWatchHistory"
import { useMyList } from "../hooks/useMyList"
import LoadingSkeleton from "../components/LoadingSkeleton"
import { useTrending } from "../hooks/useTrending"
import { useTmdbList } from "../hooks/useTmdbList"
import { todayISO } from "../utils/media"

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
  // Movies and shows coming out from today on, most anticipated first
  // (not /movie/upcoming: it goes by regional cinema dates, so most of it is already out by our measure)
  const upcomingMovies = useTmdbList(`/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayISO()}`, "movie", true)
  const upcomingTV = useTmdbList(`/discover/tv?sort_by=popularity.desc&first_air_date.gte=${todayISO()}`, "tv", true)
  const myList = useMyList()
  const topMovies = useTmdbList("/trending/movie/day", "movie")
  const topShows = useTmdbList("/trending/tv/day", "tv")
  // "Because you watched": the two most recently watched titles
  const [recent1, recent2] = useWatchHistory()

  // Coming Soon: movies and shows taking turns, each most anticipated first
  // (sorting by date would bury the movies under shows premiering today)
  const withPosters = (list: any[] = []) => list.filter((item) => item.poster_path)
  const movies = withPosters(upcomingMovies.data)
  const shows = withPosters(upcomingTV.data)
  const comingSoon = Array.from({ length: Math.max(movies.length, shows.length) }, (_, i) => [movies[i], shows[i]])
    .flat()
    .filter(Boolean)

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
        <Top10Row title="Top 10 Movies Today" items={topMovies.data ?? []} isLoading={topMovies.isLoading} />
        <MediaRow title="My List" items={myList.map((i) => ({ ...i, media_type: i.type }))} to="/my-list" />
        {recent1 && <BecauseYouWatched key={`${recent1.type}-${recent1.id}`} entry={recent1} />}
        <MediaRow title="Now Playing" items={nowPlaying.data ?? []} isLoading={nowPlaying.isLoading} />
        <MediaRow title="Popular Movies" items={popularMovies.data ?? []} isLoading={popularMovies.isLoading} to="/movies" />
        <Top10Row title="Top 10 Shows Today" items={topShows.data ?? []} isLoading={topShows.isLoading} />
        <MediaRow title="Popular TV Shows" items={popularTV.data ?? []} isLoading={popularTV.isLoading} to="/tv" />
        {recent2 && <BecauseYouWatched key={`${recent2.type}-${recent2.id}`} entry={recent2} />}
        <MediaRow title="Top Rated" items={topRated.data ?? []} isLoading={topRated.isLoading} />
        <MediaRow title="Coming Soon" items={comingSoon} isLoading={upcomingMovies.isLoading && upcomingTV.isLoading} />
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
