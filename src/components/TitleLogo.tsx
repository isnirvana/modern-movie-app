// src/components/TitleLogo.tsx
// A title's official logo artwork in place of the text heading, like Apple TV and Netflix.
// Falls back to the text when there's no logo (or it fails to load); `logo` undefined means "still finding out".
import { useState } from "react"

type Props = {
  title: string
  logo: string | null | undefined
  // Classes for the text heading (also sizes the space kept while the logo loads)
  textClassName: string
  // Size limits for the logo image, e.g. "max-h-28 max-w-md"
  logoClassName: string
}

const HEADING_FONT = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

export default function TitleLogo({ title, logo, textClassName, logoClassName }: Props) {
  const [loaded, setLoaded] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  if (logo === null || (logo && failed === logo)) {
    return <h1 className={textClassName} style={HEADING_FONT}>{title}</h1>
  }

  const ready = !!logo && loaded === logo
  return (
    <h1 className="relative">
      {/* Holds the text's space (invisible) until the logo is in, so nothing jumps */}
      {!ready && <span className={`block invisible ${textClassName}`} style={HEADING_FONT}>{title}</span>}
      {logo && (
        <img
          key={logo}
          src={`https://image.tmdb.org/t/p/w500${logo}`}
          alt={title}
          onLoad={() => setLoaded(logo)}
          onError={() => setFailed(logo)}
          className={`block object-contain object-left-bottom drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)] transition-opacity duration-500 ${logoClassName} ${
            ready ? "opacity-100" : "absolute left-0 bottom-0 opacity-0"
          }`}
        />
      )}
    </h1>
  )
}
