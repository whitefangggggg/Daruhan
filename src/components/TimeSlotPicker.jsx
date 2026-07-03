import { useState, useEffect, useMemo } from 'react'
import {
  getRateForHour,
  getThemeForHour,
  RATE_BRACKETS,
  RATE_BRACKET_THEMES,
} from '../lib/pricing'
import {
  getOccupiedHours,
  isBookingRangeFree,
  getBookingEndHour,
  getOperatingDisplayHours,
  getMaxBookableDuration,
  getVenueClosedHours,
} from '../utils/bookingHours'
import { Check } from '../components/ui/Icon'

function formatHourLabel(h) {
  if (h === 0 || h === 24) return '12MN'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function LegendSwatch({ className, dashed = false }) {
  return (
    <span
      className={`w-3.5 h-3.5 rounded shrink-0 ${dashed ? 'border-2 border-dashed bg-stone-50 dark:bg-slate-800 border-stone-300 dark:border-slate-600' : className}`}
      aria-hidden
    />
  )
}

// All cells share the same fixed height class so swapping sub-labels
// (₱500 → Preview → Start) never shifts the grid.
function SlotCell({ compact, children, className = '', ...props }) {
  const base = compact
    ? 'h-[2.75rem] rounded-lg text-[10px] font-bold'
    : 'h-[3.5rem] rounded-xl text-xs font-semibold'
  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center w-full transition-colors ${base} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function SlotDiv({ compact, children, className = '' }) {
  const base = compact
    ? 'h-[2.75rem] rounded-lg text-[10px] font-bold'
    : 'h-[3.5rem] rounded-xl text-xs font-semibold'
  return (
    <div className={`flex flex-col items-center justify-center w-full ${base} ${className}`}>
      {children}
    </div>
  )
}

export default function TimeSlotPicker({
  unavailableHours,
  pastHours = new Set(),
  blockedHours,
  canStartAt: canStartAtOverride,
  selectedHour,
  duration,
  onSelectHour,
  gridClassName,
  compact = false,
  operatingHours,
  getRate = getRateForHour,
  getTheme = getThemeForHour,
  rateBrackets = RATE_BRACKETS,
}) {
  const [hoverHour, setHoverHour] = useState(null)
  const HOURS = useMemo(() => getOperatingDisplayHours(operatingHours), [operatingHours])
  const resolvedGridClass = gridClassName ?? (compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4 sm:grid-cols-6')
  const resolvedBlockedHours = useMemo(() => {
    if (blockedHours) return blockedHours
    const merged = new Set(getVenueClosedHours(operatingHours))
    for (const h of pastHours) merged.add(h)
    return merged
  }, [blockedHours, pastHours, operatingHours])

  const canStartAt = (startH) => (
    canStartAtOverride
      ? canStartAtOverride(startH, duration)
      : getMaxBookableDuration(startH, resolvedBlockedHours, operatingHours) >= duration
        && isBookingRangeFree(startH, duration, unavailableHours)
  )

  function isInRange(startH, h) {
    if (startH == null) return false
    return getOccupiedHours(startH, duration).includes(h)
  }

  useEffect(() => {
    if (selectedHour == null) return
    if (!canStartAt(selectedHour)) onSelectHour(null)
  }, [selectedHour, duration, unavailableHours, resolvedBlockedHours, onSelectHour, canStartAtOverride])

  const activePreview = hoverHour != null && canStartAt(hoverHour) ? hoverHour : selectedHour
  const previewValid  = activePreview != null && canStartAt(activePreview)

  return (
    <div>
      {/* Legend */}
      <div className={`flex flex-wrap gap-x-3 gap-y-1.5 mb-3 ${compact ? 'text-[10px]' : 'text-xs'} text-gray-600 dark:text-gray-300`}>
        <span className="flex items-center gap-1 font-medium">
          <LegendSwatch className="slot-booked rounded" />
          Booked
        </span>
        {!compact && rateBrackets.map(row => {
          const theme = row.theme ?? RATE_BRACKET_THEMES[row.themeId]
          return (
            <span key={row.id} className="flex items-center gap-1">
              <LegendSwatch className={`${theme.bg} border-2 ${theme.border}`} />
              <span className="hidden sm:inline">{row.label}</span>
              <span className="font-semibold">₱{row.rate}/hr</span>
            </span>
          )
        })}
        <span className="flex items-center gap-1 font-medium">
          <LegendSwatch dashed />
          {compact ? 'Blocked' : "Won't fit"}
        </span>
        <span className="flex items-center gap-1 font-semibold text-brand-navy-800 dark:text-brand-gold-400">
          <LegendSwatch className="slot-selected rounded" />
          {compact ? `${duration}h` : `Your ${duration}h block`}
        </span>
      </div>

      {/* Grid */}
      <div className={`grid gap-1.5 sm:gap-2 ${resolvedGridClass}`}>
        {HOURS.map(h => {
          const booked     = unavailableHours.has(h)
          const isPast     = pastHours.has(h)
          const inSelected = isInRange(selectedHour, h)
          const inHover    = hoverHour != null && canStartAt(hoverHour) && isInRange(hoverHour, h) && !inSelected
          const isStart    = h === selectedHour
          const isHoverStart = h === hoverHour && canStartAt(hoverHour)
          const validStart = canStartAt(h)
          const theme      = getTheme(h)
          const rate       = getRate(h)

          if (booked) {
            return (
              <SlotDiv key={h} compact={compact} className="slot-booked cursor-not-allowed select-none">
                <span>{formatHourLabel(h)}</span>
                <span className="text-[9px] opacity-70 mt-0.5 uppercase tracking-wide">Booked</span>
              </SlotDiv>
            )
          }

          if (isPast) {
            return (
              <SlotCell key={h} compact={compact} disabled className="slot-wont-fit cursor-not-allowed opacity-60">
                <span>{formatHourLabel(h)}</span>
                <span className="text-[9px] mt-0.5 uppercase tracking-wide">Past</span>
              </SlotCell>
            )
          }

          if (inSelected) {
            const offset = getOccupiedHours(selectedHour, duration).indexOf(h)
            return (
              <SlotCell
                key={h}
                compact={compact}
                onClick={() => onSelectHour(isStart ? null : h)}
                onMouseEnter={() => setHoverHour(null)}
                className="slot-selected"
              >
                <span>{formatHourLabel(h)}</span>
                <span className="text-[9px] mt-0.5 opacity-90">
                  {isStart ? 'Start' : `+${offset}h`}
                </span>
              </SlotCell>
            )
          }

          if (inHover) {
            return (
              <SlotCell
                key={h}
                compact={compact}
                onClick={() => onSelectHour(hoverHour)}
                onMouseEnter={() => setHoverHour(isHoverStart ? h : hoverHour)}
                onMouseLeave={() => setHoverHour(null)}
                className="slot-preview"
              >
                <span>{formatHourLabel(h)}</span>
                <span className="text-[9px] mt-0.5">Preview</span>
              </SlotCell>
            )
          }

          if (!validStart) {
            const wontFitDuration = getMaxBookableDuration(h, resolvedBlockedHours, operatingHours) < duration
            return (
              <SlotCell
                key={h}
                compact={compact}
                disabled
                className="slot-wont-fit cursor-not-allowed"
                title={
                  wontFitDuration
                    ? `A ${duration}h booking does not fit within operating hours from ${formatHourLabel(h)}`
                    : `A ${duration}h booking here would overlap a booked slot`
                }
              >
                <span>{formatHourLabel(h)}</span>
                <span className="text-[9px] mt-0.5 uppercase tracking-wide">Won&apos;t fit</span>
              </SlotCell>
            )
          }

          return (
            <SlotCell
              key={h}
              compact={compact}
              onClick={() => onSelectHour(h)}
              onMouseEnter={() => setHoverHour(h)}
              onMouseLeave={() => setHoverHour(null)}
              className={`border-2 hover:brightness-[1.03] ${theme.bg} ${theme.border} ${theme.text}`}
            >
              <span>{formatHourLabel(h)}</span>
              <span className={`text-[9px] mt-0.5 tabular-nums ${theme.price}`}>₱{rate}</span>
            </SlotCell>
          )
        })}
      </div>

      {/* Preview strip — always rendered at fixed height to prevent layout shifts */}
      {!compact && (
        <div className="mt-3 h-[3.25rem] flex items-center">
          {previewValid ? (
            <div className="w-full bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-navy-700/40 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                <span className="text-brand-navy-800 dark:text-brand-gold-400 font-semibold inline-flex items-center gap-1 flex-shrink-0">
                  {activePreview === selectedHour
                    ? <><Check size={13} strokeWidth={2.5} /> Selected:</>
                    : 'Preview:'}
                </span>
                <span className="font-medium">
                  {formatHourLabel(activePreview)}
                  {' '}&ndash;{' '}
                  {formatHourLabel(getBookingEndHour(activePreview, duration))}
                  <span className="text-gray-400 ml-1">({duration}h)</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 px-1">Hover a slot to preview, click to select.</p>
          )}
        </div>
      )}
    </div>
  )
}
