export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export function TopicCardSkeleton() {
  return (
    <div className="border border-border rounded-[10px] p-7 flex flex-row gap-5 bg-card w-full">
      <div className="w-full flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex flex-col">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md mt-0.5" />
          </div>
        </div>
        <div>
          <Skeleton className="h-5 w-3/5 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md mt-1" />
          <Skeleton className="h-4 w-4/5 rounded-md mt-0.5" />
        </div>
        <div className="flex flex-row gap-4 mt-2">
          <Skeleton className="h-7 w-16 rounded-[5px]" />
          <Skeleton className="h-7 w-16 rounded-[5px]" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
    </div>
  )
}

export function TopicDetailSkeleton() {
  return (
    <>
      <div className="flex flex-row gap-3 items-start">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3 w-36 rounded-md mt-0.5" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          </div>
        </div>
      </div>
      <div>
        <Skeleton className="h-5 w-3/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md mt-1" />
        <Skeleton className="h-4 w-4/5 rounded-md mt-0.5" />
      </div>
      <div className="flex flex-row gap-4">
        <Skeleton className="h-7 w-16 rounded-[5px]" />
        <Skeleton className="h-7 w-16 rounded-[5px]" />
      </div>
    </>
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
    <div className="w-fit mx-auto mt-8 space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-7 w-44 rounded-md" />
            <Skeleton className="h-4 w-60 rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
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
