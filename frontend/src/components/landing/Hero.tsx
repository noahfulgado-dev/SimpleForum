import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useTransform, useSpring, useMotionValue, type Variants } from 'motion/react'
import { Music, Music4, SkipBack, SkipForward, Play } from 'lucide-react'
import { Button } from '../ui/button'
import { Huni } from '../ui/huni'
import { GhostWord, MonoChip, OrbitRing, Wash, Waveform } from '../decor'
import { useSmoothScrollProgress } from '../../lib/useSmoothScroll'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 44, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

const NOTES = [
  { wrap: 'left-[8%] top-[16%]', size: 'h-7 w-7', dur: 6 },
  { wrap: 'right-[7%] top-[26%]', size: 'h-9 w-9', dur: 7.5 },
  { wrap: 'left-[14%] bottom-[32%]', size: 'h-6 w-6', dur: 6.8 },
]

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { smooth } = useSmoothScrollProgress({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(smooth, [0, 1], [0, 220])
  const rotateX = useTransform(smooth, [0, 1], [0, 18])
  const scale = useTransform(smooth, [0, 1], [1, 0.92])
  const opacity = useTransform(smooth, [0, 0.7], [1, 0])
  const cueOpacity = useTransform(smooth, [0, 0.18], [1, 0])
  const floorRotate = useTransform(smooth, [0, 1], [62, 80])
  const floorY = useTransform(smooth, [0, 1], [0, 170])
  const markY = useTransform(smooth, [0, 1], [0, -120])
  const waveY = useTransform(smooth, [0, 1], [0, 90])
  const noteY0 = useTransform(smooth, [0, 1], [0, -140])
  const noteY1 = useTransform(smooth, [0, 1], [0, -200])
  const noteY2 = useTransform(smooth, [0, 1], [0, -110])

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotY = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 120, damping: 18 })
  const rotX = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 120, damping: 18 })

  const handleMouse = (e: React.MouseEvent<HTMLElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
  }

  const noteYs = [noteY0, noteY1, noteY2]

  return (
    <section
      ref={ref}
      onMouseMove={handleMouse}
      className="relative h-[100svh] overflow-hidden bg-background"
    >
      {/* soft top light */}
      <Wash className="top-0 z-0 h-[50vh]" />

      {/* 3D grid floor */}
      <motion.div
        style={{ x: '-50%', y: floorY, rotateX: floorRotate, transformPerspective: 900 }}
        className="absolute left-1/2 -bottom-[46%] z-0 h-[75%] w-[190%] bg-grid [transform-origin:center_bottom]"
        aria-hidden="true"
      />

      {/* equalizer */}
      <motion.div style={{ y: waveY }}>
        <Waveform
          className="absolute bottom-24 left-1/2 z-0 h-24 w-[min(80vw,520px)] -translate-x-1/2 opacity-50"
          pulse
          duration={2.8}
          color="rgb(158 193 163 / 0.45)"
        />
      </motion.div>

      {/* floating notes */}
      {NOTES.map((note, i) => (
        <motion.div
          key={i}
          style={{ y: noteYs[i] }}
          className={`pointer-events-none absolute z-0 text-primary/30 ${note.wrap}`}
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: note.dur, repeat: Infinity, ease: 'easeInOut' }}
          >
            {i % 2 ? (
              <Music4 className={note.size} strokeWidth={1.5} />
            ) : (
              <Music className={note.size} strokeWidth={1.5} />
            )}
          </motion.div>
        </motion.div>
      ))}

      {/* ghost word */}
      <GhostWord
        text="huni"
        className="absolute -left-6 bottom-10 z-0 text-[24vw] sm:-left-4 sm:text-[20vw]"
      />

      {/* vertical edge label */}
      <div className="pointer-events-none absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 rotate-90 lg:block">
        <span className="font-cousine text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
          scroll — keep going
        </span>
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ y, rotateX, scale, opacity, transformPerspective: 900 }}
          className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"
        >
          {/* Left — type */}
          <div className="text-left">
            <motion.div variants={item} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" aria-hidden="true" />
              <span className="font-cousine text-[0.7rem] uppercase tracking-[0.3em] text-foreground">
                Nº 001 — A cozy corner
              </span>
            </motion.div>

            <motion.h1 variants={item} className="mt-6">
              <span className="block font-geist text-[clamp(1.6rem,3.4vw,3rem)] font-light leading-none text-foreground">
                Welcome to
              </span>
              <span className="-mt-2 block leading-none">
                <span className="font-geist text-[clamp(3rem,8vw,6.6rem)] font-bold text-foreground">
                  Huni
                </span>
                <span className="-ml-2 inline-block -rotate-1 origin-left font-unna text-[clamp(3rem,8vw,6.6rem)] font-bold italic text-primary">
                  Space
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="tertiary-font mt-5 max-w-lg text-lg font-light leading-relaxed text-muted-foreground sm:mt-7"
            >
              A cozy corner of the internet to{' '}
              <span className="font-unna italic text-foreground">share your taste</span>, discover
              tracks, and connect with people who feel the same.
            </motion.p>

            <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9">
              <Link to="/signup">
                <Button className="primary-font h-12 cursor-pointer px-8 text-base">Get Started</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="primary-font h-12 cursor-pointer px-8 text-base">
                  Log in
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8">
              <MonoChip>0 ads</MonoChip>
              <MonoChip>∞ conversations</MonoChip>
              <MonoChip>100% cozy</MonoChip>
            </motion.div>
          </div>

          {/* Right — mark + mini player */}
          <motion.div variants={item} className="relative flex items-center justify-center">
            <motion.div
              style={{ y: markY }}
              className="relative flex h-[200px] w-[200px] items-center justify-center sm:h-[400px] sm:w-[400px]"
            >
              <OrbitRing className="h-[180px] w-[180px] sm:h-[360px] sm:w-[360px]" duration={26} />
              <OrbitRing className="h-[260px] w-[260px] sm:h-[520px] sm:w-[520px]" duration={44} reverse />
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}>
                  <Huni className="h-28 w-auto sm:h-52" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* mini now-playing mockup */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-8 left-0 z-10 hidden sm:block sm:-left-6"
            >
              <motion.div
                style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
                className="w-52 rounded-2xl border border-border bg-card/90 p-4 shadow-xl shadow-black/5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)]">
                    <Music4
                      className="absolute inset-0 m-auto h-5 w-5 text-white/80"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-unna text-sm italic text-foreground">slow mornings</p>
                    <p className="font-cousine text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                      huni radio
                    </p>
                  </div>
                </div>
                <Waveform
                  className="mt-3 h-4"
                  bars={[40, 70, 55, 90, 65]}
                  pulse
                  duration={1.6}
                  color="rgb(158 193 163 / 0.9)"
                />
                <div className="mt-3 flex items-center gap-2">
                  <SkipBack className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="ml-0.5 h-3 w-3 fill-current" strokeWidth={0} />
                  </span>
                  <SkipForward className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="ml-auto font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
                    01:24 / 03:12
                  </span>
                </div>
              </motion.div>
            </motion.div>

            <p className="absolute -bottom-3 font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
              the mark — since forever
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity: cueOpacity }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="font-cousine text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-muted-foreground/40 p-1">
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="h-1.5 w-1.5 rounded-full bg-primary"
          />
        </div>
      </motion.div>
    </section>
  )
}

export default Hero
