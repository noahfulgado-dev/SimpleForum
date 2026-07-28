export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export function TopicCardSkeleton() {
  return (
    <div className="rounded-[10px] p-0 min-h-[100px] bg-card border border-border/50 overflow-hidden max-w-[700px] w-full self-center">
      <div className="p-7 pb-2 flex flex-row gap-5">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md mt-0.5" />
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-3 items-start pt-1">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        </div>
      </div>
      <div className="px-7">
        <Skeleton className="h-5 w-3/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md mt-1" />
        <Skeleton className="h-4 w-4/5 rounded-md mt-0.5" />
      </div>
      <div className="flex flex-row gap-4 px-7 mt-2 pb-4">
        <Skeleton className="h-7 w-16 rounded-[5px]" />
        <Skeleton className="h-7 w-16 rounded-[5px]" />
      </div>
    </div>
  )
}

export function TopicDetailSkeleton() {
  return (
    <div className="rounded-[10px] p-0 min-h-[100px] bg-card border border-border/50 overflow-hidden w-full">
      <div className="p-7 pb-2 flex flex-row gap-5">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3 w-36 rounded-md mt-0.5" />
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-3 items-start pt-1">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        </div>
      </div>
      <div className="px-7">
        <Skeleton className="h-5 w-3/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md mt-1" />
        <Skeleton className="h-4 w-4/5 rounded-md mt-0.5" />
      </div>
      <div className="flex flex-row gap-4 px-7 mt-2 pb-4">
        <Skeleton className="h-7 w-16 rounded-[5px]" />
        <Skeleton className="h-7 w-16 rounded-[5px]" />
      </div>
    </div>
  )
}

export function ReplySkeleton() {
  return (
    <div className="flex flex-row gap-3 px-1">
      <Skeleton className="w-8 h-8 rounded-full shrink-0 mt-0.5" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/5 rounded-md" />
        <div className="flex items-center gap-1 mt-0.5">
          <Skeleton className="h-6 w-12 rounded-[5px]" />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="[grid-area:main] mt-8 space-y-6 w-full max-w-[900px]">
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col p-6 gap-3">
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
            <Skeleton className="h-7 w-44 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4 rounded-md shrink-0" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-16 rounded-md mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border gap-1.5">
            <Skeleton className="h-7 w-10 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border gap-1.5">
            <Skeleton className="h-7 w-10 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border gap-1.5">
            <Skeleton className="h-7 w-10 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
