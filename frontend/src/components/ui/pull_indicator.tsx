import { Loader2, ChevronDown } from 'lucide-react'

interface PullIndicatorProps {
  pull: number
  refreshing: boolean
}

const TRIGGER = 70

export function PullIndicator({ pull, refreshing }: PullIndicatorProps) {
  const progress = Math.min(pull / TRIGGER, 1)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-lg shadow-black/5"
        style={{
          transform: `translateY(${refreshing ? 14 : pull}px)`,
          opacity: refreshing || pull > 0 ? 1 : 0,
        }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={1.75} />
        ) : (
          <ChevronDown
            className="h-5 w-5 text-muted-foreground transition-transform"
            strokeWidth={1.75}
            style={{ transform: `rotate(${-180 * progress}deg)` }}
          />
        )}
      </div>
      {refreshing && (
        <span className="absolute top-14 font-cousine text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          refreshing
        </span>
      )}
    </div>
  )
}
