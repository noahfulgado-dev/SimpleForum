import { useScroll, useSpring, type MotionValue } from 'motion/react'
import { useIsMobile } from '../hooks/useMediaQuery'

export const SMOOTH_SPRING = { stiffness: 50, damping: 22, mass: 1 }
const MOBILE_SPRING = { stiffness: 140, damping: 32, mass: 1 }

export function useSmoothScrollProgress(
  options: Parameters<typeof useScroll>[0]
): { scrollYProgress: MotionValue<number>; smooth: MotionValue<number> } {
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll(options)
  const smooth = useSpring(scrollYProgress, isMobile ? MOBILE_SPRING : SMOOTH_SPRING)
  return { scrollYProgress, smooth }
}
