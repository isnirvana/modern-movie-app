// src/components/NotificationsToggle.tsx
// Turns new-episode notifications on/off. Hidden where the browser can't show them (e.g. iPhone Safari outside the installed app).
import { useState } from "react"
import { Bell, BellOff, BellRing } from "lucide-react"
import { disableNotifications, enableNotifications, notificationsOn, notificationsSupported } from "../utils/notifications"

const HINT = "Get notified when shows in My List or Continue Watching get new episodes, and when movies in My List come out"

export default function NotificationsToggle() {
  const [on, setOn] = useState(notificationsOn)
  const [busy, setBusy] = useState(false)

  if (!notificationsSupported()) return null

  if (Notification.permission === "denied") {
    return (
      <span
        title="Notifications are blocked for this site. Allow them in your browser's site settings to turn them on."
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium glass text-gray-500 cursor-default"
      >
        <BellOff size={14} /> Notifications blocked
      </span>
    )
  }

  const toggle = async () => {
    setBusy(true)
    try {
      if (on) {
        await disableNotifications()
        setOn(false)
      } else {
        setOn(await enableNotifications())
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={HINT}
      aria-pressed={on}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
        on ? "bg-primary/20 text-white ring-1 ring-primary/40" : "glass text-gray-400 hover:text-white"
      }`}
    >
      {on ? <BellRing size={14} className="text-primary" /> : <Bell size={14} />}
      {on ? "Notifications on" : "Notify me"}
    </button>
  )
}
