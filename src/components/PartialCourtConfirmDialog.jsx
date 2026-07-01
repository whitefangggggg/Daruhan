import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from './ui/Icon'

function formatHourShort(h) {
  if (h === 0 || h === 24) return '12MN'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return mobile
}

/**
 * Mobile: bottom sheet. Desktop (md+): centered modal.
 */
export default function PartialCourtConfirmDialog({
  open,
  onClose,
  onConfirm,
  startHour,
  duration,
  availableCourts,
  requestedCourts,
}) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const endHour = startHour != null ? startHour + duration : null
  const timeLabel = startHour != null && endHour != null
    ? `${formatHourShort(startHour)} – ${formatHourShort(endHour)} (${duration}h)`
    : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end md:items-center justify-center md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="partial-court-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="Dismiss"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full md:max-w-md rounded-t-3xl md:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-700 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-6"
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 0 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="md:hidden mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 dark:bg-slate-600" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Fewer courts free
                </p>
                <h2 id="partial-court-title" className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug mt-1">
                  Only {availableCourts} of {requestedCourts} courts available
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {timeLabel && (
                <span className="block font-semibold text-gray-800 dark:text-gray-100 mb-1">{timeLabel}</span>
              )}
              Only {availableCourts} of {requestedCourts} courts are free at this time. Book with {availableCourts}{' '}
              court{availableCourts !== 1 ? 's' : ''} instead?
            </p>

            <div className="mt-6 flex flex-col md:flex-row gap-2.5 md:gap-3">
              <button
                type="button"
                onClick={onConfirm}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold order-1"
              >
                Book with {availableCourts} court{availableCourts !== 1 ? 's' : ''}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl text-sm font-semibold border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors order-2"
              >
                Pick another time
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
