// src/pages/ProfilesPage.tsx
// "Who's watching?": switch profiles, and add / edit / delete them (Manage profiles).
// A profile with a lock asks for its PIN before it opens, or before it's edited from another profile.
// Kids profiles can't manage profiles: that's done from a grown-up one (lock those to keep kids out).
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Lock, Pencil, Plus, Settings2, Trash2 } from "lucide-react"
import ProfileAvatar from "../components/ProfileAvatar"
import { useProfiles } from "../hooks/useProfiles"
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

export default function ProfilesPage() {
  const { list, active } = useProfiles()
  const navigate = useNavigate()
  const [managing, setManaging] = useState(false)
  const [editing, setEditing] = useState<Profile | "new" | null>(null)
  // Profiles whose PIN was entered on this visit (the one in use counts as open)
  const [unlocked, setUnlocked] = useState(() => new Set([active]))
  // A locked profile waiting for its PIN, and what to do once it's entered
  const [asking, setAsking] = useState<{ profile: Profile; then: () => void } | null>(null)

  const inKids = list.find((p) => p.id === active)?.kids ?? false

  // Runs `then` now, or after the profile's PIN if it's locked
  const withPin = (profile: Profile, then: () => void) =>
    !profile.pin || unlocked.has(profile.id) ? then() : setAsking({ profile, then })

  const pick = (p: Profile) => {
    if (managing) return withPin(p, () => setEditing(p))
    if (p.id === active) return navigate("/")
    withPin(p, () => switchProfile(p.id))
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-5 py-12">
      <h1 className="section-heading text-3xl md:text-4xl text-center">{managing ? "Manage profiles" : "Who's watching?"}</h1>
      <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
        {managing ? "Tap a profile to edit it." : "Each profile has its own My List, Continue Watching and recommendations."}
      </p>

      <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-10 max-w-3xl">
        {list.map((p) => (
          <button key={p.id} onClick={() => pick(p)} className="group flex flex-col items-center gap-3 w-24">
            <span className="relative">
              <ProfileAvatar
                profile={p}
                size={96}
                badge
                className={`ring-2 ring-offset-4 ring-offset-bg transition-shadow ${
                  p.id === active && !managing ? "ring-white/80" : "ring-transparent group-hover:ring-white/40"
                }`}
              />
              {managing && (
                <span className="absolute inset-0 rounded-[27px] bg-black/55 flex items-center justify-center">
                  <Pencil size={26} />
                </span>
              )}
              {p.pin && (
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-bg border border-white/15 flex items-center justify-center" title="Locked">
                  <Lock size={13} className="text-gray-300" />
                </span>
              )}
            </span>
            <span className="text-sm text-gray-300 group-hover:text-white truncate max-w-full">{p.name}</span>
          </button>
        ))}

        {!inKids && list.length < MAX_PROFILES && (
          <button onClick={() => setEditing("new")} className="group flex flex-col items-center gap-3 w-24">
            <span className="w-24 h-24 rounded-[27px] border-2 border-dashed border-white/20 group-hover:border-white/50 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
              <Plus size={32} />
            </span>
            <span className="text-sm text-gray-400 group-hover:text-white">Add profile</span>
          </button>
        )}
      </div>

      {inKids ? (
        <p className="text-xs text-gray-500 mt-12 text-center max-w-xs">Profiles can be managed from a grown-up profile.</p>
      ) : (
        <button
          onClick={() => setManaging((m) => !m)}
          className={`${managing ? "btn-primary" : "btn-secondary"} mt-12`}
        >
          {managing ? <><Check size={16} /> Done</> : <><Settings2 size={16} /> Manage profiles</>}
        </button>
      )}

      <AnimatePresence>
        {editing && <ProfileEditor key="editor" profile={editing} activeId={active} onClose={() => setEditing(null)} />}
        {asking && (
          <PinDialog
            key="pin-check"
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

// --- Dialogs ---

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl p-6 shadow-card"
        style={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)" }}
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="section-heading text-lg mb-5">{title}</h2>
        {children}
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
  // Lock changes wait for Save: undefined = unchanged, null = remove the lock, a string = the new PIN
  const [newPin, setNewPin] = useState<string | null | undefined>(undefined)
  const [step, setStep] = useState<"form" | "pin" | "delete">("form")

  const locked = newPin === undefined ? !isNew && !!profile.pin : newPin !== null

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = isNew ? addProfile(trimmed, kids, color).id : profile.id
    if (!isNew) updateProfile(id, { name: trimmed, color, kids })
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
      <Dialog title={`Delete ${profile.name}?`} onClose={onClose}>
        <p className="text-sm text-gray-400">Their My List, Continue Watching and searches will be removed from this device.</p>
        <div className="flex gap-2 mt-6">
          <button
            onClick={remove}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button onClick={() => setStep("form")} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog title={isNew ? "Add profile" : "Edit profile"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="flex items-center gap-4">
          <ProfileAvatar profile={{ id: "", name: name || "?", color, kids }} size={56} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
            placeholder="Name"
            aria-label="Profile name"
            className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
        </div>

        <div className="flex gap-2.5 mt-5" role="radiogroup" aria-label="Color">
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-[#16161f] ${c === color ? "ring-white" : "ring-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <label className="flex items-start gap-3 mt-6 cursor-pointer">
          <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} className="sr-only peer" />
          <span className="relative mt-0.5 w-10 h-6 shrink-0 rounded-full bg-white/15 peer-checked:bg-primary transition-colors after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60" />
          <span>
            <span className="block text-sm font-medium">Kids profile</span>
            <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">
              Only movies rated G or PG and shows rated TV-Y, TV-Y7 or TV-G.
            </span>
          </span>
        </label>

        <div className="flex items-start gap-3 mt-5">
          <Lock size={18} className={`mt-0.5 shrink-0 ${locked ? "text-primary" : "text-gray-500"}`} />
          <div className="flex-1">
            <span className="block text-sm font-medium">Profile lock {locked ? "· On" : "· Off"}</span>
            <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">
              {locked ? "A PIN is needed to open or edit this profile." : "Anyone on this device can open this profile."}
            </span>
            <div className="flex gap-3 mt-2 text-sm">
              <button type="button" onClick={() => setStep("pin")} className="text-primary hover:underline">
                {locked ? "Change PIN" : "Add a PIN"}
              </button>
              {locked && (
                <button type="button" onClick={() => setNewPin(null)} className="text-gray-400 hover:text-white">
                  Remove lock
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-7">
          <button type="submit" disabled={!name.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
        {!isNew && profile.id !== MAIN_ID && (
          <button
            type="button"
            onClick={() => setStep("delete")}
            className="w-full flex items-center justify-center gap-1.5 mt-4 text-sm text-gray-400 hover:text-red-400"
          >
            <Trash2 size={14} /> Delete profile
          </button>
        )}
      </form>
    </Dialog>
  )
}

// Four-digit PIN entry. `create` asks twice; `onPin` returns false to reject (wrong PIN).
function PinDialog({
  title,
  create = false,
  onPin,
  onClose,
}: {
  title: string
  create?: boolean
  onPin: (pin: string) => Promise<boolean>
  onClose: () => void
}) {
  const [code, setCode] = useState("")
  const [first, setFirst] = useState<string | null>(null)
  const [error, setError] = useState("")

  const submit = async (pin: string) => {
    if (create && first === null) {
      setFirst(pin)
      setCode("")
      setError("")
      return
    }
    if (create && pin !== first) {
      setFirst(null)
      setCode("")
      setError("The PINs didn't match. Try again.")
      return
    }
    if (!(await onPin(pin))) {
      setCode("")
      setError("That's not the right PIN.")
    }
  }

  return (
    <Dialog title={create && first !== null ? "Enter it again" : title} onClose={onClose}>
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
            if (digits.length === PIN_LENGTH) submit(digits)
          }}
          className="sr-only"
        />
        <span className="flex justify-center gap-3" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span
              key={i}
              className={`w-12 h-14 rounded-xl bg-white/[0.06] border flex items-center justify-center transition-colors ${
                i === code.length ? "border-white/10 group-focus-within:border-primary/70" : "border-white/10"
              }`}
            >
              {i < code.length && <span className="w-3 h-3 rounded-full bg-white" />}
            </span>
          ))}
        </span>
      </label>
      <p className={`text-xs mt-3 text-center ${error ? "text-red-400" : "text-gray-500"}`}>
        {error || `${PIN_LENGTH} digits`}
      </p>
    </Dialog>
  )
}
