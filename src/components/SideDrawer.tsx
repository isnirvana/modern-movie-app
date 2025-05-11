import { Link } from "react-router-dom"
import GenreDropdown from "./GenreDropdown"

// export default function SideDrawer({ open }: { open: boolean }) {
//   if (!open) return null
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
//       <div className="bg-gray-900 w-64 h-full p-4">
//         <Link to="/" className="block mb-2">
//           Trending
//         </Link>
//         {/* reuse dropdown */}
//         <div className="mt-4">
//           <GenreDropdown />
//         </div>
//       </div>
//     </div>
//   )
// }

const SideDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null // Don't render the drawer if it's not open

  return (
    <div className="fixed top-0 left-0 w-64 h-full bg-gray-900 z-50">
      <button onClick={onClose}>Close</button> {/* Close button */}
      <GenreDropdown />
      {/* You can add more content here */}
    </div>
  )
}

export default SideDrawer
