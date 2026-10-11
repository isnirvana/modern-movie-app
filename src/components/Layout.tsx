// src/components/Layout.tsx
import { ReactNode } from "react"
import NavBar from "./NavBar"
import { AnimatePresence, motion } from "framer-motion"
import { useLocation } from "react-router-dom"

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="bg-bg min-h-screen text-white">
      <NavBar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="pt-14"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
