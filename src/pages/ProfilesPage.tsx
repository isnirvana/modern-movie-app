// src/pages/ProfilesPage.tsx
// "Who's watching?": switch profiles, and add / edit / delete them (Manage profiles). A screen of its own
// (Layout shows just the logo), like the streaming apps': big avatars that lift and glow in their colour,
// and the one picked zooms in as the others fade before the app opens on it.
// A profile with a lock asks for its PIN before it opens, or before it's edited from another profile.
// Kids profiles can't manage profiles: that's done from a grown-up one (lock those to keep kids out).
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, Lock, Pencil, Plus, Trash2, Unlock } from "lucide-react"
import ProfileAvatar from "../components/ProfileAvatar"
import AvatarPicker from "../components/AvatarPicker"
import AccountPanel from "../components/AccountPanel"
import { useProfiles } from "../hooks/useProfiles"
import { useIsDesktop } from "../hooks/useMediaQuery"
import {
  MAIN_ID,
  MAX_PROFILES,
  PROFILE_COLORS,
  addProfile,
  checkProfilePin,
  deleteProfile,
  setProfilePin,
  switchProfile,
  updateProfile,
  type Profile,
} from "../utils/profiles"

const PIN_LENGTH = 4
// How long the picked avatar zooms before the app opens on it
const CHOOSE_MS = 420

