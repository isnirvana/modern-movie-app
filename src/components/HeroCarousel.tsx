// import { useState, useEffect } from "react"
// import { motion } from "framer-motion"

// interface HeroItem {
//   id: number
//   title: string
//   backdrop_path: string
// }

// export default function HeroCarousel({ items }: { items: HeroItem[] }) {
//   const [index, setIndex] = useState(0)

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setIndex((i) => (i + 1) % items.length)
//     }, 5000)
//     return () => clearInterval(timer)
//   }, [items.length])

//   return (
//     <div className="relative w-full overflow-hidden h-96 mb-8">
//       {items.map((item, i) => (
//         <motion.div
//           key={item.id}
//           initial={{ opacity: i === index ? 1 : 0 }}
//           animate={{ opacity: i === index ? 1 : 0 }}
//           transition={{ duration: 0.8 }}
//           className="absolute inset-0 bg-cover bg-center"
//           style={{
//             backgroundImage: `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`,
//           }}
//         >
//           <div className="absolute bottom-10 left-10 text-white max-w-lg">
//             <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
//             <button className="px-5 py-2 bg-primary rounded hover:bg-primary/80">
//               Play
//             </button>
//           </div>
//         </motion.div>
//       ))}
//     </div>
//   )
// }

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

interface HeroItem {
  id: number
  title: string
  backdrop_path: string
  media_type?: "movie" | "tv"
}

export default function HeroCarousel({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [items.length])

  const handlePlay = (item: HeroItem) => {
    const type = item.media_type || "movie"
    navigate(`/${type}/${item.id}`)
  }

  return (
    <div className="relative w-full overflow-hidden h-96 mb-8">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: i === index ? 1 : 0 }}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className={`
            absolute inset-0 bg-cover bg-center
            ${i === index ? "pointer-events-auto" : "pointer-events-none"}
          `}
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`,
          }}
        >
          <div className="absolute bottom-10 left-10 text-white max-w-lg">
            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
            <button
              onClick={() => handlePlay(item)}
              className="px-5 py-2 bg-primary rounded hover:bg-primary/80"
            >
              ▶ Play
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
