export default function LoadingSkeleton() {
  return (
    <div className="px-6 md:px-12 py-10">
      {/* Fake section heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 rounded-full skeleton" />
        <div className="h-5 w-36 rounded-lg skeleton" />
      </div>
      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden skeleton" style={{ aspectRatio: "2/3" }} />
        ))}
      </div>
    </div>
  )
}
