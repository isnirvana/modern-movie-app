// src/pages/AccountPage.tsx
// Sign in / create an account; once signed in, the account's settings (components/AccountSettings.tsx). Signing in keeps profiles, My List
// and Continue Watching on every device (utils/sync.ts). There's no password: we email a link and a code
// (the code is for the installed app, where links open in the browser). A new email creates the account.
import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Loader2,
  Mail,
  MailCheck,
  MonitorSmartphone,
  RefreshCw,
} from "lucide-react"
import { LogoMark } from "../components/Logo"
import AccountSettings from "../components/AccountSettings"
import { useSession, useSessionKnown } from "../hooks/useSession"
import { useTmdbList } from "../hooks/useTmdbList"
import { supabase } from "../utils/supabase"
import { isKidsMode } from "../utils/profiles"
import { sendSignInEmail, verifySignInCode } from "../utils/sync"

// Supabase's code length is a project setting (6 by default in new projects, 8 in some): accept either
const CODE_MIN = 6
const CODE_MAX = 8
// Supabase lets an address get a new email once a minute
const RESEND_AFTER_S = 60

const BENEFITS = [
  { icon: MonitorSmartphone, text: "Profiles, My List and Continue Watching on all your devices" },
  { icon: RefreshCw, text: "Start on your phone, finish on the TV, right where you left off" },
  { icon: BellRing, text: "New-episode alerts wherever you're signed in" },
]

// Supabase's messages are written for developers; these are for viewers
function friendlyError(error: { message: string; status?: number }) {
  const m = error.message.toLowerCase()
  if (error.status === 429 || m.includes("rate limit") || m.includes("security purposes"))
    return "Too many emails for now. Wait a minute, then try again."
  if (m.includes("invalid") && m.includes("email")) return "That email address doesn't look right."
  if (m.includes("network") || m.includes("fetch")) return "Couldn't connect. Check your internet and try again."
  return error.message
}

export default function AccountPage() {
  const session = useSession()
  const known = useSessionKnown()

  // Signed in: the settings page, full width
  if (supabase && !isKidsMode() && known && session) return <AccountSettings session={session} />

  let content: ReactNode
  if (!supabase) content = <Notice title="Accounts aren't available" text="This site works on this device only." />
  else if (isKidsMode())
    content = <Notice title="Ask a grown-up" text="Account settings are in a grown-up profile." action={{ to: "/profiles", label: "Switch profile" }} />
  else if (!known) content = <Loader2 size={28} className="animate-spin text-gray-500 mx-auto my-16" />
  else content = <SignIn />

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10 md:py-16 overflow-hidden">
      <PosterWall />
      <div className="relative w-full max-w-md">{content}</div>
    </div>
  )
}

