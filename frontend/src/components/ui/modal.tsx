import { useEffect, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'

interface ModalShellProps {
  onClose: () => void
  label: string
  children: ReactNode
  maxWidthClass?: string
}

export function ModalShell({ onClose, label, children, maxWidthClass = 'max-w-[40rem]' }: ModalShellProps) {
  const reduce = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <motion.div
        className={`relative w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10`}
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="h-[2px] w-full bg-[linear-gradient(90deg,var(--primary),var(--cream))]"
          aria-hidden="true"
        />
        {children}
      </motion.div>
    </motion.div>
  )
}

interface ModalHeaderProps {
  eyebrow: string
  onClose: () => void
}

export function ModalHeader({ eyebrow, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-cousine text-[0.65rem] uppercase tracking-[0.3em] text-primary">{eyebrow}</span>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground cursor-pointer"
        aria-label="Close"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

export default ModalShell
