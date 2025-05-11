export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-gray-700 h-64 rounded" />
      ))}
    </div>
  );
}
