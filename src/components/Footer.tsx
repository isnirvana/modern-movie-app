// src/components/Footer.tsx
import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/[0.07]">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <Link to="/" className="flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-black text-white">
            P
          </span>
          <span className="text-gradient font-bold">Prime</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/movies" className="hover:text-white transition-colors">Movies</Link>
          <Link to="/tv" className="hover:text-white transition-colors">TV Shows</Link>
          <Link to="/search" className="hover:text-white transition-colors">Search</Link>
        </nav>
        <p className="text-xs text-center md:text-right">
          Data from TMDB. This site does not host any files.
        </p>
      </div>
    </footer>
  )
}
