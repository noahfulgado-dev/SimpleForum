import { useRef } from 'react'
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'motion/react'
import { Feather, MessagesSquare, Heart, type LucideIcon } from 'lucide-react'
import { Dots, SecIndex, Wave } from '../decor'
import { useSmoothScrollProgress } from '../../lib/useSmoothScroll'

interface Feature {
  icon: LucideIcon
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  {
    icon: Feather,
    title: 'Share thoughts',
    desc: 'Post ideas, photos, and little moments in a space built for slow, thoughtful conversation.',
  },
  {
    icon: MessagesSquare,
    title: 'Spark conversations',
    desc: 'Threaded replies keep discussions cozy and easy to follow — no noise, no clutter.',
  },
  {
    icon: Heart,
    title: 'A cozy community',
    desc: 'Follow people you enjoy, bookmark what you love, and feel right at home.',
  },
]

function TiltCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(220px circle at ${glareX}% ${glareY}%, rgb(158 193 163 / 0.18), transparent 70%)`
  const Icon = feature.icon

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * 14)
    rotateX.set((0.5 - py) * 14)
    glareX.set(px * 100)
    glareY.set(py * 100)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    glareX.set(50)
    glareY.set(50)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`[perspective:1000px] ${index === 1 ? 'md:mt-14' : ''}`}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow duration-300 hover:shadow-[0_24px_60px_rgb(0,0,0,0.10)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-5 top-3 select-none font-cousine text-5xl font-bold text-foreground/5"
        >
          0{index + 1}
        </span>
        <motion.div
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div style={{ transform: 'translateZ(32px)' }} className="relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="primary-font mt-6 text-lg font-semibold text-foreground">{feature.title}</h3>
          <p className="tertiary-font mt-2 text-sm font-light leading-relaxed text-muted-foreground">
            {feature.desc}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Features() {
  const ref = useRef<HTMLElement>(null)
  const { smooth } = useSmoothScrollProgress({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const gridY = useTransform(smooth, [0, 1], [28, -28])
  const gridRotateX = useTransform(smooth, [0, 1], [2.4, -2.4])
  const headY = useTransform(smooth, [0, 1], [0, -40])

  return (
    <section ref={ref} className="relative overflow-hidden py-28 sm:py-36 [content-visibility:auto] [contain-intrinsic-size:auto_40rem]">
      <Wave className="top-0 h-[9vw] max-h-32" />
      <SecIndex n={1} />
      <Dots className="absolute inset-x-0 top-0 h-64 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div style={{ y: headY }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl text-left"
          >
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" aria-hidden="true" />
              <span className="font-cousine text-[0.7rem] uppercase tracking-[0.3em] text-foreground">
                01 — Why Huni
              </span>
            </div>
            <h2 className="primary-font mt-6 text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight text-foreground">
              Made for <span className="font-unna italic text-primary">meaningful</span>
              <br /> connection
            </h2>
            <p className="tertiary-font mt-4 max-w-md font-light text-muted-foreground">
              A calmer place to put your words out into the world.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: gridY, rotateX: gridRotateX, transformPerspective: 1100 }}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {FEATURES.map((feature, i) => (
            <TiltCard key={feature.title} feature={feature} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
