import { useMemo } from 'react'
import { ArrowRight, Clock, Flag, Play } from 'lucide-react'
import {
  formatOpenPlayHour,
  formatOpenPlayTimeRange,
  getOpenPlayDurationHours,
  isValidOpenPlayTimeRange,
} from '../../utils/openPlay'

const PERIODS = [
  { label: 'Late night', hours: [0, 1, 2, 3, 4, 5] },
  { label: 'Morning', hours: [6, 7, 8, 9, 10, 11] },
  { label: 'Afternoon', hours: [12, 13, 14, 15, 16, 17] },
  { label: 'Evening', hours: [18, 19, 20, 21, 22, 23] },
]

const END_HOURS = Array.from({ length: 24 }, (_, i) => i + 1)

function HourChip({ hour, selected, inRange, disabled, onClick }) {
  let stateClass = 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:border-brand-gold-300 hover:bg-brand-gold-50/60'
  if (disabled) {
    stateClass = 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-300 cursor-not-allowed'
  } else if (selected === 'start') {
    stateClass = 'border-brand-gold-500 bg-brand-gold-500 text-white shadow-md shadow-brand-gold-200/80 ring-2 ring-brand-gold-300/60'
  } else if (selected === 'end') {
    stateClass = 'border-brand-navy-700 bg-brand-navy-700 text-white shadow-md shadow-brand-navy-900/30 ring-2 ring-brand-gold-300/60'
  } else if (inRange) {
    stateClass = 'border-brand-gold-200 bg-brand-gold-100/80 text-brand-navy-900'
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(hour)}
      className={`flex flex-col items-center justify-center h-10 text-[11px] rounded-xl font-semibold border transition-all ${stateClass}`}
      aria-pressed={Boolean(selected)}
    >
      <span>{formatOpenPlayHour(hour === 24 ? 24 : hour)}</span>
    </button>
  )
}

