// src/components/Layout.tsx
import { ReactNode, Suspense, useEffect, useLayoutEffect, useRef } from "react"
import NavBar from "./NavBar"
import Footer from "./Footer"
import BottomNav from "./BottomNav"
import OfflineBanner from "./OfflineBanner"
import UpdateToast from "./UpdateToast"
import LoadingSkeleton from "./LoadingSkeleton"
import { SpotlightSkeleton } from "./PageSkeletons"
import { motion } from "framer-motion"
import { useLocation, useNavigationType } from "react-router-dom"
import { useNotificationChecks } from "../hooks/useNotificationChecks"

// Where each visited page was scrolled to, by history entry (for Back / Forward)
const scrollPositions = new Map<string, number>()

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  useNotificationChecks()

  // A new page starts at the top, in the same frame it appears; Back and Forward ("POP") return to where
  // that page was left. Done here rather than by the browser, which restores before the page has re-rendered.
  const currentKey = useRef(location.key)
  useLayoutEffect(() => {
    currentKey.current = location.key
    window.scrollTo(0, navigationType === "POP" ? scrollPositions.get(location.key) ?? 0 : 0)
  }, [location.key, navigationType])
  useEffect(() => {
    history.scrollRestoration = "manual"
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => scrollPositions.set(currentKey.current, window.scrollY))
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Accounts & sync load after the first screen (the Supabase client is a sizeable download)
  useEffect(() => {
    import("../utils/sync").then((sync) => sync.startSync())
  }, [])

  // "Who's watching?" is a screen of its own, like the streaming apps': just the logo, no tabs, links or footer
  const gate = location.pathname === "/profiles"

  return (
    <div className="bg-bg min-h-screen text-white">
      <NavBar minimal={gate} />
      <OfflineBanner />
      {/* Leave room for the mobile tab bar (+ the phone's home-indicator area) */}
      <main className={gate ? "pt-14" : "pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"}>
        {/* One boundary for every page, so a page whose code is still loading keeps the current page up
            (navigations are transitions, main.tsx) rather than showing the placeholder. The new page
            then just fades in: no fade-out first, no slide, nothing blank in between. */}
        {/* (Only seen when a page is opened directly and its code isn't in yet) */}
        <Suspense fallback={location.pathname === "/for-you" ? <SpotlightSkeleton /> : <LoadingSkeleton />}>
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: "easeOut" }}>
            {children}
          </motion.div>
        </Suspense>
        {!gate && <Footer />}
      </main>
      {!gate && <BottomNav />}
      <UpdateToast />
    </div>
  )
}
