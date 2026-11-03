// src/components/AccountSettings.tsx
// The Account page once signed in: settings in sections (account, profiles, notifications, deleting the account),
// with a side menu on desktop and section tabs on phones. The menu follows the section in view.
import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { Bell, ChevronRight, Loader2, Lock, LogOut, ShieldCheck, Trash2, AlertTriangle, User, Users } from "lucide-react"
import ProfileAvatar from "./ProfileAvatar"
import NotificationsToggle from "./NotificationsToggle"
import { useProfiles } from "../hooks/useProfiles"
import { notificationsSupported } from "../utils/notifications"
import { deleteAccount, signOut } from "../utils/sync"

const SECTIONS = [
  { id: "account", label: "Account", icon: User },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "delete", label: "Delete account", icon: AlertTriangle },
] as const
type SectionId = (typeof SECTIONS)[number]["id"]

const memberSince = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null

export default function AccountSettings({ session }: { session: Session }) {
  const email = session.user.email ?? ""
  const active = useSectionInView()

  const go = (id: SectionId) => document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <h1 className="section-heading text-2xl md:text-3xl">Settings</h1>
      <p className="text-sm text-gray-400 mt-1">Your account, profiles and notifications.</p>

      {/* Phones: section tabs, kept in view under the top bar */}
      <nav
        className="md:hidden sticky top-14 z-20 -mx-5 px-5 py-3 mt-4 flex gap-2 overflow-x-auto bg-bg/95 backdrop-blur border-b border-white/[0.06]"
        style={{ scrollbarWidth: "none" }}
        aria-label="Settings sections"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => go(s.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active === s.id ? "bg-primary text-white" : "bg-white/[0.06] text-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-10 mt-6 md:mt-8">
        {/* Desktop: side menu */}
        <aside className="hidden md:block">
          <nav className="sticky top-24 space-y-1" aria-label="Settings sections">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active === id ? "true" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                  active === id ? "bg-primary/15 text-white" : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                } ${id === "delete" && active !== id ? "hover:text-red-300" : ""}`}
              >
                <Icon size={17} className={active === id ? "text-primary" : ""} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6 min-w-0">
          <AccountSection email={email} since={memberSince(session.user.created_at)} />
          <ProfilesSection />
          <NotificationsSection />
          <DeleteSection />
        </div>
      </div>
    </div>
  )
}

// Which section is in the upper part of the screen
function useSectionInView() {
  const [active, setActive] = useState<SectionId>("account")
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id.replace("settings-", "") as SectionId)
      },
      { rootMargin: "-20% 0px -60% 0px" }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`settings-${s.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])
  return active
}

// --- Building blocks ---

function Section({ id, title, description, danger = false, children }: {
  id: SectionId
  title: string
  description?: string
  danger?: boolean
  children: ReactNode
}) {
  return (
    <section
      id={`settings-${id}`}
      className={`scroll-mt-32 md:scroll-mt-24 rounded-2xl border p-5 md:p-6 ${
        danger ? "border-red-500/20 bg-red-500/[0.04]" : "border-white/[0.07] bg-surface/70"
      }`}
    >
      <h2 className={`section-heading text-lg ${danger ? "text-red-300" : ""}`}>{title}</h2>
      {description && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

// A setting: what it is on the left, its control on the right (below it on narrow screens)
function Row({ title, text, children }: { title: string; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-4 first:pt-0 last:pb-0 border-t first:border-t-0 border-white/[0.06]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {text && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{text}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

// --- Sections ---

function AccountSection({ email, since }: { email: string; since: string | null }) {
  const [leaving, setLeaving] = useState(false)

  return (
    <Section id="account" title="Account">
      <div className="flex items-center gap-4 pb-5">
        <span className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display text-2xl font-extrabold">
          {email.charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate" title={email}>{email}</p>
          {since && <p className="text-xs text-gray-500 mt-0.5">Member since {since}</p>}
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <ShieldCheck size={13} /> Synced
        </span>
      </div>

      <Row
        title="Sync"
        text="Profiles, My List and Continue Watching are saved to this account and kept the same on every device you sign in on."
      >
        <span className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <ShieldCheck size={13} /> Synced
        </span>
      </Row>
      <Row title="Sign-in" text="No password: each time you sign in, we email you a code and a link." />
      <Row title="Sign out" text="Removes your profiles and lists from this device. They stay safe in your account.">
        <button
          onClick={async () => {
            setLeaving(true)
            await signOut()
          }}
          disabled={leaving}
          className="btn-secondary py-2 px-4 text-sm disabled:opacity-60"
        >
          {leaving ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />} Sign out
        </button>
      </Row>
    </Section>
  )
}

function ProfilesSection() {
  const { list, active } = useProfiles()
  return (
    <Section id="profiles" title="Profiles" description="Each profile has its own My List, Continue Watching and recommendations.">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <ProfileAvatar profile={p} size={36} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">{p.name}</span>
              <span className="block text-xs text-gray-500">
                {[p.id === active && "Watching now", p.kids && "Kids", !p.kids && p.id !== active && "Profile"].filter(Boolean).join(" · ")}
              </span>
            </span>
            {p.pin && <Lock size={14} className="text-gray-500" aria-label="Locked with a PIN" />}
          </li>
        ))}
      </ul>
      <Link to="/profiles" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        Manage profiles <ChevronRight size={15} />
      </Link>
    </Section>
  )
}

function NotificationsSection() {
  return (
    <Section id="notifications" title="Notifications" description="Sent to this device for the profile you're using.">
      <Row
        title="New episodes and reminders"
        text="New episodes of your shows, My List movies when they come out, and a nudge to finish what you started. At most one a day, between 10:00 and 21:00."
      >
        {notificationsSupported() ? (
          <NotificationsToggle />
        ) : (
          <span className="text-xs text-gray-500">Not available in this browser</span>
        )}
      </Row>
      {!notificationsSupported() && (
        <p className="text-xs text-gray-500 mt-3">On iPhone, add Lumo to your Home Screen (Share, then Add to Home Screen) and open it from there.</p>
      )}
    </Section>
  )
}

function DeleteSection() {
  const [confirming, setConfirming] = useState(false)
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
    <Section
      id="delete"
      title="Delete account"
      danger
      description="Deletes your account and everything saved in it (profiles, My List, Continue Watching) on every device. This can't be undone."
    >
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-200 w-full sm:w-auto">Are you sure?</span>
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete for good
          </button>
          <button onClick={() => setConfirming(false)} disabled={busy} className="px-4 py-2.5 text-sm text-gray-300 hover:text-white">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={15} /> Delete account
        </button>
      )}
      {error && <p className="text-sm text-red-400 mt-3" role="alert">{error}</p>}
    </Section>
  )
}