function TimeSection({ step, tone, icon: Icon, title, value, children }) {
  const tones = {
    start: {
      panel: 'border-brand-gold-200 bg-brand-gold-50/40',
      stripe: 'bg-brand-gold-50 dark:bg-brand-navy-900/30',
      step: 'bg-brand-gold-500 text-white',
      badge: 'bg-brand-gold-500 text-white shadow-sm shadow-brand-gold-200',
      title: 'text-brand-navy-900',
      hint: 'text-brand-gold-700/70',
    },
    end: {
      panel: 'border-brand-navy-700/30 bg-brand-navy-900/5',
      stripe: 'bg-brand-navy-900/10',
      step: 'bg-brand-navy-700 text-white',
      badge: 'bg-brand-navy-700 text-white shadow-sm shadow-brand-navy-900/20',
      title: 'text-brand-navy-900',
      hint: 'text-brand-navy-700/70',
    },
  }
  const t = tones[tone]

  return (
    <section className={`relative overflow-hidden rounded-xl border-2 ${t.panel}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.stripe}`} aria-hidden />

      <div className="px-4 pt-4 pb-3 border-b border-black/[0.04]">
        <div className="flex items-center gap-3">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${t.step}`}>
            {step}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon size={15} strokeWidth={2.4} className={t.title} />
              <h4 className={`text-sm font-extrabold uppercase tracking-wide ${t.title}`}>
                {title}
              </h4>
            </div>
            <p className={`text-[11px] font-medium mt-0.5 ${t.hint}`}>
              {tone === 'start' ? 'When players arrive on court' : 'When the session wraps up'}
            </p>
          </div>
          <span className={`admin-display text-lg px-3 py-1.5 rounded-xl tabular-nums flex-shrink-0 ${t.badge}`}>
            {value}
          </span>
        </div>
      </div>

      <div className="p-4 pt-3">
        {children}
      </div>
    </section>
  )
}

export default function OpenPlayTimeRangePicker({
  startHour,
  endHour,
  onChange,
  isStartHourDisabled,
  isEndHourDisabled,
  scheduleHint,
}) {
  const duration = getOpenPlayDurationHours({ start_hour: startHour, end_hour: endHour })
  const valid = isValidOpenPlayTimeRange(startHour, endHour)

  const rangeHours = useMemo(() => {
    if (!valid) return new Set()
    return new Set(Array.from({ length: duration }, (_, i) => startHour + i))
  }, [startHour, duration, valid])

  function setStart(h) {
    let nextEnd = endHour
    if (nextEnd <= h) nextEnd = Math.min(h + 2, 24)
    if (nextEnd <= h) nextEnd = h + 1
    onChange({ startHour: h, endHour: nextEnd })
  }

  function setEnd(h) {
    if (h > startHour) onChange({ startHour, endHour: h })
  }

  return (
    <div className="rounded-xl border border-brand-gold-200 dark:border-brand-navy-700/40 bg-gradient-to-br from-brand-gold-50/50 to-white p-4 space-y-4">
      {/* Summary */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-gold-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Clock size={18} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-800 mb-1">
            Session time
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gold-500 text-white text-sm font-bold px-2.5 py-1">
              <Play size={12} fill="currentColor" />
              {formatOpenPlayHour(startHour)}
            </span>
            <ArrowRight size={16} className="text-brand-gold-400 flex-shrink-0" />
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy-700 text-white text-sm font-bold px-2.5 py-1">
              <Flag size={12} />
              {formatOpenPlayHour(endHour)}
            </span>
            {valid && (
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                · {duration}h total
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
            {valid
              ? formatOpenPlayTimeRange(startHour, endHour)
              : 'End time must be after start — same day only'}
          </p>
          {scheduleHint && (
            <p className={`text-[12px] mt-2 font-medium ${scheduleHint.includes('No courts') ? 'text-amber-700' : 'text-brand-gold-700'}`}>
              {scheduleHint}
            </p>
          )}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="space-y-1.5 px-1">
        <div className="flex justify-between text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>12MN</span>
          <span>6AM</span>
          <span>12PM</span>
          <span>6PM</span>
          <span>12MN</span>
        </div>
        <div className="relative flex h-3.5 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200/80">
          {Array.from({ length: 24 }, (_, h) => {
            const active = rangeHours.has(h)
            const isStart = h === startHour
            const isEnd = valid && h === endHour - 1
            return (
              <div
                key={h}
                className={`flex-1 min-w-0 transition-colors ${
                  active
                    ? isStart
                      ? 'bg-brand-gold-500'
                      : isEnd
                        ? 'bg-brand-navy-600'
                        : 'bg-brand-gold-400/90'
                    : 'bg-transparent'
                }`}
                title={formatOpenPlayHour(h)}
              />
            )
          })}
          {valid && (
            <>
              <span
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-gold-600 border-2 border-white shadow-sm"
                style={{ left: `calc(${(startHour / 24) * 100}% - 4px)` }}
                aria-hidden
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-navy-800 border-2 border-white shadow-sm"
                style={{ left: `calc(${((endHour - 1) / 24) * 100}% - 4px)` }}
                aria-hidden
              />
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <TimeSection
          step="1"
          tone="start"
          icon={Play}
          title="Starts at"
          value={formatOpenPlayHour(startHour)}
        >
          <div className="space-y-2.5">
            {PERIODS.map(period => (
              <div key={period.label}>
                <p className="text-[10px] font-semibold text-brand-navy-800/50 uppercase tracking-wider mb-1.5">
                  {period.label}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {period.hours.map(h => (
                    <HourChip
                      key={`start-${h}`}
                      hour={h}
                      selected={h === startHour ? 'start' : null}
                      inRange={rangeHours.has(h) && h !== startHour && h !== endHour - 1}
                      disabled={isStartHourDisabled?.(h)}
                      onClick={setStart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TimeSection>

        <TimeSection
          step="2"
          tone="end"
          icon={Flag}
          title="Ends at"
          value={formatOpenPlayHour(endHour)}
        >
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {END_HOURS.filter(h => h > startHour).map(h => (
              <HourChip
                key={`end-${h}`}
                hour={h}
                selected={h === endHour ? 'end' : null}
                disabled={isEndHourDisabled?.(h)}
                onClick={setEnd}
              />
            ))}
          </div>
          <p className="text-[11px] text-brand-navy-800/60 mt-3 font-medium">
            Example: {formatOpenPlayHour(startHour)} start → {formatOpenPlayHour(endHour)} end = {duration} hour{duration !== 1 ? 's' : ''}.
          </p>
        </TimeSection>
      </div>
    </div>
  )
}
