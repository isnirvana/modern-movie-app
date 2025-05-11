// // src/pages/TVDetails.tsx
// import { useParams } from "react-router-dom"
// import { useTVDetails } from "../hooks/useTVDetails"
// import { useSeasonDetails } from "../hooks/useSeasonDetails"
// import CastCarousel from "../components/CastCarousel"
// import { useState } from "react"
// import { motion, AnimatePresence } from "framer-motion"

// export default function TVDetails() {
//   const { id } = useParams<{ id: string }>()
//   const tvId = Number(id)
//   const { data: tv, isLoading, error } = useTVDetails(tvId)
//   const [watching, setWatching] = useState(false)

//   // Season & episode selection
//   const seasons = tv?.seasons || []
//   const [seasonNumber, setSeasonNumber] = useState<number>(
//     seasons[0]?.season_number || 1
//   )
//   const { data: seasonData, isLoading: loadingSeason } = useSeasonDetails(
//     tvId,
//     seasonNumber
//   )
//   const episodes = seasonData?.episodes || []
//   const [episodeNumber, setEpisodeNumber] = useState<number>(
//     episodes[0]?.episode_number || 1
//   )

//   if (isLoading) return <p className="p-6 text-white">Loading TV details…</p>
//   if (error) return <p className="p-6 text-red-400">Failed to load show.</p>

//   const {
//     name,
//     overview,
//     poster_path,
//     backdrop_path,
//     first_air_date,
//     vote_average,
//     credits,
//   } = tv

//   return (
//     <div className="text-white">
//       {/* Backdrop */}
//       <div
//         className="h-96 bg-cover bg-center rounded"
//         style={{
//           backgroundImage: `url(https://image.tmdb.org/t/p/original${backdrop_path})`,
//         }}
//       />

//       {/* Show Info */}
//       <div className="mt-4 flex flex-col md:flex-row">
//         <img
//           src={`https://image.tmdb.org/t/p/w342${poster_path}`}
//           alt={name}
//           className="rounded"
//         />
//         <div className="md:ml-6 flex-1">
//           <h1 className="text-3xl font-bold">{name}</h1>
//           <p>
//             First Aired: {first_air_date} • ⭐ {vote_average.toFixed(1)}
//           </p>
//           <p className="mt-4">{overview}</p>

//           {/* Season & Episode Selectors */}
//           <div className="mt-4 flex flex-wrap gap-4">
//             <div>
//               <label className="block text-sm mb-1">Season</label>
//               <select
//                 value={seasonNumber}
//                 onChange={(e) => {
//                   const sn = Number(e.target.value)
//                   setSeasonNumber(sn)
//                   setEpisodeNumber(1)
//                 }}
//                 className="bg-gray-800 text-white p-2 rounded"
//               >
//                 {seasons.map((s) => (
//                   <option key={s.season_number} value={s.season_number}>
//                     {s.name || `Season ${s.season_number}`}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Episode</label>
//               <select
//                 value={episodeNumber}
//                 onChange={(e) => setEpisodeNumber(Number(e.target.value))}
//                 className="bg-gray-800 text-white p-2 rounded"
//                 disabled={loadingSeason}
//               >
//                 {episodes.map((ep) => (
//                   <option key={ep.episode_number} value={ep.episode_number}>
//                     {ep.episode_number}. {ep.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Watch Now */}
//           <button
//             onClick={() => setWatching(true)}
//             className="mt-4 px-4 py-2 bg-primary rounded hover:bg-primary/80 transition"
//           >
//             Watch Season {seasonNumber} Episode {episodeNumber}
//           </button>
//         </div>
//       </div>

//       {/* Cast */}
//       <h2 className="text-2xl mt-8">Cast</h2>
//       <CastCarousel cast={credits.cast} />

//       {/* Watch Modal */}
//       <AnimatePresence>
//         {watching && (
//           <motion.div
//             className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <iframe
//               //   src={`https://hnembed.cc/embed/tv/${tvId}/${seasonNumber}/${episodeNumber}`}
//               src={` https://multiembed.mov/?video_id=${tvId}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`}
//               //   src={`https://www.2embed.cc/embedtv/${tvId}&s=${seasonNumber}&e=${episodeNumber}`}
//               allowFullScreen
//               className="w-full h-full"
//             />
//             <button
//               onClick={() => setWatching(false)}
//               className="absolute top-4 right-4 text-white text-2xl"
//             >
//               ×
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }

// src/pages/TVDetails.tsx
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useTVDetails } from "../hooks/useTVDetails"
import { useSeasonDetails } from "../hooks/useSeasonDetails"
import CastCarousel from "../components/CastCarousel"
import { motion, AnimatePresence } from "framer-motion"

export default function TVDetails() {
  const { id } = useParams<{ id: string }>()
  const tvId = Number(id)
  const { data: tv, isLoading } = useTVDetails(tvId)
  const [season, setSeason] = useState(1)
  const { data: seasonData } = useSeasonDetails(tvId, season)
  const episodes = seasonData?.episodes || []
  const [episode, setEpisode] = useState(episodes[0]?.episode_number || 1)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    setEpisode(episodes[0]?.episode_number || 1)
  }, [season, episodes])

  if (isLoading || !tv) return <p className="p-6 text-white">Loading…</p>

  return (
    <div className="text-white">
      {/* Hero: 85vh */}
      <div
        className="relative h-[85vh] bg-cover bg-center"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute bottom-20 left-10 max-w-2xl space-y-10">
          <h1 className="text-5xl font-extrabold">{tv.name}</h1>
          <p className="text-sm max-w-lg line-clamp-3">{tv.overview}</p>

          {/* Season & Episode */}
          <div className="flex space-x-4">
            <div>
              <label className="block text-white mb-1">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-gray-800 text-white p-2 rounded"
              >
                {tv.seasons.map((s) => (
                  <option key={s.season_number} value={s.season_number}>
                    {s.name || `Season ${s.season_number}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white mb-1">Episode</label>
              <select
                value={episode}
                onChange={(e) => setEpisode(Number(e.target.value))}
                className="bg-gray-800 text-white p-2 rounded"
                disabled={!seasonData}
              >
                {episodes.map((ep) => (
                  <option key={ep.episode_number} value={ep.episode_number}>
                    {ep.episode_number}. {ep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setWatching(true)}
            className="mt-4 flex items-center px-6 py-3 bg-white text-black rounded-lg hover:brightness-110 transition"
          >
            ▶ Play Episode
          </button>
        </div>
      </div>

      {/* Cast */}
      <div className="mt-8 px-6">
        <h2 className="text-2xl font-semibold mb-4">Cast</h2>
        <CastCarousel cast={tv.credits.cast} />
      </div>

      {/* 2Embed Modal for TV */}
      <AnimatePresence>
        {watching && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <iframe
              src={` https://multiembed.mov/?video_id=${tvId}&tmdb=1&s=${season}&e=${episode}`}
              allowFullScreen
              className="w-full h-full"
            />
            <button
              onClick={() => setWatching(false)}
              className="absolute top-4 right-4 text-white text-3xl"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
