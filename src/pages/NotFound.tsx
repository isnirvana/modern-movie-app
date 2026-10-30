// src/pages/NotFound.tsx
import { Link } from "react-router-dom"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-7xl font-black text-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        404
      </p>
      <h1 className="text-xl font-bold mt-4">Page not found</h1>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-8">
        <Home size={16} /> Back to home
      </Link>
    </div>
  )
}
