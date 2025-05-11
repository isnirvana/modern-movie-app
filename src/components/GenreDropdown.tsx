import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useGenres } from "../hooks/useGenres"

export default function GenreDropdown() {
  const [open, setOpen] = useState(false)
  const { data: genres, isLoading, isError } = useGenres()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (isLoading) {
    return <span className="px-2 text-sm text-gray-300">Loading…</span>
  }

  if (isError || !genres) {
    return <span className="px-2 text-sm text-red-400">Failed to load</span>
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 rounded hover:bg-gray-700 transition"
      >
        Genres
      </button>

      {open && (
        <ul className="absolute left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
          {genres.map((g) => (
            <li key={g.id}>
              <Link
                to={`/genre/${g.id}`}
                onClick={() => setOpen(false)} // close dropdown on click
                className="block px-4 py-2 hover:bg-gray-700 text-sm text-white"
              >
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
