import { CreditCard, Phone } from 'lucide-react'
import { parseBookingNotes, TRAINER_RATE, trainerExtraTotal } from '../../utils/parseBookingNotes'
import { getBookingEndHour } from '../../utils/bookingHours'
import { getAdminBookingMeta } from '../../utils/bookingStatus'

function formatHour(h) {
  if (h === 0) return '12MN'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function PaymentRow({ label, value, mono = false }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-4 text-[12px]">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className={`font-medium text-gray-900 dark:text-white text-right break-all ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

/**
 * Structured booking body for admin lists — booker name first, sign-in account secondary.
 */
export default function AdminBookingCardDetails({ booking }) {
  const {
    start_hour,
    duration_hours,
    notes,
    contact_phone,
    profiles,
    payment_reference,
    payment_sender_name,
    payment_sender_platform,
    payment_methods,
    courts,
  } = booking

  const isKtv = courts?.type === 'ktv'
  const rentalLabel = isKtv ? 'Room rental' : 'Court rental'

  const meta = getAdminBookingMeta(booking)
  const { bookerName, paddles, balls, trainerHours, trainerHeads, extrasTotal, userNotes } = parseBookingNotes(notes, {
    durationHours: duration_hours,
  })
  const accountName = profiles?.full_name?.trim() || ''
  const booker = bookerName || accountName || 'Unknown'
  const displayPhone = contact_phone?.trim() || profiles?.phone?.trim() || ''
  const showAccount = Boolean(
    accountName && bookerName && accountName.toLowerCase() !== bookerName.toLowerCase(),
  )

  const endHour = getBookingEndHour(start_hour, duration_hours)

  const { payment_collected } = booking
  const isAdminReserve = payment_reference === 'ADMIN'
  const hasPaymentInfo = meta.category === 'paid_verify'
    || (!isAdminReserve && (payment_sender_name || payment_reference))

  const paymentBoxClass = meta.category === 'paid_verify'
    ? 'bg-amber-50/90 dark:bg-amber-900/20 border-amber-200/80 dark:border-amber-900/40'
    : meta.category === 'unpaid'
      ? 'bg-orange-50/70 dark:bg-orange-900/20 border-orange-200/70 dark:border-orange-900/40'
      : 'bg-gray-50/80 dark:bg-slate-800/80 border-gray-100 dark:border-slate-700'

  return (
    <div className="mt-2.5 space-y-2">
      <div>
        <p className="admin-display text-[1.125rem] text-gray-900 dark:text-white leading-tight">
          {booker}
        </p>
        {showAccount && (
          <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
            Account: <span className="text-gray-400/90">{accountName}</span>
          </p>
        )}
        {displayPhone && (
          <a
            href={`tel:${displayPhone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-gold-600 dark:text-brand-gold-400 mt-1 hover:underline"
          >
            <Phone size={12} />
            {displayPhone}
            {!contact_phone?.trim() && profiles?.phone ? ' · from profile' : ''}
          </a>
        )}
      </div>

      <p className="text-[12px] text-gray-600 dark:text-gray-300 font-medium tabular-nums">
        {formatHour(start_hour)} – {formatHour(endHour)}
        <span className="text-gray-400 mx-1.5">·</span>
        {duration_hours}h
      </p>

      {userNotes && (
        <p className="text-[12px] text-gray-500 dark:text-gray-400 italic leading-snug">
          &ldquo;{userNotes}&rdquo;
        </p>
      )}

      <div className="bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/80 rounded-lg p-3 space-y-1.5 !mt-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Price Breakdown</p>
          <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-300">
            <span>{rentalLabel} ({duration_hours}h)</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ₱{(booking.total_price - extrasTotal).toLocaleString()}
            </span>
          </div>
          {paddles > 0 && (
            <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-300">
              <span>Paddle rental ({paddles} × ₱100)</span>
              <span className="font-semibold text-gray-900 dark:text-white">₱{(paddles * 100).toLocaleString()}</span>
            </div>
          )}
          {balls > 0 && (
            <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-300">
              <span>Ball rental ({balls} × ₱100)</span>
              <span className="font-semibold text-gray-900 dark:text-white">₱{(balls * 100).toLocaleString()}</span>
            </div>
          )}
          {trainerHours > 0 && trainerHeads > 0 && (
            <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-300">
              <span>Trainer ({trainerHours}h × {trainerHeads} pax × ₱{TRAINER_RATE}/hr)</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₱{trainerExtraTotal(trainerHours, trainerHeads).toLocaleString()}
              </span>
            </div>
          )}
        </div>

      {meta.category === 'unpaid' && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-800 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 rounded-full px-2.5 py-1">
          No payment submitted yet
        </div>
      )}

      {meta.category === 'paid_verify' && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-full px-2.5 py-1">
          Payment submitted — verify reference below
        </div>
      )}

      {isAdminReserve && payment_collected === true && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-gold-700 bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-navy-700/40 rounded-full px-2.5 py-1">
          ✅ Payment collected
        </div>
      )}
      {meta.category === 'admin_unpaid' && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/40 rounded-full px-2.5 py-1">
          ⏳ Admin reservation · payment not collected
        </div>
      )}

      {hasPaymentInfo && (
        <div className={`rounded-xl px-3.5 py-3 border space-y-2 ${paymentBoxClass}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
            <CreditCard size={11} />
            {meta.category === 'paid_verify' ? 'Payment to verify' : 'Payment details'}
          </p>
          <div className="space-y-1.5">
            <PaymentRow label="Method" value={payment_methods?.name} />
            <PaymentRow label="Sender name" value={payment_sender_name} />
            <PaymentRow label="Sent from" value={payment_sender_platform} />
            <PaymentRow label="Reference" value={isAdminReserve ? null : payment_reference} mono />
          </div>
        </div>
      )}
    </div>
  )
}
