// src/pages/KidsHome.tsx
// Home for Kids profiles: rows built only from kid-rated browsing (TMDB discover; utils/kids.ts adds the rating
// limits to every discover request), plus the profile's own Continue Watching, My List and recommendations
import HeroCarousel from "../components/HeroCarousel"
import MediaRow from "../components/MediaRow"
import ContinueWatching from "../components/ContinueWatching"
import BecauseYouWatched from "../components/BecauseYouWatched"
import LoadingSkeleton from "../components/LoadingSkeleton"
import { useTmdbList } from "../hooks/useTmdbList"
import { useMyList } from "../hooks/useMyList"
import { usePersonalRows } from "../hooks/usePersonalRows"

const POPULAR = "sort_by=popularity.desc"
const BEST = "sort_by=vote_average.desc&vote_count.gte=1000"

export default function KidsHome() {
  const familyMovies = useTmdbList(`/discover/movie?${POPULAR}&with_genres=10751`, "movie")
  const animatedMovies = useTmdbList(`/discover/movie?${POPULAR}&with_genres=16`, "movie")
  const kidsTV = useTmdbList(`/discover/tv?${POPULAR}&with_genres=10762`, "tv")
  const animatedTV = useTmdbList(`/discover/tv?${POPULAR}&with_genres=16`, "tv")
  const bestMovies = useTmdbList(`/discover/movie?${BEST}`, "movie")
  const myList = useMyList()
  const { seeds: [seed1, seed2], exclude } = usePersonalRows()

  if (!familyMovies.data) return <LoadingSkeleton />

  return (
    <>
      <HeroCarousel items={familyMovies.data.slice(0, 6)} />

      <div className="md:-mt-6 relative z-10">
        <ContinueWatching />
        <MediaRow title="Kids TV" items={kidsTV.data ?? []} isLoading={kidsTV.isLoading} />
        <MediaRow title="My List" items={myList.map((i) => ({ ...i, media_type: i.type }))} to="/my-list" />
        {seed1 && <BecauseYouWatched key={`${seed1.type}-${seed1.id}`} seed={seed1} exclude={exclude} />}
        <MediaRow title="Family Movies" items={familyMovies.data.slice(6)} />
        <MediaRow title="Animated Movies" items={animatedMovies.data ?? []} isLoading={animatedMovies.isLoading} />
        <MediaRow title="Cartoons" items={animatedTV.data ?? []} isLoading={animatedTV.isLoading} />
        {seed2 && <BecauseYouWatched key={`${seed2.type}-${seed2.id}`} seed={seed2} exclude={exclude} />}
        <MediaRow title="Family Favorites" items={bestMovies.data ?? []} isLoading={bestMovies.isLoading} />
      </div>
    </>
  )
}
