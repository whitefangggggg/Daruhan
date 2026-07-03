import { useEffect, useState } from 'react'
import { formatCountdownLabel, getRsvpCountdownMs } from '../../utils/openPlay'

/**
 * Live promo-style countdown to rsvp_deadline.
 * `prominent` = user feed (boldest); `compact` = admin list.
 */
export default function OpenPlayCountdown({
  rsvpDeadline,
  status = 'upcoming',
  prominent = false,
  compact = false,
  theme = null,
}) {
  const [ms, setMs] = useState(() => getRsvpCountdownMs(rsvpDeadline))

  useEffect(() => {
    if (status !== 'upcoming') return undefined
    const tick = () => setMs(getRsvpCountdownMs(rsvpDeadline))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [rsvpDeadline, status])

  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-2.5 py-1">
        Cancelled
      </span>
    )
  }

  if (status === 'ended') {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-2.5 py-1">
        Ended
      </span>
    )
  }

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-brand-gold-700 bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 rounded-full px-2.5 py-1">
        Completed
      </span>
    )
  }

  const label = formatCountdownLabel(ms)

  if (prominent) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-md border-2 ${theme?.countdownBorder ?? 'border-amber-900/25'}`}
        style={{
          background: theme?.countdownGradient ?? 'linear-gradient(135deg, #78350f 0%, #92400e 55%, #b45309 100%)',
        }}
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme?.countdownPing ?? 'bg-yellow-300'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${theme?.countdownPing ?? 'bg-yellow-300'}`} />
        </span>
        <span className={`text-sm font-extrabold tracking-tight tabular-nums ${theme?.countdownText ?? 'text-amber-50'}`}>
          {label}
        </span>
      </div>
    )
  }

  if (compact) {
    return (
      <span className="inline-flex items-center text-[11px] font-bold text-brand-navy-800 dark:text-brand-gold-300 bg-brand-gold-100 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-gold-900/40 rounded-full px-2.5 py-0.5 tabular-nums">
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center text-xs font-bold text-brand-navy-800 dark:text-brand-gold-300 bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-gold-900/40 rounded-full px-3 py-1 tabular-nums">
      {label}
    </span>
  )
}
