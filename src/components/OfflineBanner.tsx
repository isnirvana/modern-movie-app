// src/components/OfflineBanner.tsx
// A pill under the nav bar while the device is offline: pages already visited still open from the cache
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { WifiOff } from "lucide-react"

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-16 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="glass flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-gray-200 shadow-card">
            <WifiOff size={14} className="text-accent" />
            You're offline · showing pages you've already visited
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
