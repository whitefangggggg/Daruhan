import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, X } from './ui/Icon'

/** Mini chip that mimics a real slot tile so the sample reads like the actual grid. */
function SampleSlot({ label, sub, tone = 'free' }) {
  const tones = {
    start: 'slot-selected text-white',
    fill: 'bg-brand-gold-500 dark:bg-brand-gold-600 text-brand-navy-950',
    end: 'border-2 border-dashed border-brand-gold-400 dark:border-brand-gold-600 bg-brand-gold-50 dark:bg-brand-navy-900/20 text-brand-gold-600 dark:text-brand-gold-300',
    free: 'border-2 border-indigo-300 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
    taken: 'slot-booked text-gray-400 dark:text-gray-500 line-through decoration-1',
  }
  return (
    <div className={`flex flex-col items-center justify-center w-[3.25rem] h-[3.25rem] rounded-xl text-xs font-bold shrink-0 ${tones[tone]}`}>
      <span>{label}</span>
      {sub && <span className="text-[9px] font-semibold mt-0.5 opacity-90">{sub}</span>}
    </div>
  )
}

/**
 * One-time mini guide shown before the time-slot grid so users understand that
 * tiles are START times and a booking runs continuously for the chosen duration.
 */
export default function TimeGuideModal({ open, onClose }) {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-guide-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Dismiss"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-700 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            <div className="sm:hidden mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 dark:bg-slate-600" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-gold-600 dark:text-brand-gold-400 flex items-center justify-center shrink-0">
                  <Clock size={20} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-600 dark:text-brand-gold-400">
                    Quick guide
                  </p>
                  <h2 id="time-guide-title" className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug mt-0.5">
                    Picking your time
                  </h2>
                </div>
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

            <ul className="space-y-2.5 mb-5">
              <li className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200 leading-snug">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-gold-600 dark:text-brand-gold-400 text-[11px] font-extrabold shrink-0 mt-0.5">1</span>
                <span>
                  <span className="font-bold text-gray-900 dark:text-white">Set your hours first</span> (the − / + on the left) — that&apos;s how long you&apos;ll play.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200 leading-snug">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-gold-600 dark:text-brand-gold-400 text-[11px] font-extrabold shrink-0 mt-0.5">2</span>
                <span>
                  Tap <span className="font-bold text-gray-900 dark:text-white">one tile — your start time</span>. That hour and the rest of your block light up green.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200 leading-snug">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-gold-600 dark:text-brand-gold-400 text-[11px] font-extrabold shrink-0 mt-0.5">3</span>
                <span>
                  The grid only lets you tap starts where the <span className="font-bold text-gray-900 dark:text-white">whole block is free</span>. If an hour inside it is taken, that start shows <span className="font-bold text-gray-900 dark:text-white">Taken</span> too.
                </span>
              </li>
            </ul>

            {/* Worked sample — it works */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/60 p-4">
              <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                ✅ 3 hours, starting 5PM
              </p>
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3 leading-snug">
                Set hours to <span className="font-bold text-gray-800 dark:text-gray-200">3</span>, tap{' '}
                <span className="font-bold text-gray-800 dark:text-gray-200">5PM</span>. Hours 5, 6 and 7 are free, so
                they light up — your session is <span className="font-bold text-gray-800 dark:text-gray-200">5PM – 8PM</span>:
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <SampleSlot label="5PM" sub="Start" tone="start" />
                <SampleSlot label="6PM" sub="+1h" tone="fill" />
                <SampleSlot label="7PM" sub="+2h" tone="fill" />
                <SampleSlot label="8PM" sub="ends" tone="end" />
              </div>
            </div>

            {/* Worked sample — blocked starts grey out */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/60 p-4 mt-3">
              <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                🚫 Same 3 hours, but 7PM is already booked
              </p>
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3 leading-snug">
                With <span className="font-bold text-gray-800 dark:text-gray-200">3</span> hours selected, 5PM and 6PM also
                turn <span className="font-bold text-gray-800 dark:text-gray-200">Taken</span> — a 3-hour block from them would hit 7PM.
                The grid does this for you, so you can&apos;t pick an impossible time:
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <SampleSlot label="5PM" sub="taken" tone="taken" />
                <SampleSlot label="6PM" sub="taken" tone="taken" />
                <SampleSlot label="7PM" sub="booked" tone="taken" />
                <SampleSlot label="8PM" sub="ok start" tone="free" />
              </div>
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-3 leading-snug">
                To play around 5PM: lower your hours so the block fits (e.g. 1–2 hours), or start later at{' '}
                <span className="font-semibold">8PM</span> where 3 hours in a row are free.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold mt-5"
            >
              Got it — show me the times
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
