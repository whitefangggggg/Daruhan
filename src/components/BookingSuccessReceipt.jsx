import { Link } from 'react-router-dom'
import BookingPriceBreakdown from './BookingPriceBreakdown'
import { Check, MessageCircle } from './ui/Icon'
import { STATUS_TONE } from '../utils/bookingStatus'
import { CONTACT } from '../lib/constants'

const REDIRECT_SECONDS = 5

export { REDIRECT_SECONDS }

export default function BookingSuccessReceipt({
  bookingName,
  contactPhone,
  courtName,
  courtCount = 1,
  date,
  startHour,
  duration,
  courtCost,
  paddles,
  balls,
  trainerHours,
  trainerHeads,
  userNotes,
  totalPrice,
  paymentMethodName,
  paymentReference,
  paymentSenderName,
  paymentSenderPlatform,
  secondsLeft,
  onGoToBookings,
}) {
  const status = { label: 'Paid — waiting for confirmation', tone: 'pending' }
  const tone = STATUS_TONE[status.tone]
  const progress = ((REDIRECT_SECONDS - secondsLeft) / REDIRECT_SECONDS) * 100

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full bg-brand-gold-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-gold-400/30"
          style={{ animation: 'book-success-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <Check size={40} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Booking is set!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          We&apos;ve got your payment details. For the fastest confirmation, message us on Facebook below.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your receipt</p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tone.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            {status.label}
          </span>
        </div>

        <BookingPriceBreakdown
          bookingName={bookingName}
          contactPhone={contactPhone}
          courtName={courtName}
          courtCount={courtCount}
          date={date}
          startHour={startHour}
          duration={duration}
          courtCost={courtCost}
          paddles={paddles}
          balls={balls}
          trainerHours={trainerHours}
          trainerHeads={trainerHeads}
          userNotes={userNotes}
          totalPrice={totalPrice}
        />

        <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 px-4 py-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">Paid via</span>
            <span className="font-semibold text-gray-900 dark:text-white text-right">{paymentMethodName ?? '—'}</span>
          </div>
          {paymentSenderPlatform && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">Sent from</span>
              <span className="font-semibold text-gray-900 dark:text-white text-right">{paymentSenderPlatform}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">Sender name</span>
            <span className="font-semibold text-gray-900 dark:text-white text-right">{paymentSenderName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">Reference no.</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white text-right break-all">{paymentReference}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#1877F2]/30 bg-gradient-to-br from-[#1877F2]/10 via-white to-[#1877F2]/5 px-5 py-6 sm:px-6 sm:py-7 shadow-sm shadow-[#1877F2]/10 space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-[#1877F2]/25">
            <MessageCircle size={22} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">
              Faster confirmation
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-snug mt-1">
              Message us on Facebook that you&apos;ve booked
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              Send us a quick chat on our Facebook page with your booking name and payment reference.
              We&apos;ll confirm your court much faster than waiting for verification alone.
            </p>
          </div>
        </div>

        <a
          href={CONTACT.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full rounded-xl bg-[#1877F2] text-white text-sm sm:text-base font-bold py-3.5 sm:py-4 shadow-lg shadow-[#1877F2]/30 hover:bg-[#166fe5] active:scale-[0.99] transition-all"
        >
          <MessageCircle size={18} strokeWidth={2.25} />
          Chat {CONTACT.facebookLabel}
        </a>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
          Tip: say something like &ldquo;Hi, I just booked — ref {paymentReference}&rdquo;
        </p>
      </div>

      <div className="rounded-2xl border border-brand-gold-200 bg-brand-gold-50/60 px-4 py-4 text-center space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          Track confirmation and updates anytime in{' '}
          <Link to="/my-bookings" className="font-semibold text-brand-gold-600 hover:text-brand-gold-600 underline underline-offset-2">
            My Bookings
          </Link>
          .
        </p>

        <div className="max-w-xs mx-auto space-y-2">
          <div className="h-1.5 rounded-full bg-brand-gold-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-gold-500 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Heading to My Bookings in{' '}
            <span className="font-bold text-brand-gold-600 tabular-nums">{secondsLeft}</span>
            {secondsLeft === 1 ? ' second' : ' seconds'}…
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToBookings}
          className="btn-primary w-full sm:w-auto sm:min-w-[220px] text-sm py-3 rounded-xl font-semibold"
        >
          Go to My Bookings now
        </button>
      </div>
    </div>
  )
}
