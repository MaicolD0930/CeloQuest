function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-h-background/80 ring-1 ring-h-border/50 ${className}`}
    />
  );
}

export function HomePageSkeleton() {
  return (
    <main className="home-perfil flex min-h-dvh flex-1 flex-col px-4 pb-20 safe-top-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Bone className="size-12 rounded-2xl" />
          <div className="space-y-2">
            <Bone className="h-2 w-16" />
            <Bone className="h-5 w-28" />
          </div>
        </div>
        <Bone className="size-9 rounded-xl" />
      </div>
      <Bone className="mt-4 h-28 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Bone className="h-20 rounded-2xl" />
        <Bone className="h-20 rounded-2xl" />
        <Bone className="h-20 rounded-2xl" />
      </div>
      <Bone className="mt-4 h-10 w-full rounded-2xl" />
      <Bone className="mt-2 h-16 w-full rounded-2xl" />
      <Bone className="mt-4 min-h-[12rem] flex-1 rounded-3xl" />
    </main>
  );
}

export function LeaderboardSkeleton() {
  return (
    <main className="home-perfil flex min-h-dvh flex-1 flex-col px-4 pb-24 safe-top-sm">
      <div className="flex items-start justify-between">
        <Bone className="h-8 w-32" />
        <Bone className="size-9 rounded-xl" />
      </div>
      <Bone className="mt-4 h-10 w-full rounded-2xl" />
      <Bone className="mt-4 h-40 w-full rounded-[1.75rem]" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}

export function ChallengeSkeleton() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-h-background px-4 safe-top">
      <div className="mb-4 flex items-center gap-2">
        <Bone className="h-3 min-w-0 flex-1 rounded-full" />
        <Bone className="h-6 w-10 rounded-lg" />
      </div>
      <Bone className="h-6 w-24 rounded-full" />
      <Bone className="mt-4 h-8 w-full" />
      <Bone className="mt-2 h-8 w-4/5" />
      <div className="mt-6 flex flex-1 flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}

export function ProgressPageSkeleton() {
  return (
    <main className="home-perfil flex min-h-dvh flex-1 flex-col px-4 pb-24 safe-top-sm">
      <Bone className="h-8 w-40" />
      <Bone className="mt-4 h-36 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Bone className="h-20 rounded-2xl" />
        <Bone className="h-20 rounded-2xl" />
        <Bone className="h-20 rounded-2xl" />
      </div>
      <Bone className="mt-6 h-6 w-48" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
