import { useCallback, useEffect, useRef, useState } from 'react'

const PULL_DAMPING = 0.5
const MAX_PULL = 110
const TRIGGER_THRESHOLD = 70

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startY = useRef(0)
  const armed = useRef(false)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node)
  }, [])

  const setPullState = useCallback((value: number) => {
    pullRef.current = value
    setPull(value)
  }, [])

  const setRefreshingState = useCallback((value: boolean) => {
    refreshingRef.current = value
    setRefreshing(value)
  }, [])

  const reset = useCallback(() => {
    armed.current = false
    setPullState(0)
  }, [setPullState])

  useEffect(() => {
    const el = element
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY
        armed.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!armed.current || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setPullState(0)
        armed.current = false
        return
      }
      if (el.scrollTop > 0) {
        reset()
        return
      }
      e.preventDefault()
      setPullState(Math.min(dy * PULL_DAMPING, MAX_PULL))
    }

    const handleTouchEnd = async () => {
      if (!armed.current || refreshingRef.current) return
      armed.current = false
      if (pullRef.current >= TRIGGER_THRESHOLD) {
        setRefreshingState(true)
        setPullState(0)
        try {
          await onRefreshRef.current()
        } finally {
          setRefreshingState(false)
        }
      } else {
        setPullState(0)
      }
    }

    const handleScroll = () => {
      if (el.scrollTop > 0) reset()
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('scroll', handleScroll)
    }
  }, [element, reset, setPullState, setRefreshingState])

  return { containerRef, pull, refreshing }
}
