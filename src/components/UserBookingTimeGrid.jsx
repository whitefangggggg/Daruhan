import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  getRateForHour,
  getThemeForHour,
  RATE_BRACKETS,
  RATE_BRACKET_THEMES,
} from '../lib/pricing'
import { getOccupiedHours, getBookingEndHour } from '../utils/bookingHours'
import { Check, X } from './ui/Icon'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHourLabel(h) {
  if (h === 0 || h === 24) return '12MN'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

/** A chip that looks exactly like the actual slot — users instantly recognise it */
function SlotChip({ className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold leading-none select-none ${className}`}>
      {children}
    </span>
  )
}

function AvailabilityLegend({ detailed = false }) {
  if (detailed) {
    return (
      <div className="space-y-4">
        {/* Rate brackets — presented as a 2-col card grid */}
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2.5 uppercase tracking-wider">Rates</p>
          <div className="grid grid-cols-2 gap-2">
            {RATE_BRACKETS.map(row => {
              const theme = RATE_BRACKET_THEMES[row.themeId]
              return (
                <div key={row.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 ${theme.bg} ${theme.border}`}>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-bold leading-tight ${theme.text}`}>{row.label}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{row.time}</p>
                  </div>
                  <p className={`ml-auto text-sm font-extrabold tabular-nums shrink-0 ${theme.price}`}>₱{row.rate}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status states */}
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2.5 uppercase tracking-wider">Slot states</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="slot-booked shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-gray-500 dark:text-gray-400" aria-hidden>Taken</span>
              <p className="text-sm text-gray-700 dark:text-gray-200">Fully booked — no courts left at this hour.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`shrink-0 w-12 h-8 rounded-lg flex items-center justify-center border-2 border-amber-400 dark:border-amber-500 relative ${RATE_BRACKET_THEMES.daytime.bg}`} aria-hidden>
                <span className="text-[9px] font-extrabold text-white bg-amber-500 rounded px-1 leading-tight">2/4</span>
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-200">Some courts are taken. You can still book with fewer courts.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="slot-wont-fit shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold opacity-60" aria-hidden>—</span>
              <p className="text-sm text-gray-700 dark:text-gray-200">Not available — your duration does not fit or it&apos;s in the past.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="slot-selected shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white" aria-hidden>✓</span>
              <p className="text-sm text-gray-700 dark:text-gray-200">Your chosen start time is highlighted in green.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {RATE_BRACKETS.map(row => {
        const theme = RATE_BRACKET_THEMES[row.themeId]
        return (
          <SlotChip key={row.id} className={`border-2 ${theme.bg} ${theme.border} ${theme.text}`}>
            {row.label}
            <span className={`tabular-nums ${theme.price}`}>₱{row.rate}/hr</span>
          </SlotChip>
        )
      })}

      <span className="self-center text-gray-200 dark:text-slate-700 font-bold select-none px-0.5">·</span>

      <SlotChip className="slot-booked text-gray-500 dark:text-gray-400">
        Taken
      </SlotChip>
      <SlotChip className={`border-2 border-amber-400 dark:border-amber-500 ${RATE_BRACKET_THEMES.daytime.bg} ${RATE_BRACKET_THEMES.daytime.text}`}>
        Limited
        <span className="bg-amber-500 text-white text-[9px] font-extrabold rounded px-1 py-px leading-none">2/4</span>
      </SlotChip>
      <SlotChip className="slot-wont-fit opacity-60">
        Unavailable
      </SlotChip>
      <SlotChip className="slot-selected text-white">
        <Check size={11} strokeWidth={3} />
        Your pick
      </SlotChip>
    </div>
  )
}

function LegendSheet({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] md:hidden flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close legend" onClick={onClose} />
          <motion.div
            className="relative w-full rounded-t-2xl bg-white dark:bg-slate-900 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-slate-700 max-h-[70vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center justify-between mb-1">
              <p className="text-base font-bold text-gray-900 dark:text-white">Schedule guide</p>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Pick a colored time slot to start your booking.
            </p>
            <AvailabilityLegend detailed />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DowngradeHint({ numCourts, onDismiss }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-sky-200/80 dark:border-sky-800/50 bg-sky-50/90 dark:bg-sky-900/20 px-3 py-2.5 mb-3">
      <p className="text-[12px] sm:text-sm text-sky-900 dark:text-sky-100 leading-snug flex-1">
        Some slots have fewer courts available — try {numCourts - 1} court{numCourts - 1 !== 1 ? 's' : ''} for more options.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-lg text-sky-700/70 hover:text-sky-900 dark:text-sky-300 shrink-0"
        aria-label="Dismiss hint"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function SlotCell({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center w-full min-h-11 h-[3.5rem] rounded-xl text-xs font-semibold transition-colors touch-manipulation ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function SlotButton({
  hour,
  state,
  free,
  numCourts,
  selectedHour,
  duration,
  onSelectFull,
  onSelectPartial,
}) {
  const inSelected = selectedHour != null && getOccupiedHours(selectedHour, duration).includes(hour)
  const isStart = hour === selectedHour
  const offset = selectedHour != null ? getOccupiedHours(selectedHour, duration).indexOf(hour) : -1
  const theme = getThemeForHour(hour)
  const rate = getRateForHour(hour)

  if (state === 'past') {
    return (
      <SlotCell disabled className="slot-wont-fit cursor-not-allowed opacity-50">
        <span>{formatHourLabel(hour)}</span>
        <span className="text-[9px] mt-0.5 font-normal">past</span>
      </SlotCell>
    )
  }

  if (inSelected) {
    return (
      <SlotCell
        onClick={() => onSelectFull(isStart ? null : hour)}
        className="slot-selected"
      >
        <span>{formatHourLabel(hour)}</span>
        <span className="text-[9px] mt-0.5 opacity-90">
          {isStart ? 'Start' : `+${offset}h`}
        </span>
      </SlotCell>
    )
  }

  if (state === 'none') {
    return (
      <SlotCell disabled className="slot-wont-fit cursor-not-allowed">
        <span>{formatHourLabel(hour)}</span>
        <span className="text-[9px] mt-0.5 font-normal opacity-70">taken</span>
      </SlotCell>
    )
  }

  if (state === 'partial') {
    return (
      <SlotCell
        onClick={() => onSelectPartial(hour, free)}
        className={`relative border-2 border-amber-400 dark:border-amber-500 ${theme.bg} ${theme.text}`}
      >
        <span className="absolute top-1 right-1 text-[9px] font-extrabold leading-none px-1 py-0.5 rounded-md bg-amber-500 text-white tabular-nums">
          {free}/{numCourts}
        </span>
        <span>{formatHourLabel(hour)}</span>
        <span className={`text-[9px] mt-0.5 tabular-nums ${theme.price}`}>₱{rate}</span>
      </SlotCell>
    )
  }

  return (
    <SlotCell
      onClick={() => onSelectFull(hour)}
      className={`border-2 active:brightness-[0.98] md:hover:brightness-[1.03] ${theme.bg} ${theme.border} ${theme.text}`}
    >
      <span>{formatHourLabel(hour)}</span>
      <span className={`text-[9px] mt-0.5 tabular-nums ${theme.price}`}>₱{rate}</span>
    </SlotCell>
  )
}

export default function UserBookingTimeGrid({
  slotStates,
  numCourts,
  selectedHour,
  duration,
  onSelectHour,
  onRequestPartialConfirm,
  showDowngradeHint = false,
  onDismissDowngradeHint,
}) {
  const [legendOpen, setLegendOpen] = useState(false)
  const stateByHour = useMemo(() => new Map(slotStates.map(s => [s.hour, s])), [slotStates])

  useEffect(() => {
    if (selectedHour == null) return
    const slot = stateByHour.get(selectedHour)
    if (!slot) {
      onSelectHour(null)
      return
    }
    if (slot.state === 'past' || slot.state === 'none') {
      onSelectHour(null)
      return
    }
    if (slot.free < numCourts) {
      onSelectHour(null)
    }
  }, [selectedHour, numCourts, stateByHour, onSelectHour])

  const previewEnd = selectedHour != null ? getBookingEndHour(selectedHour, duration) : null

  return (
    <div>
      {showDowngradeHint && onDismissDowngradeHint && (
        <DowngradeHint numCourts={numCourts} onDismiss={onDismissDowngradeHint} />
      )}

      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
          Pick a <span className="text-brand-gold-600 dark:text-brand-gold-400">start time</span>
        </p>
        <button
          type="button"
          onClick={() => setLegendOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shrink-0 md:hidden"
          aria-label="Open schedule guide"
        >
          <span className="text-[12px] leading-none">?</span>
          Guide
        </button>
      </div>

      <div className="hidden md:block mb-4">
        <AvailabilityLegend />
      </div>

      <LegendSheet open={legendOpen} onClose={() => setLegendOpen(false)} />

      <div className="max-h-[min(420px,52vh)] overflow-y-auto overscroll-contain -mx-1 px-1 pb-1">
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2">
          {HOURS.map(hour => {
            const slot = stateByHour.get(hour) ?? { hour, free: 0, state: 'none' }
            return (
              <SlotButton
                key={hour}
                hour={hour}
                state={slot.state}
                free={slot.free}
                numCourts={numCourts}
                selectedHour={selectedHour}
                duration={duration}
                onSelectFull={onSelectHour}
                onSelectPartial={(h, free) => onRequestPartialConfirm({ hour: h, availableCourts: free })}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-3 min-h-[3.25rem] flex items-center">
        {selectedHour != null && previewEnd != null ? (
          <div className="w-full bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-navy-700 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
              <span className="text-brand-navy-800 dark:text-brand-gold-400 font-semibold inline-flex items-center gap-1 flex-shrink-0">
                <Check size={13} strokeWidth={2.5} /> Selected:
              </span>
              <span className="font-medium">
                {formatHourLabel(selectedHour)}
                {' '}–{' '}
                {formatHourLabel(previewEnd)}
                <span className="text-gray-400 ml-1">({duration}h · {numCourts} court{numCourts !== 1 ? 's' : ''})</span>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 px-1">Tap an available time below.</p>
        )}
      </div>
    </div>
  )
}
