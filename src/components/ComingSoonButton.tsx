// src/components/ComingSoonButton.tsx
// Stands in for Play on titles that aren't out yet
import { CalendarClock } from "lucide-react"
import { formatReleaseDate } from "../utils/media"

export default function ComingSoonButton({ date, className = "" }: { date?: string; className?: string }) {
  return (
    <button
      disabled
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-gray-200 bg-white/[0.07] ring-1 ring-white/15 cursor-default ${className}`}
    >
      <CalendarClock size={16} className="text-primary" />
      {date ? `Coming ${formatReleaseDate(date)}` : "Coming soon"}
    </button>
  )
}
