// src/components/ProfileAvatar.tsx
// A profile's colored tile with its initial; Kids profiles get a small badge
import type { Profile } from "../utils/profiles"

type Props = { profile: Profile; size?: number; badge?: boolean; className?: string }

export default function ProfileAvatar({ profile, size = 32, badge = false, className = "" }: Props) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 font-display font-extrabold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        fontSize: size * 0.45,
        background: `linear-gradient(135deg, ${profile.color}, ${profile.color}99)`,
      }}
      aria-hidden="true"
    >
      {profile.name.trim().charAt(0).toUpperCase() || "?"}
      {badge && profile.kids && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-md bg-white text-[10px] font-bold tracking-wide text-gray-900 font-sans">
          KIDS
        </span>
      )}
    </span>
  )
}
