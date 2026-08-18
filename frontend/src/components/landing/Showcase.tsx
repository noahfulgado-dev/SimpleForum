import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { AudioLines, Music2, Music4, Repeat, Shuffle, SkipBack, SkipForward, Play } from 'lucide-react'
import defaultAvatar from '../../assets/image/default_avatar.jpg'
import { Liked } from '../ui/like'
import { Bookmarked } from '../ui/bookmark'
import { Share } from '../ui/share'
import ReplyIcon from '../ui/reply'
import { Huni } from '../ui/huni'
import { Button } from '../ui/button'
import { GhostWord, Waveform } from '../decor'

function SwingPanel({
  x,
  viewport,
  children,
  className = '',
}: {
  x: MotionValue<number>
  viewport: number
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setPos({ left: el.offsetLeft, width: el.offsetWidth })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const center = useTransform(x, (v) => v + pos.left + pos.width / 2)
  const dist = useTransform(center, (c) => c - viewport / 2)
  const rotateY = useTransform(dist, (d) => -Math.max(-1, Math.min(1, d / 320)) * 18)
  const scale = useTransform(dist, (d) => 1 - Math.min(1, Math.abs(d) / 1100) * 0.12)
  const opacity = useTransform(dist, (d) => 1 - Math.min(1, Math.abs(d) / (viewport * 0.78)))

  return (
    <motion.div
      ref={ref}
      style={{
        rotateY,
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

function PostPanel({ progress }: { progress: MotionValue<number> }) {
  const imageY = useTransform(progress, [0, 1], [24, -24])

  return (
    <div className="w-[min(78vw,460px)] rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5">
      <div className="flex items-center gap-3">
        <img src={defaultAvatar} alt="" className="h-10 w-10 rounded-full border border-border object-cover" />
        <div className="min-w-0 flex-1">
          <p className="primary-font truncate text-sm font-medium text-foreground">huni_user</p>
          <p className="text-xs text-muted-foreground">2h ago</p>
        </div>
        <span className="text-muted-foreground">•••</span>
      </div>
      <h4 className="primary-font mt-4 text-lg font-semibold text-foreground">
        Slow mornings, warm coffee ☕
      </h4>
      <p className="tertiary-font mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
        There's nothing like a quiet corner with a good book and the sun coming in.
      </p>
      <div className="relative mt-4 h-40 overflow-hidden rounded-xl">
        <motion.div
          style={{ y: imageY }}
          className="absolute inset-0 bg-[linear-gradient(135deg,#9ec1a3_0%,#d8e6da_45%,#f0d9b5_100%)]"
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5 text-red-500">
          <Liked fillColor="#ef4444" /> 128
        </span>
        <span className="flex items-center gap-1.5">
          <ReplyIcon /> 24
        </span>
        <span className="flex items-center gap-1.5 text-amber-500">
          <Bookmarked fillColor="#eab308" /> 12
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Share /> 9
        </span>
      </div>
    </div>
  )
}

function ProfilePanel({ progress }: { progress: MotionValue<number> }) {
  const avatarY = useTransform(progress, [0, 1], [16, -16])

  return (
    <div className="w-[min(78vw,460px)] rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
      <div className="h-28 rounded-t-2xl bg-[linear-gradient(135deg,#9ec1a3_0%,#c9e0cd_55%,#f0d9b5_100%)]" />
      <div className="px-6 pb-6">
        <motion.img
          style={{ y: avatarY }}
          src={defaultAvatar}
          alt=""
          className="-mt-9 h-20 w-20 rounded-full border-4 border-card object-cover shadow-md"
        />
        <h4 className="primary-font mt-2 text-lg font-semibold text-foreground">huni_user</h4>
        <p className="text-xs text-muted-foreground">@huni_user · sharing the cozy life</p>
        <p className="mt-3 flex items-center gap-1.5 font-cousine text-[0.6rem] uppercase tracking-[0.2em] text-primary">
          <Music2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          now listening — slow mornings
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['12k', 'Followers'],
            ['148', 'Following'],
            ['9k', 'Hearts'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-primary/10 py-3">
              <p className="primary-font text-lg font-semibold text-foreground">{value}</p>
              <p className="text-[0.7rem] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {['lo-fi', 'jazz', 'cozy pop'].map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-cousine text-[0.55rem] uppercase tracking-[0.18em] text-primary"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlayerPanel({ progress }: { progress: MotionValue<number> }) {
  const artY = useTransform(progress, [0, 1], [24, -24])

  return (
    <div className="w-[min(78vw,460px)] rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5">
      <div className="flex items-center justify-between">
        <span className="font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-primary">
          now playing
        </span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
          <AudioLines className="h-3 w-3" strokeWidth={1.75} />
        </span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl">
        <motion.div
          style={{ y: artY }}
          className="relative flex h-44 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#9ec1a3_0%,#d8e6da_45%,#f0d9b5_100%)]"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-xl"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, #f0d9b5 0%, #f0d9b5 9%, #2d2a32 10%, #2d2a32 32%, #3a3a3f 33%, #2d2a32 37%, #3a3a3f 38%, #2d2a32 100%)',
            }}
          >
            <div className="absolute left-2 top-5 h-10 w-6 -rotate-[25deg] rounded-full bg-white/10" />
          </motion.div>
          <Music4 className="relative h-12 w-12 text-white/90" strokeWidth={1.25} />
        </motion.div>
      </div>

      <div className="mt-4">
        <h4 className="font-unna text-xl font-bold italic text-foreground">slow mornings</h4>
        <p className="font-cousine text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          huni_user · lo-fi
        </p>
      </div>

      <Waveform
        className="mt-4 h-5"
        bars={[30, 50, 40, 70, 55, 85, 60, 45, 65]}
        pulse
        duration={1.8}
        color="rgb(158 193 163 / 0.8)"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">01:24</span>
        <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">03:12</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Shuffle className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <SkipBack className="h-5 w-5 text-foreground" strokeWidth={1.75} />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
        </span>
        <SkipForward className="h-5 w-5 text-foreground" strokeWidth={1.75} />
        <Repeat className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
    </div>
  )
}

export function Showcase() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [viewport, setViewport] = useState(() => window.innerWidth)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 240, damping: 45, mass: 1 })
  const x = useTransform(smooth, [0, 1], [0, -offset])
  const readout = useTransform(smooth, (v) => {
    const idx = Math.min(5, Math.floor(v * 5) + 1)
    return `0${idx} / 05`
  })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const update = () => {
      const vw = window.innerWidth
      const children = Array.from(track.children) as HTMLElement[]
      const last = children[children.length - 1]
      const next = last ? Math.max(0, last.offsetLeft + last.offsetWidth / 2 - vw / 2) : 0
      setOffset(next)
      setViewport(vw)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <section ref={ref} className="relative h-[280vh]">
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden [perspective:1400px]">
        <GhostWord
          text="the feed"
          className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rotate-6 whitespace-nowrap text-[16vw]"
        />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full"
        >
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="relative flex w-max items-center gap-8 px-[6vw]"
          >
            {/* Intro panel */}
            <SwingPanel x={x} viewport={viewport}>
              <div className="w-[min(78vw,440px)] pr-4">
                <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                  Take a look
                </span>
                <h2 className="primary-font mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight text-foreground">
                  Where thoughts feel at home
                </h2>
                <p className="tertiary-font mt-4 max-w-sm font-light leading-relaxed text-muted-foreground">
                  Keep scrolling — the feed pans along, just like the real thing.
                </p>
                <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                  <div className="flex h-9 w-5 items-start justify-center rounded-full border border-muted-foreground/40 p-1">
                    <motion.div
                      animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  </div>
                  <span className="text-xs">Scroll to explore</span>
                </div>
              </div>
            </SwingPanel>

            <SwingPanel x={x} viewport={viewport}>
              <PostPanel progress={smooth} />
            </SwingPanel>
            <SwingPanel x={x} viewport={viewport}>
              <ProfilePanel progress={smooth} />
            </SwingPanel>
            <SwingPanel x={x} viewport={viewport}>
              <PlayerPanel progress={smooth} />
            </SwingPanel>

            {/* Outro panel */}
            <SwingPanel x={x} viewport={viewport}>
              <div className="flex w-[min(78vw,400px)] flex-col items-center justify-center gap-5 pl-4 text-center">
                <Huni className="h-12 w-auto" />
                <div>
                  <p className="font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-primary">
                    End of demo
                  </p>
                  <p className="primary-font mt-2 text-lg font-medium text-foreground">
                    Simple, cozy, yours.
                  </p>
                </div>
                <Link to="/signup">
                  <Button className="primary-font h-11 cursor-pointer px-7">Join the circle</Button>
                </Link>
              </div>
            </SwingPanel>
          </motion.div>
        </motion.div>

        {/* progress bar */}
        <div className="absolute bottom-10 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-muted">
          <motion.div
            style={{ scaleX: smooth }}
            className="h-full w-full origin-left rounded-full bg-primary"
          />
        </div>

        {/* mono readout */}
        <div className="absolute bottom-8 right-6 font-cousine text-sm text-muted-foreground sm:right-10">
          <motion.span>{readout}</motion.span>
        </div>
      </div>
    </section>
  )
}

export default Showcase
