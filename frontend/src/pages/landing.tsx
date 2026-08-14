import { useEffect } from 'react'
import Lenis from 'lenis'
import { MotionConfig } from 'motion/react'
import { Hero } from '../components/landing/Hero'
import { Marquee } from '../components/landing/Marquee'
import { Features } from '../components/landing/Features'
import { Showcase } from '../components/landing/Showcase'
import { Stats } from '../components/landing/Stats'
import { Cta } from '../components/landing/Cta'
import { Footer } from '../components/landing/Footer'
import { NoiseOverlay } from '../components/decor'

export function Landing() {
  document.title = "Welcome to HuniSpace";

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.08 })
    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <NoiseOverlay />
      <main className="bg-background text-foreground">
        <Hero />
        <Marquee />
        <Features />
        <Showcase />
        <Stats />
        <Cta />
        <Footer />
      </main>
    </MotionConfig>
  )
}

export default Landing