export default function ProfilesPage() {
  const { list, active } = useProfiles()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const size = useIsDesktop() ? 148 : 96
  const [managing, setManaging] = useState(false)
  const [editing, setEditing] = useState<Profile | "new" | null>(null)
  // Profiles whose PIN was entered on this visit (the one in use counts as open)
  const [unlocked, setUnlocked] = useState(() => new Set([active]))
  // A locked profile waiting for its PIN, and what to do once it's entered
  const [asking, setAsking] = useState<{ profile: Profile; then: () => void } | null>(null)
  // The profile picked, while its avatar zooms
  const [chosen, setChosen] = useState<string | null>(null)

  const current = list.find((p) => p.id === active)
  const inKids = current?.kids ?? false

  // Runs `then` now, or after the profile's PIN if it's locked
  const withPin = (profile: Profile, then: () => void) =>
    !profile.pin || unlocked.has(profile.id) ? then() : setAsking({ profile, then })

  const open = (p: Profile) => {
    setChosen(p.id)
    setTimeout(() => (p.id === active ? navigate("/") : switchProfile(p.id)), reduceMotion ? 0 : CHOOSE_MS)
  }

  const pick = (p: Profile) => {
    if (chosen) return
    if (managing) return withPin(p, () => setEditing(p))
    withPin(p, () => open(p))
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-5 py-12 md:py-16 overflow-hidden">
      {/* Ambient light: the brand colours, and the current profile's, very faint */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/[0.13] blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[500px] rounded-full bg-accent/[0.07] blur-[120px]" />
        {current && (
          <div className="absolute bottom-[-220px] left-[-120px] w-[560px] h-[460px] rounded-full opacity-[0.10] blur-[120px]" style={{ background: current.color }} />
        )}
      </div>

      <motion.div
        className="relative flex flex-col items-center w-full"
        animate={{ opacity: chosen ? 0.0 : 1 }}
        transition={{ duration: 0.3, delay: chosen ? 0.15 : 0 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={managing ? "manage" : "watch"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <h1 className="font-display font-extrabold tracking-tight text-[2rem] leading-tight sm:text-5xl md:text-6xl">
              {managing ? "Manage profiles" : "Who’s watching?"}
            </h1>
            <p className="text-sm md:text-base text-gray-400 mt-3 max-w-md mx-auto">
              {managing ? "Choose a profile to edit." : "Each profile has its own list, progress and recommendations."}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.ul
        className="relative flex flex-wrap justify-center gap-x-5 gap-y-8 sm:gap-x-10 md:gap-x-12 mt-10 md:mt-16 max-w-5xl"
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}
      >
        {list.map((p) => (
          <ProfileTile
            key={p.id}
            profile={p}
            size={size}
            managing={managing}
            current={p.id === active}
            state={!chosen ? "idle" : chosen === p.id ? "chosen" : "other"}
            onClick={() => pick(p)}
          />
        ))}

        {!inKids && list.length < MAX_PROFILES && (
          <motion.li variants={tileIn}>
            <motion.button
              onClick={() => setEditing("new")}
              animate={{ opacity: chosen ? 0 : 1 }}
              className="group flex flex-col items-center gap-3 outline-none"
              style={{ width: size }}
            >
              <span
                className="flex items-center justify-center border border-white/15 bg-white/[0.03] text-gray-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/40 group-hover:bg-white/[0.07] group-hover:text-white group-focus-visible:ring-2 group-focus-visible:ring-white"
                style={{ width: size, height: size, borderRadius: size * 0.28 }}
              >
                <span className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/[0.08] flex items-center justify-center transition-colors group-hover:bg-white/15">
                  <Plus size={26} strokeWidth={2.2} />
                </span>
              </span>
              <span className="text-sm md:text-base text-gray-400 group-hover:text-white transition-colors">Add profile</span>
            </motion.button>
          </motion.li>
        )}
      </motion.ul>

      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: chosen ? 0 : 1 }}
        transition={{ delay: chosen ? 0 : 0.35 }}
      >
        {inKids ? (
          <p className="text-xs text-gray-500 mt-14 text-center max-w-xs">Profiles can be managed from a grown-up profile.</p>
        ) : (
          <button
            onClick={() => setManaging((m) => !m)}
            className={`mt-12 md:mt-14 inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold tracking-[0.16em] uppercase transition-colors ${
              managing ? "bg-white text-gray-900 hover:bg-gray-200" : "border border-white/25 text-gray-300 hover:text-white hover:border-white/70"
            }`}
          >
            {managing ? <><Check size={16} strokeWidth={2.6} /> Done</> : "Manage profiles"}
          </button>
        )}

        {/* Not in Kids profiles: kids shouldn't sign the account out (or delete it) */}
        {!inKids && <AccountPanel />}
      </motion.div>

      <AnimatePresence>
        {editing && <ProfileEditor key="editor" profile={editing} activeId={active} onClose={() => setEditing(null)} />}
        {asking && (
          <PinDialog
            key="pin-check"
            profile={asking.profile}
            title={`Enter ${asking.profile.name}'s PIN`}
            onClose={() => setAsking(null)}
            onPin={async (pin) => {
              if (!(await checkProfilePin(asking.profile, pin))) return false
              setUnlocked((s) => new Set(s).add(asking.profile.id))
              setAsking(null)
              asking.then()
              return true
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const tileIn = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 22, stiffness: 260 } },
}

function ProfileTile({ profile: p, size, managing, current, state, onClick }: {
  profile: Profile
  size: number
  managing: boolean
  current: boolean
  state: "idle" | "chosen" | "other"
  onClick: () => void
}) {
  const radius = size * 0.28
  return (
    <motion.li variants={tileIn}>
      <motion.button
        onClick={onClick}
        animate={state === "chosen" ? { scale: 1.14 } : state === "other" ? { opacity: 0, scale: 0.92 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="group flex flex-col items-center gap-3 outline-none"
        style={{ width: size }}
        aria-label={managing ? `Edit ${p.name}` : `Watch as ${p.name}${p.pin ? " (locked)" : ""}`}
      >
        <span className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5">
          {/* Glow in the profile's colour */}
          <span
            className="absolute -inset-2 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-50 group-focus-visible:opacity-50"
            style={{ background: p.color, borderRadius: radius }}
            aria-hidden="true"
          />
          <ProfileAvatar
            profile={p}
            size={size}
            badge
            className="ring-white ring-offset-bg transition-shadow duration-300 group-hover:ring-[3px] group-hover:ring-offset-4 group-focus-visible:ring-[3px] group-focus-visible:ring-offset-4"
          />
          {managing && (
            <span className="absolute inset-0 bg-black/70 backdrop-blur-[3px] flex items-center justify-center" style={{ borderRadius: radius }}>
              <span className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-white/80 flex items-center justify-center">
                <Pencil size={20} />
              </span>
            </span>
          )}
          {p.pin && (
            <span
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-bg border border-white/15 flex items-center justify-center shadow-card"
              title="Locked with a PIN"
            >
              <Lock size={13} className="text-gray-300" />
            </span>
          )}
        </span>
        <span className="flex flex-col items-center max-w-full">
          <span className="text-sm md:text-base font-medium text-gray-400 group-hover:text-white transition-colors truncate max-w-full">
            {p.name}
          </span>
          {current && !managing && <span className="mt-1 w-1 h-1 rounded-full bg-white/50" title="In use" aria-hidden="true" />}
        </span>
      </motion.button>
    </motion.li>
  )
}

// --- Dialogs: a sheet from the bottom on phones, a card in the middle on bigger screens ---

function Dialog({ title, onClose, children, top }: { title: string; onClose: () => void; children: ReactNode; top?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl px-6 pt-3 sm:pt-7 shadow-card"
        style={{
          background: "linear-gradient(to bottom, #191924, #12121a)",
          border: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden mx-auto w-10 h-1.5 rounded-full bg-white/15 mb-5" aria-hidden="true" />
        {top}
        <h2 className="section-heading text-xl text-center">{title}</h2>
        <div className="mt-6">{children}</div>
      </motion.div>
    </motion.div>
  )
}

function ProfileEditor({ profile, activeId, onClose }: { profile: Profile | "new"; activeId: string; onClose: () => void }) {
  const isNew = profile === "new"
  const { list } = useProfiles()
  const unusedColor = PROFILE_COLORS.find((c) => !list.some((p) => p.color === c)) ?? PROFILE_COLORS[0]
  const [name, setName] = useState(isNew ? "" : profile.name)
  const [color, setColor] = useState(isNew ? unusedColor : profile.color)
  const [kids, setKids] = useState(isNew ? false : profile.kids)
  const [avatar, setAvatar] = useState(isNew ? undefined : profile.avatar)
  // Lock changes wait for Save: undefined = unchanged, null = remove the lock, a string = the new PIN
  const [newPin, setNewPin] = useState<string | null | undefined>(undefined)
  const [step, setStep] = useState<"form" | "avatar" | "pin" | "delete">("form")

  const locked = newPin === undefined ? !isNew && !!profile.pin : newPin !== null

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = isNew ? addProfile(trimmed, kids, color, avatar).id : profile.id
    if (!isNew) updateProfile(id, { name: trimmed, color, kids, avatar })
    if (newPin !== undefined) await setProfilePin(id, newPin)
    // Kids rules are set when the app starts, so restart if the profile in use changed them
    if (!isNew && id === activeId && profile.kids !== kids) switchProfile(activeId)
    else onClose()
  }

  const remove = () => {
    if (isNew) return
    deleteProfile(profile.id)
    if (profile.id === activeId) switchProfile(MAIN_ID)
    else onClose()
  }

  if (step === "avatar") {
    return (
      <Dialog title="Choose an avatar" onClose={() => setStep("form")}>
        <AvatarPicker
          profile={{ name: name || "?", color, kids }}
          value={avatar}
          onPick={(picked) => {
            setAvatar(picked)
            setStep("form")
          }}
        />
      </Dialog>
    )
  }

  if (step === "pin") {
    return (
      <PinDialog
        title={locked ? "Choose a new PIN" : "Choose a PIN"}
        create
        onClose={() => setStep("form")}
        onPin={async (pin) => {
          setNewPin(pin)
          setStep("form")
          return true
        }}
      />
    )
  }

  if (!isNew && step === "delete") {
    return (
      <Dialog
        title={`Delete ${profile.name}?`}
        onClose={onClose}
        top={
          <div className="flex justify-center mb-4">
            <ProfileAvatar profile={profile} size={64} />
          </div>
        }
      >
        <p className="text-sm text-gray-400 text-center leading-relaxed">
          Their My List, Continue Watching and recommendations will be deleted. This can't be undone.
        </p>
        <div className="flex gap-2 mt-6">
          <button onClick={() => setStep("form")} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={remove}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </Dialog>
    )
  }

  const preview = { name: name || "?", color, kids, avatar }

  return (
    <Dialog
      title={isNew ? "Add a profile" : "Edit profile"}
      onClose={onClose}
      top={
        <div className="flex justify-center mb-4">
          {/* Tap the avatar to choose an actor's or director's photo */}
          <motion.button
            type="button"
            key={`${color}-${avatar}`}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            onClick={() => setStep("avatar")}
            className="group relative rounded-[25px] outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Choose an avatar"
          >
            <ProfileAvatar profile={preview} size={88} badge />
            <span className="absolute -right-2 -bottom-2 z-20 w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-card transition-transform group-hover:scale-110">
              <Pencil size={14} strokeWidth={2.5} />
            </span>
          </motion.button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          placeholder="Profile name"
          aria-label="Profile name"
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-center text-base font-medium outline-none transition-colors focus:border-primary/70 focus:bg-white/[0.08]"
        />

        <div className="flex justify-center gap-3 mt-5" role="radiogroup" aria-label="Colour">
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-offset-[3px] ring-offset-[#16161f] transition ${
                c === color ? "ring-white scale-110" : "ring-transparent hover:scale-105"
              }`}
              style={{ background: c }}
            >
              {c === color && <Check size={16} strokeWidth={3} />}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.08] divide-y divide-white/[0.08] overflow-hidden">
          <label className="flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors">
            <span className="flex-1">
              <span className="block text-sm font-medium">Kids profile</span>
              <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">Only movies rated G or PG, and TV-Y, TV-Y7 or TV-G shows.</span>
            </span>
            <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} className="sr-only peer" />
            <span className="relative w-11 h-6 shrink-0 rounded-full bg-white/15 peer-checked:bg-primary transition-colors after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60" />
          </label>

          <div className="flex items-center gap-4 px-4 py-3.5">
            <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${locked ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-gray-400"}`}>
              {locked ? <Lock size={16} /> : <Unlock size={16} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium">Profile lock</span>
              <span className="block text-xs text-gray-400 mt-0.5">{locked ? "A PIN is needed to open it." : "Anyone on this device can open it."}</span>
            </span>
            <span className="flex flex-col items-end gap-1 text-sm shrink-0">
              <button type="button" onClick={() => setStep("pin")} className="font-medium text-primary hover:underline">
                {locked ? "Change PIN" : "Add PIN"}
              </button>
              {locked && (
                <button type="button" onClick={() => setNewPin(null)} className="text-xs text-gray-400 hover:text-white">
                  Remove
                </button>
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:hover:translate-y-0">
            {isNew ? "Add profile" : "Save"}
          </button>
        </div>
        {!isNew && profile.id !== MAIN_ID && (
          <button
            type="button"
            onClick={() => setStep("delete")}
            className="w-full flex items-center justify-center gap-1.5 mt-4 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} /> Delete profile
          </button>
        )}
      </form>
    </Dialog>
  )
}

// Four-digit PIN entry. `create` asks twice; `onPin` returns false to reject (wrong PIN: the dots shake).
function PinDialog({
  title,
  profile,
  create = false,
  onPin,
  onClose,
}: {
  title: string
  profile?: Profile
  create?: boolean
  onPin: (pin: string) => Promise<boolean>
  onClose: () => void
}) {
  const [code, setCode] = useState("")
  const [first, setFirst] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [shakes, setShakes] = useState(0)

  const fail = (message: string) => {
    setCode("")
    setError(message)
    setShakes((n) => n + 1)
  }

  const submit = async (pin: string) => {
    if (create && first === null) {
      setFirst(pin)
      setCode("")
      setError("")
      return
    }
    if (create && pin !== first) {
      setFirst(null)
      return fail("The PINs didn't match. Try again.")
    }
    if (!(await onPin(pin))) fail("That's not the right PIN.")
  }

  return (
    <Dialog
      title={create && first !== null ? "Enter it again" : title}
      onClose={onClose}
      top={
        profile && (
          <div className="flex justify-center mb-4">
            <ProfileAvatar profile={profile} size={64} />
          </div>
        )
      }
    >
      {/* Not a password field: browsers would save the PIN as the site's password and fill it in by
          themselves (letting anyone through). A plain number field, hidden behind our own dots, instead. */}
      <label className="group block cursor-text">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          name="lumo-pin-digits"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          autoFocus
          value={code}
          maxLength={PIN_LENGTH}
          aria-label="PIN"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH)
            setCode(digits)
            if (error) setError("")
            if (digits.length === PIN_LENGTH) submit(digits)
          }}
          className="sr-only"
        />
        <motion.span
          key={shakes}
          className="flex justify-center gap-3"
          animate={shakes ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : undefined}
          transition={{ duration: 0.45 }}
          aria-hidden="true"
        >
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span
              key={i}
              className={`w-14 h-16 rounded-2xl bg-white/[0.06] border flex items-center justify-center transition-colors ${
                error ? "border-red-500/50" : i === code.length ? "border-white/10 group-focus-within:border-primary/80" : "border-white/10"
              }`}
            >
              {i < code.length && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 rounded-full bg-white" />
              )}
            </span>
          ))}
        </motion.span>
      </label>
      <p className={`text-sm mt-4 text-center ${error ? "text-red-400" : "text-gray-500"}`}>{error || `${PIN_LENGTH} digits`}</p>
    </Dialog>
  )
}
