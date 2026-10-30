// src/components/Layout.tsx
import { ReactNode } from "react"
import NavBar from "./NavBar"
import Footer from "./Footer"
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
          className="pt-14"
        >
          {children}
          <Footer />
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
