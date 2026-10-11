// components/CardSkeleton.tsx
export default function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface-2" style={{ aspectRatio: "2/3" }}>
      <div className="w-full h-full skeleton" />
    </div>
  )
}
