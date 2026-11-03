// src/hooks/useAccount.ts
// Who's signed in, for places on every page (the top bar). Loads the sync code lazily, like Layout does,
// so the Supabase client stays out of the first download.
import { useEffect, useState } from "react"

// Accounts exist only when the site is built with Supabase settings (utils/supabase.ts)
export const ACCOUNTS_ENABLED = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

type Account = { known: boolean; email: string | null }

export function useAccount(): Account {
  const [account, setAccount] = useState<Account>({ known: false, email: null })
  useEffect(() => {
    if (!ACCOUNTS_ENABLED) return
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    import("../utils/sync").then((sync) => {
      if (cancelled) return
      const update = () => setAccount({ known: sync.isSessionKnown(), email: sync.getSession()?.user.email ?? null })
      update()
      const off = sync.subscribeSession(update)
      unsubscribe = () => void off()
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])
  return account
}
