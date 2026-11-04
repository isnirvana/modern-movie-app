// src/components/UpdateToast.tsx
// "A new version of Lumo is ready": shown once an update has downloaded and taken over (sw.ts takes over straight
// away), so viewers get it now instead of at some later launch. Only a tap reloads, never on its own, so nobody is
// cut off mid-film (it sits under the player, so it's seen after closing it).
// Also asks for updates whenever the app comes back to the front: iPhones resume Home Screen apps instead of
// restarting them, so the usual check on launch rarely happens there.
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RefreshCw, X } from "lucide-react"

// Coming back to the front checks for an update at most this often
const CHECK_EVERY_MS = 30 * 60 * 1000

export default function UpdateToast() {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const sw = navigator.serviceWorker
    // Only an update counts: a first visit's install takes over the page too
    const updating = !!sw.controller
    const onTakeOver = () => updating && setReady(true)
    sw.addEventListener("controllerchange", onTakeOver)

    let lastCheck = Date.now()
    const onFront = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastCheck < CHECK_EVERY_MS) return
      lastCheck = Date.now()
      sw.getRegistration().then((reg) => reg?.update()).catch(() => {})
    }
    document.addEventListener("visibilitychange", onFront)

    return () => {
      sw.removeEventListener("controllerchange", onTakeOver)
      document.removeEventListener("visibilitychange", onFront)
    }
  }, [])

  return (
    <AnimatePresence>
      {ready && !dismissed && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          // Above the phone tab bar; under the player and dialogs
          className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6"
        >
          <div
            className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl shadow-card max-w-md w-full sm:w-auto"
            style={{ background: "rgba(22,22,31,0.96)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
          >
            <span className="w-8 h-8 shrink-0 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <RefreshCw size={15} />
            </span>
            <p className="flex-1 min-w-0 text-sm text-gray-200">A new version of Lumo is ready</p>
            <button
              onClick={() => window.location.reload()}
              className="shrink-0 px-4 py-2 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Not now"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
