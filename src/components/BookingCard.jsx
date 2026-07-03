import { format, parseISO } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import AppEmoji from './ui/AppEmoji'
import { Calendar, Clock } from './ui/Icon'
import { getDisplayStatus, STATUS_TONE } from '../utils/bookingStatus'
import { parseBookingNotes } from '../utils/parseBookingNotes'

function formatHour(h) {
  if (h === 0) return '12:00 MN'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

function ExtrasChip({ children }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
      {children}
    </span>
  )
}

export default function BookingCard({ booking, onClick }) {
  const { courts, date, start_hour, duration_hours, total_price, notes, created_at } = booking

  const displayStatus = getDisplayStatus(booking)
  const tone = STATUS_TONE[displayStatus.tone]
  const parsed = parseBookingNotes(notes)
  const endHour = (start_hour + duration_hours) % 24

  const interactiveProps = onClick
    ? {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown: e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        },
      }
    : {}

  return (
    <article
      className={`booking-card ${onClick ? 'booking-card--interactive' : ''}`}
      {...interactiveProps}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit max-w-full ${tone.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone.dot}`} />
          {displayStatus.label}
        </span>
        <p className="text-2xl font-extrabold tabular-nums leading-none sm:text-right text-brand-gold-600 dark:text-brand-gold-400">
          ₱{Number(total_price).toLocaleString()}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-slate-600 flex-shrink-0">
          <AppEmoji name="court" size={20} />
        </span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          {courts?.name ?? 'Court'}
        </h3>
      </div>

      <div className="rounded-xl bg-gray-50/90 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-4 py-3.5 space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-brand-gold-200 dark:border-slate-600">
            <Calendar size={15} className="text-brand-gold-600" />
          </span>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug pt-1">
            {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-brand-gold-200 dark:border-slate-600">
            <Clock size={15} className="text-brand-gold-600" />
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug pt-1">
            {formatHour(start_hour)}
            <span className="text-gray-400 mx-1.5">→</span>
            {formatHour(endHour)}
            <span className="text-gray-400 ml-1.5">({duration_hours}h)</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {created_at && (
          <span>
            Booked {format(parseISO(created_at), 'MMM d, yyyy · h:mm a')}
          </span>
        )}
        {parsed.bookerName && (
          <>
            {created_at && <span className="text-gray-300" aria-hidden>·</span>}
            <span className="font-medium text-gray-600 dark:text-gray-300">{parsed.bookerName}</span>
          </>
        )}
      </div>

      {(parsed.paddles > 0 || parsed.balls > 0 || parsed.trainerHours > 0 || parsed.userNotes) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {parsed.paddles > 0 && (
            <ExtrasChip>{parsed.paddles} paddle{parsed.paddles > 1 ? 's' : ''}</ExtrasChip>
          )}
          {parsed.balls > 0 && (
            <ExtrasChip>{parsed.balls} ball{parsed.balls > 1 ? 's' : ''}</ExtrasChip>
          )}
          {parsed.trainerHours > 0 && (
            <ExtrasChip>
              Trainer
              {parsed.trainerHeads > 1 ? ` · ${parsed.trainerHeads} pax` : ''}
              {parsed.trainerHours < duration_hours ? ` · ${parsed.trainerHours}h` : ''}
            </ExtrasChip>
          )}
          {parsed.userNotes && (
            <span className="text-xs text-gray-400 italic line-clamp-1 w-full mt-0.5">
              &ldquo;{parsed.userNotes}&rdquo;
            </span>
          )}
        </div>
      )}

      {onClick && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-1 text-sm font-semibold text-brand-gold-600 booking-card__cta">
          View details
          <ChevronRight size={16} strokeWidth={2.5} className="booking-card__cta-icon" />
        </div>
      )}
    </article>
  )
}
