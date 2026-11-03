// src/components/AccountPanel.tsx
// Sign in / out on the profiles page. Signing in keeps profiles, My List and Continue Watching on every device
// (utils/sync.ts). Sign-in is by email: a link, or a 6-digit code for the installed app (links open in the browser).
import { useState } from "react"
import { Cloud, LogOut, Mail, Trash2 } from "lucide-react"
import { useSession } from "../hooks/useSession"
import { supabase } from "../utils/supabase"
import { deleteAccount, sendSignInEmail, signOut, verifySignInCode } from "../utils/sync"

// Supabase's code length is a project setting (6 by default in new projects, 8 in some): accept either
const CODE_MIN = 6
const CODE_MAX = 8

export default function AccountPanel() {
  const session = useSession()
  if (!supabase) return null

  return (
    <div className="glass rounded-2xl p-5 mt-10 w-full max-w-md">
      <div className="flex items-start gap-3">
        <Cloud size={18} className="text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">{session ? <SignedIn email={session.user.email ?? ""} /> : <SignIn />}</div>
      </div>
    </div>
  )
}

function SignIn() {
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const send = async () => {
    setBusy(true)
    setError("")
    const { error } = await sendSignInEmail(email.trim())
    setBusy(false)
    if (error) setError(error.message)
    else setSentTo(email.trim())
  }

  const verify = async (token: string) => {
    setBusy(true)
    setError("")
    const { error } = await verifySignInCode(sentTo!, token)
    setBusy(false)
    if (error) {
      setCode("")
      setError("That code didn't work. Check it, or send a new one.")
    }
    // On success the session listener takes over (sync starts, this panel switches to "signed in")
  }

  if (sentTo) {
    return (
      <>
        <h2 className="font-semibold">Check your email</h2>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          We sent a sign-in link and a code to <span className="text-white">{sentTo}</span>. Tap the link, or enter the
          code here.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (code.length >= CODE_MIN) verify(code)
          }}
          className="flex gap-2 mt-4"
        >
          <input
            value={code}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, CODE_MAX)
              setCode(digits)
              // A pasted or auto-filled full code goes straight in
              if (digits.length === CODE_MAX) verify(digits)
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={busy}
            placeholder="Code"
            aria-label="Sign-in code"
            className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-primary/60 disabled:opacity-60"
          />
          <button type="submit" disabled={busy || code.length < CODE_MIN} className="btn-primary py-2.5 px-4 text-sm disabled:opacity-50">
            Verify
          </button>
        </form>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        <button onClick={() => setSentTo(null)} className="text-xs text-gray-400 hover:text-white mt-3">
          Use a different email
        </button>
      </>
    )
  }

  return (
    <>
      <h2 className="font-semibold">Sign in to sync</h2>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
        Keep your profiles, My List and Continue Watching on all your devices. No password needed.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex gap-2 mt-4"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email"
          autoComplete="email"
          className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <button type="submit" disabled={busy} className="btn-primary py-2.5 px-4 text-sm disabled:opacity-60">
          <Mail size={15} /> Send
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </>
  )
}

function SignedIn({ email }: { email: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const remove = async () => {
    setBusy(true)
    try {
      await deleteAccount()
    } catch {
      setBusy(false)
      setError("Couldn't delete the account. Try again.")
    }
  }

  return (
    <>
      <h2 className="font-semibold">Synced across your devices</h2>
      <p className="text-xs text-gray-400 mt-1 truncate">Signed in as {email}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => signOut()} className="btn-secondary py-2 px-4 text-sm">
          <LogOut size={15} /> Sign out
        </button>
        {!confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} className="text-sm text-gray-400 hover:text-red-400 px-2">
            Delete account
          </button>
        )}
      </div>
      {confirmDelete && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-gray-200 leading-relaxed">
            This deletes your account and everything saved in it (profiles, My List, Continue Watching) on every device.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-60"
            >
              <Trash2 size={14} /> Delete for good
            </button>
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 text-sm text-gray-300 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <p className="text-[11px] text-gray-500 mt-4">Signing out removes your profiles and lists from this device. They stay safe in your account.</p>
    </>
  )
}
