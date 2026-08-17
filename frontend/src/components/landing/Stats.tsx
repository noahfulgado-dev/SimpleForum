import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import {
  Bell,
  Heart,
  Home,
  MessageCircle,
  Music2,
  Music4,
  Play,
  Search,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import defaultAvatar from '../../assets/image/default_avatar.jpg'
import { Dots, Wave, Waveform } from '../decor'
import { useIsMobile } from '../../hooks/useMediaQuery'

const TINT = 'rgba(158, 193, 163, 0.05)'

const LINES = [
  { text: 'A cozy corner', italic: false },
  { text: 'of the internet.', italic: true },
]

function WordReveal({
  text,
  className = '',
  delay = 0,
}: {
  text: string
  className?: string
  delay?: number
}) {
  const isMobile = useIsMobile()
  const chars = text.split('')
  return (
    <span className={className} role="text" aria-label={text}>
      {chars.map((char, i) =>
        char === ' ' ? (
          <span key={i} className="inline-block w-[0.28em]" />
        ) : (
          <span key={i} className="inline-block align-bottom">
            <motion.span
              className="inline-block origin-center"
              style={{ transformPerspective: isMobile ? 500 : 800 }}
              initial={
                isMobile
                  ? { scale: 0.4, z: -120, rotateX: 18, rotate: -2, opacity: 0 }
                  : { scale: 0.15, z: -320, rotateX: 35, rotate: -5, opacity: 0 }
              }
              whileInView={{ scale: 1, z: 0, rotateX: 0, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.7, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {char}
            </motion.span>
          </span>
        )
      )}
    </span>
  )
}

function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(220px circle at ${glareX}% ${glareY}%, rgb(158 193 163 / 0.16), transparent 70%)`

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * 16)
    rotateX.set((0.5 - py) * 16)
    glareX.set(px * 100)
    glareY.set(py * 100)
  }

  const onMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    glareX.set(50)
    glareY.set(50)
  }

  return { ref, rotateX, rotateY, glare, onMouseMove, onMouseLeave }
}

function TiltCard3D({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, rotateX, rotateY, glare, onMouseMove, onMouseLeave } = useTilt()

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`relative z-10 [transform-style:preserve-3d] ${className}`}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative rounded-2xl border border-border bg-card shadow-sm"
      >
        <motion.div
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        {children}
      </motion.div>
    </motion.div>
  )
}

function SwingPanelV({
  y,
  viewport,
  children,
  className = '',
}: {
  y: MotionValue<number>
  viewport: number
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setPos({ top: el.offsetTop, height: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const center = useTransform(y, (v) => v + pos.top + pos.height / 2)
  const dist = useTransform(center, (c) => c - viewport / 2)
  const rotateX = useTransform(dist, (d) => -Math.max(-1, Math.min(1, d / 320)) * 18)
  const scale = useTransform(dist, (d) => 1 - Math.min(1, Math.abs(d) / 1100) * 0.12)
  const opacity = useTransform(dist, (d) => 1 - Math.min(1, Math.abs(d) / (viewport * 0.78)))

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`shrink-0 ${className}`}
    >
      {children}
    </motion.div>
  )
}

function VinylDisc({ className = '' }: { className?: string }) {
  return (
    <div
      style={{ transform: 'translateZ(40px)' }}
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="relative h-full w-full rounded-full shadow-lg"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #f0d9b5 0%, #f0d9b5 10%, #2d2a32 11%, #2d2a32 34%, #3a3a3f 35%, #2d2a32 39%, #3a3a3f 40%, #2d2a32 100%)',
          }}
        />
        <div className="absolute left-[12%] top-[18%] h-[34%] w-[22%] -rotate-[25deg] rounded-full bg-white/10" />
      </motion.div>
    </div>
  )
}

function FloatingNote({ className = '' }: { className?: string }) {
  return (
    <div
      style={{ transform: 'translateZ(28px)' }}
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
    >
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-6, 6, -6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Music2 className="h-full w-full text-primary/50" strokeWidth={1.5} />
      </motion.div>
    </div>
  )
}

const FEED_POSTS = [
  {
    user: 'huni_user',
    time: '2h',
    text: 'Slow mornings, warm coffee — and a record that knows it. ☕',
    likes: 128,
    replies: 24,
  },
  {
    user: 'mica',
    time: '5h',
    text: 'Just found this lo-fi playlist. The whole feed feels cozy now.',
    likes: 96,
    replies: 18,
  },
  {
    user: 'theo',
    time: '1d',
    text: 'Track of the day: slow mornings. Again. It never gets old.',
    likes: 210,
    replies: 41,
  },
]

const STORIES = [{ name: 'huni' }, { name: 'mica' }, { name: 'theo' }, { name: 'aya' }]

const TRENDING = [
  { title: 'midnight jazz', grad: 'linear-gradient(135deg,#9ec1a3,#d8e6da)' },
  { title: 'lo-fi sleep', grad: 'linear-gradient(135deg,#f0d9b5,#e8c99a)' },
]

function DesktopMockup() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" aria-hidden="true" />
        <div className="ml-3 flex h-7 flex-1 items-center rounded-full bg-muted px-3">
          <span className="truncate font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
            hunispace.app
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr]">
        {/* feed column */}
        <div className="space-y-3 p-4">
          {FEED_POSTS.map((post) => (
            <div key={post.user} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <img src={defaultAvatar} alt="" className="h-6 w-6 rounded-full border border-border object-cover" />
                <p className="primary-font text-[0.65rem] font-medium text-foreground">{post.user}</p>
                <span className="ml-auto text-[0.55rem] text-muted-foreground">{post.time}</span>
              </div>
              <p className="tertiary-font mt-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
                {post.text}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[0.6rem] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" fill="#ef4444" strokeWidth={1.5} /> {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" strokeWidth={1.75} /> {post.replies}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* now playing sidebar */}
        <div className="flex flex-col items-center justify-center gap-3 border-l border-border bg-primary/[0.06] p-4">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)]">
            <Music4 className="h-8 w-8 text-white/90" strokeWidth={1.25} />
          </div>
          <div className="text-center">
            <p className="font-unna text-sm font-bold italic text-foreground">slow mornings</p>
            <p className="font-cousine text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
              huni radio
            </p>
          </div>
          <Waveform
            className="h-4 w-full"
            bars={[30, 50, 40, 70, 55, 85, 60, 45, 65]}
            pulse
            duration={1.8}
            color="rgb(158 193 163 / 0.8)"
          />
          <div className="flex items-center gap-3">
            <SkipBack className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="ml-0.5 h-3 w-3 fill-current" strokeWidth={0} />
            </span>
            <SkipForward className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <span className="font-cousine text-[0.45rem] tracking-widest text-muted-foreground">
            01:24 / 03:12
          </span>
        </div>
      </div>
    </div>
  )
}

function MobileMockup() {
  return (
    <div className="aspect-[9/19.5] w-full rounded-[3rem] border-8 border-foreground/80 bg-card p-2 shadow-2xl shadow-black/10">
      <div className="flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-background">
        {/* status bar */}
        <div className="relative flex shrink-0 items-center justify-between px-6 pt-4">
          <span className="font-cousine text-[0.6rem] text-foreground">9:41</span>
          <div
            className="absolute left-1/2 top-2.5 h-[18px] w-[84px] -translate-x-1/2 rounded-full bg-foreground/90"
            aria-hidden="true"
          />
          <span className="font-cousine text-[0.55rem] tracking-widest text-foreground" aria-hidden="true">
            ▂▄▆
          </span>
        </div>

        <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between px-1">
            <p className="primary-font text-lg font-bold text-foreground">huni</p>
            <Heart className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>

          {/* search bar */}
          <div className="mt-3 flex h-9 items-center gap-2 rounded-full border border-border bg-muted px-3.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <span className="truncate font-cousine text-[0.6rem] text-muted-foreground">
              search the cozy corner…
            </span>
          </div>

          {/* stories */}
          <div className="mt-3 flex items-center gap-3">
            {STORIES.map((s, i) => (
              <div key={s.name} className="flex flex-col items-center gap-1">
                <div className="rounded-full bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)] p-[2px]">
                  <img
                    src={defaultAvatar}
                    alt=""
                    className={`h-9 w-9 rounded-full border-2 border-background object-cover ${i > 0 ? 'opacity-80' : ''}`}
                  />
                </div>
                <span className="font-cousine text-[0.5rem] text-muted-foreground">{s.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-border p-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)]">
                <Music4 className="h-7 w-7 text-white/90" strokeWidth={1.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-unna text-base font-bold italic text-foreground">slow mornings</p>
                <p className="mt-0.5 font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                  lo-fi · now playing
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
              </span>
            </div>
            <Waveform
              className="mt-3 h-4"
              bars={[30, 50, 40, 70, 55]}
              pulse
              duration={1.6}
              color="rgb(158 193 163 / 0.8)"
            />
          </div>

          <div className="mt-3 rounded-2xl border border-border p-3">
            <div className="flex items-center gap-2.5">
              <img src={defaultAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
              <p className="primary-font text-sm font-medium text-foreground">huni_user</p>
              <span className="ml-auto font-cousine text-[0.55rem] text-muted-foreground">2h</span>
            </div>
            <p className="tertiary-font mt-1.5 text-[0.8rem] leading-relaxed text-muted-foreground">
              Quiet mornings hit different when the record's spinning. 🎵
            </p>
            <div className="mt-2 flex items-center gap-4 text-[0.7rem] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-red-500" fill="#ef4444" strokeWidth={1.5} /> 96
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} /> 18
              </span>
            </div>
          </div>

          {/* trending rail */}
          <p className="mt-3 px-1 font-cousine text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
            trending this week
          </p>
          <div className="mt-2 flex gap-2.5 overflow-hidden">
            {TRENDING.map((t) => (
              <div key={t.title} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border p-2">
                <div
                  className="h-8 w-8 shrink-0 rounded-lg"
                  style={{ background: t.grad }}
                  aria-hidden="true"
                />
                <p className="truncate font-unna text-[0.7rem] italic text-foreground">{t.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* tab bar */}
        <div className="mt-auto flex shrink-0 items-center justify-around border-t border-border px-5 py-3.5">
          <Home className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <Music2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          <Search className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

export function Stats() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [viewport, setViewport] = useState(() => window.innerHeight)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 240, damping: 45, mass: 1 })
  const y = useTransform(smooth, [0, 1], [0, -offset])
  const readout = useTransform(smooth, (v) => {
    const idx = Math.min(4, Math.floor(v * 4) + 1)
    return `0${idx} / 04`
  })
  const numeralY = useTransform(smooth, [0, 1], [24, -24])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const update = () => {
      const vh = window.innerHeight
      const children = Array.from(track.children) as HTMLElement[]
      const last = children[children.length - 1]
      const next = last ? Math.max(0, last.offsetTop + last.offsetHeight / 2 - vh / 2) : 0
      setOffset(next)
      setViewport(vh)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <section ref={ref} className="relative h-[560vh]">
      <div className="sticky top-0 flex h-[100dvh] flex-col overflow-hidden bg-primary/[0.05] [perspective:1400px]">
        <Wave className="top-0 z-20 h-[9vw] max-h-32" fill={TINT} />
        <Wave flip className="bottom-0 z-20 h-[9vw] max-h-32" fill={TINT} />
        <Dots className="absolute right-0 top-1/2 h-72 w-72 -translate-y-1/2 [mask-image:radial-gradient(circle,black_10%,transparent_65%)]" />

        {/* ghost numeral */}
        <motion.span
          style={{ y: numeralY }}
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-8 z-0 select-none font-unna text-[clamp(8rem,14vw,13rem)] font-bold italic leading-none text-outline opacity-70"
        >
          02
        </motion.span>

        {/* vertical edge label */}
        <div className="pointer-events-none absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 rotate-90 lg:block">
          <span className="font-cousine text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">
            the cozy report — est. 2026
          </span>
        </div>

        {/* track */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 h-full"
        >
          <motion.div
            ref={trackRef}
            style={{ y }}
            className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-24 pb-[22vh] pt-[22vh]"
          >
            {/* Panel 1 — intro */}
            <SwingPanelV y={y} viewport={viewport}>
              <div className="w-[min(88vw,560px)] text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" aria-hidden="true" />
                  <span className="font-cousine text-[0.7rem] uppercase tracking-[0.3em] text-foreground">
                    the cozy report
                  </span>
                  <span className="h-px w-16 bg-border" aria-hidden="true" />
                  <span className="font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                    Nº 003 · est. 2026
                  </span>
                </div>

                <h2 className="primary-font mt-6 text-[clamp(2.6rem,6.5vw,5rem)] font-bold leading-[1.04] text-foreground">
                  {LINES.map((line) => (
                    <span key={line.text} className="block overflow-hidden pb-1">
                      <motion.span
                        className={`block ${line.italic ? 'font-unna text-[1.15em] font-bold italic text-primary' : ''}`}
                        initial={{ y: '110%' }}
                        whileInView={{ y: '0%' }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {line.text}
                      </motion.span>
                    </span>
                  ))}
                </h2>

                <p className="tertiary-font mx-auto mt-5 max-w-md font-light leading-relaxed text-muted-foreground">
                  A space that grows{' '}
                  <span className="font-unna italic text-foreground">one kind word</span> at a time.
                </p>

                <p className="mt-6 font-cousine text-xs text-muted-foreground">
                  * no ads, no noise — just good company.
                </p>
              </div>
            </SwingPanelV>

            {/* Panel 2 — cozy. */}
            <SwingPanelV y={y} viewport={viewport}>
              <div className="w-[min(92vw,960px)] text-center">
                <p className="font-cousine text-[0.7rem] uppercase tracking-[0.35em] text-primary">
                  cozy, certified snug
                </p>
                <div className="relative mt-4 flex items-center justify-center [transform-style:preserve-3d]">
                  <motion.div
                    aria-hidden="true"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[clamp(18rem,50vw,36rem)] w-[clamp(18rem,50vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/25"
                  />
                  <WordReveal
                    text="cozy."
                    className="relative font-unna text-[clamp(5.5rem,22vw,19rem)] font-bold italic leading-none text-primary"
                  />
                </div>
                <p className="mt-6 font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                  verified daily
                </p>
              </div>
            </SwingPanelV>

            {/* Panel 3 — share. */}
            <SwingPanelV y={y} viewport={viewport}>
              <div className="flex w-[min(92vw,960px)] flex-col items-center gap-8 text-center">
                <WordReveal
                  text="share."
                  className="font-geist text-[clamp(5.5rem,20vw,17.5rem)] font-bold leading-none text-foreground"
                />
                <p className="font-cousine text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                  a cozy corner of the internet
                </p>
                <div className="w-full max-w-md border-t border-dashed border-border pt-4">
                  <p className="font-cousine text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                    report nº 003 — signed,
                  </p>
                  <p className="mt-1 font-unna text-base normal-case italic tracking-normal text-primary">
                    the huni team
                  </p>
                </div>
              </div>
            </SwingPanelV>

            {/* Panel 4 — desktop + mobile mockups side by side */}
            <SwingPanelV y={y} viewport={viewport}>
              <div className="relative flex w-[min(92vw,960px)] flex-col items-center justify-center gap-10 [transform-style:preserve-3d] lg:flex-row lg:gap-14">
                <VinylDisc className="left-[-2rem] top-[-2rem] h-20 w-20 lg:left-[-3rem] lg:top-[-3rem] lg:h-24 lg:w-24" />
                <FloatingNote className="left-[-2rem] top-1/3 hidden h-7 w-7 lg:block" />
                <div className="relative w-[min(80vw,560px)]">
                  <TiltCard3D className="w-full">
                    <DesktopMockup />
                  </TiltCard3D>
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-[min(60vw,300px,34vh)]"
                >
                  <TiltCard3D className="w-full">
                    <MobileMockup />
                  </TiltCard3D>
                </motion.div>
                <FloatingNote className="bottom-14 right-[-2.25rem] h-6 w-6" />
                <FloatingNote className="bottom-20 left-[-2rem] h-5 w-5 lg:hidden" />
              </div>
            </SwingPanelV>
          </motion.div>
        </motion.div>

        {/* vertical progress bar */}
        <div className="absolute right-6 top-1/2 z-30 hidden h-40 w-1 -translate-y-1/2 overflow-hidden rounded-full bg-muted sm:block">
          <motion.div
            style={{ scaleY: smooth }}
            className="h-full w-full origin-top rounded-full bg-primary"
          />
        </div>

        {/* mono readout */}
        <div className="absolute bottom-8 right-6 z-30 font-cousine text-sm text-muted-foreground">
          <motion.span>{readout}</motion.span>
        </div>
      </div>
    </section>
  )
}

export default Stats
