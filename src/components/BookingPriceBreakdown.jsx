import { format } from 'date-fns'
import { getBookingEndHour } from '../utils/bookingHours'
import { PADDLE_RATE, BALL_RATE, extrasRentalTotal, trainerExtraTotal } from '../utils/parseBookingNotes'

function formatHour(h) {
  if (h === 0 || h === 24) return '12:00 MN'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export default function BookingPriceBreakdown({
  title,
  subtitle,
  bookingName,
  contactPhone,
  courtName,
  date,
  startHour,
  duration,
  courtCost,
  courtCount = 1,
  paddles = 0,
  balls = 0,
  trainerHours = 0,
  trainerHeads = 0,
  userNotes,
  totalPrice,
  paddleRate = PADDLE_RATE,
  ballRate = BALL_RATE,
  trainerRate,
}) {
  const endHour = getBookingEndHour(startHour, duration)
  const trainerCost = trainerExtraTotal(trainerHours, trainerHeads, trainerRate)

  return (
    <div
      className="rounded-2xl overflow-hidden border border-brand-gold-200 dark:border-slate-700 shadow-md bg-gradient-to-br from-brand-gold-50 via-white to-brand-cream dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/80"
    >
      {title && (
        <div className="px-5 py-4 border-b border-brand-gold-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60">
          <p className="text-xs font-bold text-brand-navy-900 dark:text-brand-gold-400 uppercase tracking-widest">{title}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        {bookingName && (
          <div className="flex justify-between text-sm gap-4">
            <span className="text-gray-600 dark:text-gray-300">Booked under</span>
            <span className="font-semibold text-gray-900 dark:text-white text-right">{bookingName}</span>
          </div>
        )}

        {contactPhone && (
          <div className="flex justify-between text-sm gap-4">
            <span className="text-gray-600 dark:text-gray-300">Contact</span>
            <span className="font-semibold text-gray-900 dark:text-white text-right tabular-nums">{contactPhone}</span>
          </div>
        )}

        <div className="flex justify-between text-sm gap-4">
          <span className="text-gray-600 dark:text-gray-300">Court &amp; date</span>
          <span className="font-semibold text-gray-900 dark:text-white text-right">
            {courtName} · {format(new Date(date + 'T12:00:00'), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex justify-between text-sm gap-4">
          <span className="text-gray-600 dark:text-gray-300">Time</span>
          <span className="font-semibold text-gray-900 dark:text-white text-right">
            {formatHour(startHour)} – {formatHour(endHour)} ({duration}h)
          </span>
        </div>

        <div className="h-px bg-brand-gold-100 dark:bg-slate-700" />

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            {courtCount > 1
              ? `Court rental (${duration}h × ${courtCount} courts)`
              : `Court rental (${duration}h)`}
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">₱{courtCost.toLocaleString()}</span>
        </div>

        {paddles > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Paddle rental ({duration}h × ₱{paddleRate.toLocaleString()}/hr)
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ₱{(duration * paddleRate).toLocaleString()}
            </span>
          </div>
        )}

        {balls > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Ball rental ({duration}h × ₱{ballRate.toLocaleString()}/hr)
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ₱{(duration * ballRate).toLocaleString()}
            </span>
          </div>
        )}

        {trainerHours > 0 && trainerHeads > 0 && trainerRate != null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Trainer ({trainerHours}h × {trainerHeads} pax × ₱{trainerRate.toLocaleString()}/hr)
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ₱{trainerCost.toLocaleString()}
            </span>
          </div>
        )}

        {userNotes && (
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-300">Notes</span>
            <p className="text-gray-700 dark:text-gray-200 mt-1 italic">&ldquo;{userNotes}&rdquo;</p>
          </div>
        )}

        <div className="flex justify-between items-end pt-3 border-t border-brand-gold-200 dark:border-slate-700">
          <span className="text-base font-bold text-gray-800 dark:text-gray-100">Total</span>
          <span className="text-3xl font-extrabold text-brand-gold-600 dark:text-brand-gold-400">
            ₱{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
