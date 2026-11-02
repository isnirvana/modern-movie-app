// src/components/ReleasePill.tsx
// A heads-up next to a title's facts: "In theaters" for movies not out digitally yet, or a show's next season/episode
import { CalendarClock, Ticket } from "lucide-react"

type Props = { kind: "theaters" | "next"; label: string; large?: boolean }

export default function ReleasePill({ kind, label, large }: Props) {
  const Icon = kind === "theaters" ? Ticket : CalendarClock
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-[#b3aeff] ring-1 ring-primary/30 font-semibold ${
        large ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      <Icon size={large ? 13 : 11} />
      {label}
    </span>
  )
}
