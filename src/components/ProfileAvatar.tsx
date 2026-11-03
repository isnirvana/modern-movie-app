// src/components/ProfileAvatar.tsx
// A profile's tile: the actor's or director's photo it picked, or else its colour as a lit gradient
// (a soft highlight top-left, deepening to a darker shade) with its initial. Kids profiles get a small badge.
import { useState } from "react"
import type { Profile } from "../utils/profiles"

type Props = { profile: Pick<Profile, "name" | "color" | "kids" | "avatar">; size?: number; badge?: boolean; className?: string }

// TMDB portrait sizes: a small one for the top bar, a large one for the profiles screen (sharp on 2x screens)
const photoUrl = (path: string, size: number) => `https://image.tmdb.org/t/p/${size > 80 ? "h632" : "w185"}${path}`

export default function ProfileAvatar({ profile, size = 32, badge = false, className = "" }: Props) {
  const c = profile.color
  // The initial shows until the photo has loaded (then it fades in over it), and stays if the photo won't load
  const [failed, setFailed] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<string | null>(null)
  const photo = profile.avatar && profile.avatar !== failed ? profile.avatar : null

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 font-display font-extrabold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        fontSize: size * 0.45,
        backgroundColor: c,
        backgroundImage: `radial-gradient(circle at 28% 18%, rgba(255,255,255,0.32), transparent 55%), linear-gradient(150deg, ${c}, color-mix(in srgb, ${c} 55%, #0a0a0f))`,
        textShadow: "0 2px 12px rgba(0,0,0,0.25)",
      }}
      aria-hidden="true"
    >
      {profile.name.trim().charAt(0).toUpperCase() || "?"}
      {photo && (
        <img
          src={photoUrl(photo, size)}
          alt=""
          draggable={false}
          onLoad={() => setLoaded(photo)}
          onError={() => setFailed(photo)}
          className={`absolute inset-0 w-full h-full object-cover object-[50%_18%] transition-opacity duration-300 ${
            loaded === photo ? "opacity-100" : "opacity-0"
          }`}
          style={{ borderRadius: "inherit" }}
        />
      )}
      {/* Edge light and depth, on a layer of their own so a ring-* class on the avatar still shows */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 -10px 24px rgba(0,0,0,0.18)" }}
      />
      {badge && profile.kids && (
        // z-10: stays above anything laid over the avatar (e.g. the profiles page's Manage overlay)
        <span className="absolute z-10 -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-md bg-white text-[10px] font-bold tracking-wide text-gray-900 font-sans shadow">
          KIDS
        </span>
      )}
    </span>
  )
}