// Trending posters, tilted and dimmed behind the card
function PosterWall() {
  const { data = [] } = useTmdbList("/trending/movie/week", "movie")
  const posters = data.filter((m: any) => m.poster_path).slice(0, 18)
  if (!posters.length) return null
  const tiles = [...posters, ...posters].slice(0, 36)
  return (
    <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
      <div className="absolute -inset-[20%] grid grid-cols-4 sm:grid-cols-6 gap-3 -rotate-[10deg] opacity-40">
        {tiles.map((m: any, i) => (
          <img
            key={i}
            src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
            alt=""
            loading="lazy"
            className="w-full rounded-xl object-cover"
            style={{ aspectRatio: "2/3" }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,15,0.75)_0%,rgba(10,10,15,0.95)_55%,#0a0a0f_85%)]" />
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl p-6 sm:p-8 shadow-card"
      style={{ background: "rgba(18,18,26,0.88)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
    >
      {children}
    </motion.div>
  )
}

function Notice({ title, text, action }: { title: string; text: string; action?: { to: string; label: string } }) {
  return (
    <Card>
      <div className="text-center">
        <LogoMark size={44} className="mx-auto" />
        <h1 className="section-heading text-2xl mt-5">{title}</h1>
        <p className="text-sm text-gray-400 mt-2">{text}</p>
        {action && (
          <Link to={action.to} className="btn-primary mt-6 justify-center">
            {action.label}
          </Link>
        )}
      </div>
    </Card>
  )
}

const inputClass =
  "w-full bg-white/[0.06] border border-white/10 rounded-xl outline-none transition-colors focus:border-primary/70 focus:bg-white/[0.08] disabled:opacity-60"

function SignIn() {
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const send = async (address: string) => {
    setBusy(true)
    setError("")
    const { error } = await sendSignInEmail(address)
    setBusy(false)
    if (error) setError(friendlyError(error))
    else setSentTo(address)
    return !error
  }

  return (
    <Card>
      <AnimatePresence mode="wait" initial={false}>
        {sentTo ? (
          <motion.div key="code" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <CodeStep email={sentTo} onResend={() => send(sentTo)} onBack={() => setSentTo(null)} />
          </motion.div>
        ) : (
          <motion.div key="email" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2 }}>
            <LogoMark size={44} />
            <h1 className="section-heading text-2xl sm:text-[1.7rem] mt-5 leading-tight">Sign in or create an account</h1>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Enter your email and we'll send you a sign-in code. No password needed.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(email.trim())
              }}
              className="mt-6"
            >
              <label htmlFor="account-email" className="block text-xs font-medium text-gray-400 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="account-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`${inputClass} pl-11 pr-4 py-3.5 text-[15px]`}
                />
              </div>
              {error && <p className="text-sm text-red-400 mt-3" role="alert">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center mt-4 disabled:opacity-60 disabled:hover:translate-y-0">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={17} /></>}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-3 text-center">New to Lumo? Continuing creates your account.</p>

            <ul className="mt-7 pt-6 border-t border-white/[0.07] space-y-3.5">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <Icon size={16} />
                  </span>
                  <span className="pt-1.5 leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function CodeStep({ email, onResend, onBack }: { email: string; onResend: () => Promise<boolean>; onBack: () => void }) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [resendIn, setResendIn] = useState(RESEND_AFTER_S)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const verify = async (token: string) => {
    setBusy(true)
    setError("")
    const { error } = await verifySignInCode(email, token)
    setBusy(false)
    if (error) {
      setCode("")
      setError("That code didn't work. Check it, or send a new one.")
    }
    // On success the session listener takes over (sync starts, the page switches to the account view)
  }

  const resend = async () => {
    setResent(false)
    if (await onResend()) {
      setResent(true)
      setResendIn(RESEND_AFTER_S)
    }
  }

  return (
    <>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white -ml-1 mb-5">
        <ArrowLeft size={16} /> Back
      </button>
      <span className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
        <MailCheck size={24} />
      </span>
      <h1 className="section-heading text-2xl mt-5">Check your inbox</h1>
      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
        We sent a code to <span className="text-white font-medium break-all">{email}</span>. Enter it below, or tap the
        link in the email.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.length >= CODE_MIN) verify(code)
        }}
        className="mt-6"
      >
        <label htmlFor="account-code" className="block text-xs font-medium text-gray-400 mb-2">
          Sign-in code
        </label>
        <input
          id="account-code"
          value={code}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, CODE_MAX)
            setCode(digits)
            // A pasted or auto-filled full code goes straight in
            if (digits.length === CODE_MAX) verify(digits)
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          disabled={busy}
          placeholder="••••••"
          className={`${inputClass} px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.45em] placeholder:text-gray-600 tabular-nums`}
        />
        {error && <p className="text-sm text-red-400 mt-3" role="alert">{error}</p>}
        <button type="submit" disabled={busy || code.length < CODE_MIN} className="btn-primary w-full justify-center mt-4 disabled:opacity-50 disabled:hover:translate-y-0">
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm mt-5">
        <span className="text-gray-500">{resent ? "New code sent." : "Didn't get it? Check spam."}</span>
        <button onClick={resend} disabled={resendIn > 0} className="font-medium text-primary hover:underline disabled:text-gray-500 disabled:no-underline tabular-nums">
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
        </button>
      </div>
    </>
  )
}
