import { useRef } from 'react';
import { motion } from 'framer-motion';

export default function CastCarousel({ cast }: any[]) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="flex space-x-4 overflow-x-auto py-4">
      {cast.map(c => (
        <motion.div
          key={c.cast_id}
          whileHover={{ scale: 1.1 }}
          className="min-w-[100px] text-center"
        >
          <img
            src={`https://image.tmdb.org/t/p/w154${c.profile_path}`}
            alt={c.name}
            className="rounded mb-2"
          />
          <p className="text-sm">{c.name}</p>
          <p className="text-xs text-gray-400">{c.character}</p>
        </motion.div>
      ))}
    </div>
  );
}
