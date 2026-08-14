import { useScroll, useSpring, type MotionValue } from 'motion/react'

export const SMOOTH_SPRING = { stiffness: 50, damping: 22, mass: 1 }

export function useSmoothScrollProgress(
  options: Parameters<typeof useScroll>[0]
): { scrollYProgress: MotionValue<number>; smooth: MotionValue<number> } {
  const { scrollYProgress } = useScroll(options)
  const smooth = useSpring(scrollYProgress, SMOOTH_SPRING)
  return { scrollYProgress, smooth }
}
