// src/components/Layout.tsx
import { ReactNode } from "react"
import NavBar from "./NavBar"
import Footer from "./Footer"
import BottomNav from "./BottomNav"
import { AnimatePresence, motion } from "framer-motion"
import { useLocation } from "react-router-dom"

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="bg-bg min-h-screen text-white">
      <NavBar />
      {/* Start each new page at the top once the old one has faded out */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          // Leave room for the mobile tab bar (+ the phone's home-indicator area)
          className="pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
        >
          {children}
          <Footer />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
