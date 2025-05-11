// import { ReactNode, useState, useEffect } from 'react';
// import NavBar from './NavBar';
// import SideDrawer from './SideDrawer';
// import { AnimatePresence, motion } from 'framer-motion';

// export default function Layout({ children }: { children: ReactNode }) {
//   // control side-drawer open state
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   // listen for hamburger click
//   useEffect(() => {
//     const btn = document.getElementById('hamburger');
//     btn?.addEventListener('click', () => setDrawerOpen(o => !o));
//   }, []);

//   return (
//     <div>
//       <NavBar />
//       <SideDrawer open={drawerOpen} />
//       <AnimatePresence mode="wait">
//         <motion.main
//           key={location.pathname}
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -10 }}
//           transition={{ duration: 0.3 }}
//           className="p-4 min-h-screen"
//         >
//           {children}
//         </motion.main>
//       </AnimatePresence>
//     </div>
//   );
// }

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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="px-6 py-4"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
