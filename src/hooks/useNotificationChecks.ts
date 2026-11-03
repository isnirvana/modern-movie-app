// src/hooks/useNotificationChecks.ts
// App-wide side of notifications: keeps the worker's list current, asks for a check whenever the app
// comes to the front, clears the app-icon badge, and opens the title a tapped notification points at.
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { subscribeMyList } from "../utils/myList"
import { subscribe as subscribeHistory } from "../utils/watchHistory"
import { notificationsOn, notificationsSupported, registerBackgroundChecks, requestCheck, syncTracked } from "../utils/notifications"

export function useNotificationChecks() {
  // A ref, as `navigate` changes on every route change and this should only set up once
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useEffect(() => {
    if (!notificationsSupported()) return

    const onFront = () => {
      if (document.visibilityState !== "visible") return
      navigator.clearAppBadge?.().catch(() => {})
      if (notificationsOn()) syncTracked().then(() => requestCheck())
    }
    onFront()
    // Background checks need the app installed, which may have happened since they were turned on
    if (notificationsOn()) registerBackgroundChecks()

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "lumo:open" && typeof e.data.path === "string") navigateRef.current(e.data.path)
    }
    const sync = () => {
      if (notificationsOn()) syncTracked()
    }

    document.addEventListener("visibilitychange", onFront)
    navigator.serviceWorker.addEventListener("message", onMessage)
    const unsubList = subscribeMyList(sync)
    const unsubHistory = subscribeHistory(sync)
    return () => {
      document.removeEventListener("visibilitychange", onFront)
      navigator.serviceWorker.removeEventListener("message", onMessage)
      unsubList()
      unsubHistory()
    }
  }, [])
}
