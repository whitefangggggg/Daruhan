import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { scaleIn, transition } from '../lib/motion'

export default function BookingConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmTone = 'primary',
  zIndex = 60,
}) {
  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onCancel])

  if (!open) return null

  const confirmClass =
    confirmTone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'btn-primary'

  return (
    <motion.div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex }}
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.fast}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        transition={transition.fast}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirm-title"
      >
        <div className="px-5 pt-5 pb-4">
          <h2 id="booking-confirm-title" className="text-lg font-extrabold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{description}</p>
        </div>
        <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-gray-300 dark:hover:border-slate-600 dark:hover:bg-slate-700/50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
