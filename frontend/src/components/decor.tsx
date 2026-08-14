import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Music2, Music4 } from 'lucide-react'

const DEFAULT_WAVEFORM = [
  34, 52, 40, 66, 48, 74, 56, 84, 60, 46, 70, 52, 64, 78, 50, 38, 60, 44, 72, 56, 40, 62, 48, 68,
]

export function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 bg-noise opacity-[0.04]"
    />
  )
}

export function Dots({ className }: { className?: string }) {
  return <div aria-hidden="true" className={`pointer-events-none bg-dots ${className ?? ''}`} />
}

export function Wash({
  className,
  color = 'rgb(158 193 163 / 0.14)',
}: {
  className?: string
  color?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${className ?? ''}`}
      style={{ background: `linear-gradient(to bottom, ${color}, transparent 72%)` }}
    />
  )
}

export function Waveform({
  className,
  bars = DEFAULT_WAVEFORM,
  color = 'rgb(158 193 163 / 0.4)',
  pulse = false,
  duration = 2.6,
}: {
  className?: string
  bars?: number[]
  color?: string
  pulse?: boolean
  duration?: number
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none flex items-end gap-[3px] ${className ?? ''}`}>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          animate={pulse ? { scaleY: [1, 0.35, 1] } : undefined}
          transition={
            pulse
              ? { duration, repeat: Infinity, ease: 'easeInOut', delay: (i % 8) * 0.14 }
              : undefined
          }
          style={{ height: `${h}%`, background: color }}
          className="w-[3px] origin-bottom rounded-full"
        />
      ))}
    </div>
  )
}

export function GhostWord({ text, className }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none select-none font-bold uppercase leading-none text-outline ${className ?? ''}`}
    >
      {text}
    </span>
  )
}

export function OrbitRing({
  className,
  duration = 28,
  reverse = false,
}: {
  className?: string
  duration?: number
  reverse?: boolean
}) {
  return (
    <motion.div
      aria-hidden="true"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      className={`pointer-events-none absolute inset-0 rounded-full border border-dashed border-primary/30 ${className ?? ''}`}
    />
  )
}

export function MonoChip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-cousine text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

export function Wave({
  flip = false,
  fill = 'var(--background)',
  className,
}: {
  flip?: boolean
  fill?: string
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${flip ? 'bottom-0' : 'top-0'} ${className ?? ''}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        fill={fill}
        className="h-full w-full"
      >
        {flip ? (
          <path d="M0,120 L1440,120 L1440,72 C1240,112 1000,32 720,64 C440,96 200,112 0,72 Z" />
        ) : (
          <path d="M0,0 L1440,0 L1440,64 C1200,24 960,104 720,80 C480,56 240,24 0,64 Z" />
        )}
      </svg>
    </div>
  )
}

export function SecIndex({
  n,
  total = 3,
  className,
}: {
  n: number
  total?: number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute right-5 top-6 z-10 font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground/60 ${className ?? ''}`}
    >
      sec. 0{n} / 0{total}
    </span>
  )
}

export function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-dots opacity-60" />
      <Wash className="top-0 h-[45vh]" />
      <Waveform
        className="absolute bottom-12 left-1/2 h-16 w-[min(70vw,420px)] -translate-x-1/2 opacity-40"
        pulse
        duration={3.2}
      />
      <Music2 className="absolute right-10 top-24 h-8 w-8 text-primary/40" strokeWidth={1.5} />
      <Music4 className="absolute left-12 bottom-16 h-6 w-6 text-primary/30" strokeWidth={1.5} />
      <GhostWord text="huni" className="absolute -bottom-10 -left-6 text-[22vw]" />
      <div className="absolute inset-0 bg-noise opacity-[0.04]" />
    </div>
  )
}
