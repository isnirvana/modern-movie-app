// components/CardSkeleton.tsx
export default function CardSkeleton() {
  return (
    <div className="bg-surface rounded-lg overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="relative w-full aspect-[2/3] bg-gray-700" />

      {/* Text placeholder */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-600 rounded w-3/4" />
        <div className="h-3 bg-gray-600 rounded w-1/2" />
      </div>
    </div>
  )
}
