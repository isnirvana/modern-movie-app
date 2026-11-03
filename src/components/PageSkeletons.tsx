// src/components/PageSkeletons.tsx
// Placeholders shaped like the pages they stand in for (the Home hero and rows, the For You spotlight),
// so content fills in where it's going to be instead of replacing a grid that looks like nothing on the page.

// The hero's text and buttons: rating pill, title, a few lines, Watch / Info
function HeroLines({ lines = 3 }: { lines?: number }) {
  return (
    <>
      <div className="h-6 w-20 rounded-full skeleton-bar" />
      <div className="space-y-2.5">
        <div className="h-9 md:h-14 w-4/5 md:w-[26rem] rounded-xl skeleton-bar" />
        <div className="h-9 md:h-14 w-1/2 md:w-60 rounded-xl skeleton-bar" />
      </div>
      <div className="space-y-2 max-w-md">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3.5 rounded-md skeleton-bar" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
        ))}
      </div>
      <div className="flex gap-3 pt-1">
        <div className="h-11 md:h-12 w-36 md:w-40 rounded-xl skeleton-bar" />
        <div className="h-11 md:h-12 w-28 md:w-36 rounded-xl skeleton-bar" />
      </div>
    </>
  )
}

// A row of poster cards (or wide cards, like Top picks), with its heading
export function RowSkeleton({ wide = false, count = 8 }: { wide?: boolean; count?: number }) {
  return (
    <div className="py-5 md:py-6" aria-hidden="true">
      <div className="flex items-center gap-3 px-5 md:px-12 mb-4">
        <span className="w-1 h-6 rounded-full skeleton" />
        <div className="h-5 w-40 md:w-52 rounded-md skeleton" />
      </div>
      <div className="flex gap-3 md:gap-4 overflow-hidden px-5 md:px-12">
        {Array.from({ length: count }).map((_, i) =>
          wide ? (
            <div key={i} className="flex-shrink-0 w-64 sm:w-72 md:w-80">
              <div className="aspect-video rounded-2xl skeleton" />
              <div className="h-3 w-2/3 rounded skeleton mt-3" />
            </div>
          ) : (
            <div key={i} className="flex-shrink-0 w-32 sm:w-36 md:w-44 rounded-2xl skeleton" style={{ aspectRatio: "2/3" }} />
          )
        )}
      </div>
    </div>
  )
}

// Home (and Kids Home) while the hero's titles load: the hero as HeroCarousel lays it out, then rows
export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      {/* Phones: square poster, text pulled up over its fade, slide dots */}
      <div className="md:hidden -mt-14">
        <div className="skeleton-hero aspect-square max-h-[72vh]">
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-bg via-bg/80 to-transparent" />
        </div>
        <div className="relative z-10 -mt-32 px-5 pb-5 space-y-3">
          <HeroLines lines={2} />
        </div>
        <div className="flex justify-center gap-2 pb-2">
          <span className="w-6 h-1.5 rounded-full skeleton-bar" />
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/15" />
          ))}
        </div>
      </div>

      {/* Desktop: the wide backdrop, text bottom-left */}
      <div className="hidden md:block relative -mt-14 h-[92vh] min-h-[520px] skeleton-hero">
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        <div className="absolute bottom-24 left-16 max-w-xl w-full space-y-5">
          <HeroLines />
        </div>
      </div>

      <div className="md:-mt-6 relative z-10">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  )
}

// For You's spotlight while the top pick is worked out: same box, badges, title, details, buttons
export function SpotlightSkeleton() {
  return (
    <div className="relative -mt-14 h-[78vh] min-h-[520px] max-h-[820px] skeleton-hero" aria-busy="true" aria-label="Loading">
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
      <div className="absolute inset-x-5 md:inset-x-12 bottom-8 md:bottom-14 max-w-3xl space-y-4">
        <div className="flex gap-2">
          <div className="h-7 w-32 rounded-full skeleton-bar" />
          <div className="h-7 w-24 rounded-full skeleton-bar" />
        </div>
        <div className="space-y-2.5">
          <div className="h-10 md:h-14 w-3/4 md:w-[28rem] rounded-xl skeleton-bar" />
          <div className="h-10 md:h-14 w-1/2 md:w-64 rounded-xl skeleton-bar" />
        </div>
        <div className="h-4 w-60 rounded-md skeleton-bar" />
        <div className="h-3.5 w-48 rounded-md skeleton-bar" />
        <div className="flex gap-2.5 md:gap-3 pt-1">
          <div className="h-11 md:h-12 flex-1 sm:flex-none sm:w-40 rounded-xl skeleton-bar" />
          <div className="h-11 md:h-12 w-12 sm:w-36 rounded-xl skeleton-bar" />
          <div className="h-11 md:h-12 w-28 sm:w-32 rounded-xl skeleton-bar" />
        </div>
      </div>
    </div>
  )
}
