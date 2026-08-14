import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useTransform } from 'motion/react'
import { Music, Music4 } from 'lucide-react'
import { Button } from '../ui/button'
import { Huni } from '../ui/huni'
import { GhostWord, SecIndex, Wash, Waveform } from '../decor'
import { useSmoothScrollProgress } from '../../lib/useSmoothScroll'

export function Cta() {
  const ref = useRef<HTMLElement>(null)
  const { smooth } = useSmoothScrollProgress({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const gridY = useTransform(smooth, [0, 1], [0, -70])
  const ghostY = useTransform(smooth, [0, 1], [0, 46])
  const waveY = useTransform(smooth, [0, 1], [0, -36])

  return (
    <section ref={ref} className="relative overflow-hidden py-28 sm:py-36 [content-visibility:auto] [contain-intrinsic-size:auto_36rem]">
      <motion.div
        style={{ y: gridY }}
        className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_72%)]"
        aria-hidden="true"
      />
      <Wash className="top-0 z-0 h-[55vh]" />
      <motion.div style={{ y: ghostY }}>
        <GhostWord
          text="join"
          className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rotate-6 whitespace-nowrap text-[26vw]"
        />
      </motion.div>
      <motion.div style={{ y: waveY }}>
        <Waveform
          className="absolute left-1/2 top-1/2 z-0 h-28 w-[min(86vw,600px)] -translate-x-1/2 -translate-y-1/2 opacity-40"
          pulse
          duration={3}
          color="rgb(158 193 163 / 0.5)"
        />
      </motion.div>
      <SecIndex n={3} />

      {/* floating music notes */}
      {[
        { wrap: 'right-[10%] top-[16%]', size: 'h-8 w-8', dur: 7 },
        { wrap: 'bottom-[20%] right-[18%]', size: 'h-6 w-6', dur: 6.5 },
      ].map((note, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -16, 0], rotate: [-8, 8, -8] }}
          transition={{ duration: note.dur, repeat: Infinity, ease: 'easeInOut' }}
          className={`pointer-events-none absolute z-10 text-primary/40 ${note.wrap}`}
          aria-hidden="true"
        >
          {i % 2 ? (
            <Music4 className={note.size} strokeWidth={1.5} />
          ) : (
            <Music className={note.size} strokeWidth={1.5} />
          )}
        </motion.div>
      ))}

      {/* floating mini Huni marks */}
      {[
        { wrap: 'left-[12%] top-[18%]', size: 'h-10 w-auto', dur: 7 },
        { wrap: 'bottom-[18%] left-[18%]', size: 'h-8 w-auto', dur: 6.5 },
      ].map((mark, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -16, 0], rotate: [-4, 5, -4] }}
          transition={{ duration: mark.dur, repeat: Infinity, ease: 'easeInOut' }}
          className={`pointer-events-none absolute z-10 opacity-70 ${mark.wrap}`}
          aria-hidden="true"
        >
          <Huni className={mark.size} />
        </motion.div>
      ))}

      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div className="text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" aria-hidden="true" />
            <span className="font-cousine text-[0.7rem] uppercase tracking-[0.3em] text-foreground">
              02 — Join the circle
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="primary-font mt-6 text-[clamp(2rem,5vw,3.6rem)] font-bold leading-tight text-foreground"
          >
            Ready to find your{' '}
            <span className="font-unna italic text-primary">cozy corner?</span>
          </motion.h2>
        </div>

        <div className="text-left lg:text-right">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="tertiary-font max-w-md font-light leading-relaxed text-muted-foreground lg:ml-auto"
          >
            Joining takes less than a minute. Bring your thoughts, find your people.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-3 lg:justify-end"
          >
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
              <Link to="/signup">
                <Button className="primary-font h-14 cursor-pointer px-10 text-base">
                  Create your space
                </Button>
              </Link>
            </motion.div>
            <Link to="/login">
              <Button variant="outline" className="primary-font h-14 cursor-pointer px-10 text-base">
                Log in
              </Button>
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-6 text-sm text-muted-foreground"
          >
            Free to join. No ads, ever.
          </motion.p>
        </div>
      </div>
    </section>
  )
}

export default Cta
