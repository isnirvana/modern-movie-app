// src/components/MyListButton.tsx
// "+ My List" / "✓ In My List" toggle for detail pages
import { AnimatePresence, motion } from "framer-motion"
import { Plus, Check } from "lucide-react"
import { useInMyList } from "../hooks/useMyList"
import { addToMyList, removeFromMyList, type ListItem } from "../utils/myList"

type Props = {
  item: Omit<ListItem, "addedAt">
  className?: string
  iconSize?: number
}

export default function MyListButton({ item, className = "btn-secondary", iconSize = 16 }: Props) {
  const saved = useInMyList(item.type, item.id)

  return (
    <button
      onClick={() => (saved ? removeFromMyList(item.type, item.id) : addToMyList(item))}
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={saved ? "check" : "plus"}
          initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={`flex ${saved ? "text-primary" : ""}`}
        >
          {saved ? <Check size={iconSize} strokeWidth={2.6} /> : <Plus size={iconSize} strokeWidth={2.6} />}
        </motion.span>
      </AnimatePresence>
      {saved ? "In My List" : "My List"}
    </button>
  )
}
