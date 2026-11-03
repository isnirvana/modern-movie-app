// src/components/AccountPanel.tsx
// The account, in one quiet line under the profiles: who's signed in, or an invitation to sign in.
// Signing in and the account's settings are on the Account page (pages/AccountPage.tsx).
import { Link } from "react-router-dom"
import { ChevronRight, Cloud, ShieldCheck } from "lucide-react"
import { useSession, useSessionKnown } from "../hooks/useSession"
import { supabase } from "../utils/supabase"

const pill =
  "group mt-8 inline-flex items-center gap-2.5 max-w-full pl-3.5 pr-3 py-2 rounded-full text-sm border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-colors"

export default function AccountPanel() {
  const session = useSession()
  const known = useSessionKnown()
  if (!supabase || !known) return null

  if (session) {
    return (
      <Link to="/account" className={pill}>
        <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
        <span className="text-gray-400 truncate">
          Synced as <span className="text-gray-200">{session.user.email}</span>
        </span>
        <ChevronRight size={15} className="text-gray-500 group-hover:text-white shrink-0" />
      </Link>
    )
  }

  return (
    <Link to="/account" className={pill}>
      <Cloud size={15} className="text-primary shrink-0" />
      <span className="text-gray-400">
        Keep profiles on every device. <span className="text-white font-medium">Sign in</span>
      </span>
      <ChevronRight size={15} className="text-gray-500 group-hover:text-white shrink-0" />
    </Link>
  )
}
