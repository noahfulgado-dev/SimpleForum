import { useRef } from 'react'
import { motion, useTransform } from 'motion/react'
import { Music } from 'lucide-react'
import { useSmoothScrollProgress } from '../../lib/useSmoothScroll'

const WORDS_SOLID = ['share', 'connect', 'discover', 'create', 'belong']
const WORDS_ITALIC = ['vinyl nights', 'midnight playlists', 'track of the day', 'new finds', 'shared taste']

function Row({
  words,
  italic,
  hidden = false,
}: {
  words: string[]
  italic: boolean
  hidden?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {words.map((word) => (
        <span key={word} className="flex items-center whitespace-nowrap">
          {italic ? (
            <>
              <Music className="mr-4 h-3.5 w-3.5 text-primary/60" strokeWidth={1.75} />
              <span className="pr-8 font-unna text-2xl italic text-primary sm:text-3xl">{word}</span>
            </>
          ) : (
            <>
              <span className="primary-font px-7 text-xl font-semibold text-foreground sm:text-2xl">
                {word}
              </span>
              <Music className="h-4 w-4 text-primary" strokeWidth={1.75} />
            </>
          )}
        </span>
      ))}
    </div>
  )
}

function Track({
  words,
  italic,
  reverse,
  duration,
}: {
  words: string[]
  italic: boolean
  reverse: boolean
  duration: number
}) {
  return (
    <motion.div
      className="flex w-max"
      animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <Row words={words} italic={italic} />
      <Row words={words} italic={italic} hidden />
    </motion.div>
  )
}

export function Marquee() {
  const ref = useRef<HTMLElement>(null)
  const { smooth } = useSmoothScrollProgress({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(smooth, [0, 1], [24, -24])
  const solidX = useTransform(smooth, [0, 1], [0, 24])
  const italicX = useTransform(smooth, [0, 1], [0, -24])

  return (
    <div className="relative overflow-hidden">
      <section ref={ref} className="relative -rotate-2 border-y border-border bg-primary/10 py-5">
        <motion.div style={{ y }} className="flex flex-col gap-3">
          <motion.div style={{ x: solidX }}>
            <Track words={WORDS_SOLID} italic={false} reverse={false} duration={22} />
          </motion.div>
          <motion.div style={{ x: italicX }}>
            <Track words={WORDS_ITALIC} italic reverse duration={18} />
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}

export default Marquee
