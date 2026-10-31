// src/components/DetailsSection.tsx
// "Details": label/value facts plus studio or network logos
import type { Company, DetailRow, StatusTone } from "../utils/details"

type Props = {
  rows: DetailRow[]
  companies: Company[]
  companiesLabel: string // "Studios" or "Network"
}

export default function DetailsSection({ rows, companies, companiesLabel }: Props) {
  if (rows.length === 0 && companies.length === 0) return null

  return (
    <section className="px-5 md:px-16 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="section-heading">Details</h2>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 max-w-4xl">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-4 py-3 border-b border-white/[0.06]">
            <dt className="w-32 flex-shrink-0 text-sm text-gray-500">{r.label}</dt>
            <dd className="text-sm text-gray-200 min-w-0">{r.value}</dd>
          </div>
        ))}
      </dl>

      {companies.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">{companiesLabel}</p>
          <div className="flex flex-wrap gap-3">
            {companies.map((c) =>
              // Logos are mostly dark on transparent, so they sit on a light chip
              c.logo_path ? (
                <span
                  key={c.id}
                  className="h-11 px-3 rounded-xl bg-white/90 flex items-center"
                  title={c.name}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w154${c.logo_path}`}
                    alt={c.name}
                    loading="lazy"
                    className="max-h-7 max-w-[110px] object-contain"
                  />
                </span>
              ) : (
                <span key={c.id} className="h-11 px-4 rounded-xl glass flex items-center text-sm text-gray-300">
                  {c.name}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// Age rating badge, e.g. "PG-13" — sits next to the star rating
export function CertBadge({ cert, large }: { cert: string | null; large?: boolean }) {
  if (!cert) return null
  return (
    <span
      className={`inline-flex items-center rounded-md border border-white/30 font-semibold text-gray-200 leading-none ${
        large ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
      aria-label={`Rated ${cert}`}
    >
      {cert}
    </span>
  )
}

const toneClass: Record<StatusTone, string> = {
  good: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  neutral: "bg-white/10 text-gray-300 border-white/20",
  bad: "bg-red-500/15 text-red-300 border-red-400/30",
}

// TV status pill: Returning Series (green), Ended (grey), Canceled (red)
export function StatusPill({ status, large }: { status: { label: string; tone: StatusTone } | null; large?: boolean }) {
  if (!status) return null
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold leading-none ${toneClass[status.tone]} ${
        large ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {status.label}
    </span>
  )
}
