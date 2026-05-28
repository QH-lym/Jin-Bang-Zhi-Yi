import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => onCloseRef.current(), 3000)
    return () => clearTimeout(timer)
  }, [message])

  const borderColor =
    type === 'success'
      ? 'bg-green-500/20 border-green-500/30 text-green-300'
      : type === 'error'
        ? 'bg-red-500/20 border-red-500/30 text-red-300'
        : 'bg-amber-500/20 border-amber-500/30 text-amber-300'

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-xl px-6 py-3 font-medium glass-panel ${borderColor}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
