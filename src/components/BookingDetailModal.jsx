import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X } from './ui/Icon'
import BookingPriceBreakdown from './BookingPriceBreakdown'
import { getDisplayStatus, STATUS_TONE } from '../utils/bookingStatus'
import { parseBookingNotes } from '../utils/parseBookingNotes'
import { fadeIn, scaleIn, transition } from '../lib/motion'
import { CONTACT } from '../lib/constants'

export default function BookingDetailModal({ booking, onClose, onCancel, cancelling = false }) {
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    setConfirmCancel(false)
  }, [booking?.id])

  if (!booking) return null

  const {
    id,
    status,
    courts,
    date,
    start_hour,
    duration_hours,
    total_price,
    notes,
    contact_phone,
    created_at,
    payment_reference,
    payment_sender_name,
    payment_sender_platform,
    payment_methods,
  } = booking

  const { bookerName, paddles, balls, trainerHours, trainerHeads, extrasTotal, userNotes } = parseBookingNotes(notes, {
    durationHours: duration_hours,
  })
  const displayPhone = contact_phone?.trim() || booking.profiles?.phone?.trim() || ''
  const courtCost = total_price - extrasTotal
  const displayStatus = getDisplayStatus(booking)
  const tone = STATUS_TONE[displayStatus.tone]
  const canCancel = status === 'confirmed' || status === 'processing'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeIn}
      transition={transition.fast}
    >
      <motion.div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={scaleIn}
        transition={transition.medium}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <p className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight">
              {courts?.name ?? 'Booking'}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(parseISO(date), 'MMMM d, yyyy')}
            </p>
            {created_at && (
              <p className="text-xs text-gray-400 mt-1">
                Booked {format(parseISO(created_at), 'MMM d, yyyy · h:mm a')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[75svh] px-5 py-4 space-y-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tone.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone.dot}`} />
            {displayStatus.label}
          </span>

          <BookingPriceBreakdown
            bookingName={bookerName || undefined}
            contactPhone={displayPhone || undefined}
            courtName={courts?.name ?? '—'}
            date={date}
            startHour={start_hour}
            duration={duration_hours}
            courtCost={courtCost}
            paddles={paddles}
            balls={balls}
            trainerHours={trainerHours}
            trainerHeads={trainerHeads}
            userNotes={userNotes}
            totalPrice={total_price}
          />

          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">QR scanned</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-right">
                  {payment_methods?.name ?? '—'}
                </span>
              </div>

              {payment_sender_platform && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Sent from</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-right">
                    {payment_sender_platform}
                  </span>
                </div>
              )}

              {payment_sender_name && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Sender name</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-right">
                    {payment_sender_name}
                  </span>
                </div>
              )}

              {payment_reference ? (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Reference</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-100 text-right break-all">
                    {payment_reference}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Payment reference not yet submitted.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 space-y-2">
          <AnimatePresence mode="wait">
            {canCancel && onCancel && confirmCancel ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={transition.fast}
                className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-red-800 dark:text-red-400">Cancel this booking?</p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  This cannot be undone. Your court slot will be released.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelling}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-gray-300 dark:hover:border-slate-600 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-60"
                  >
                    Keep booking
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(id)}
                    disabled={cancelling}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Cancelling…
                      </>
                    ) : (
                      'Yes, cancel'
                    )}
                  </button>
                </div>
              </motion.div>
            ) : canCancel && onCancel ? (
              <motion.button
                key="cancel-trigger"
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transition.fast}
                onClick={() => setConfirmCancel(true)}
                className="w-full py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Cancel booking
              </motion.button>
            ) : null}
          </AnimatePresence>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-brand-gold-200 dark:hover:border-brand-gold-500 hover:bg-brand-gold-50/50 dark:hover:bg-brand-navy-900/40 transition-colors"
          >
            Close
          </button>

          <a
            href={CONTACT.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 hover:text-brand-gold-600 transition-colors"
          >
            <MessageCircle size={13} />
            Questions or refunds? Message us on Facebook
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}
