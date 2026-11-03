// src/components/KidsBlocked.tsx
// Shown instead of a title page that a Kids profile isn't allowed to open
import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { useActiveProfile } from "../hooks/useProfiles"

export default function KidsBlocked({ rating }: { rating?: string | null }) {
  const profile = useActiveProfile()
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5">
        <ShieldCheck size={28} className="text-primary" />
      </div>
      <h1 className="text-xl font-semibold">Not available on {profile.name}'s profile</h1>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">
        {rating ? `This title is rated ${rating}. ` : ""}Kids profiles only show movies rated G or PG and shows rated TV-Y, TV-Y7 or TV-G.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-7">
        <Link to="/" className="btn-primary">Back to Home</Link>
        <Link to="/profiles" className="btn-secondary">Switch profile</Link>
      </div>
    </div>
  )
}
