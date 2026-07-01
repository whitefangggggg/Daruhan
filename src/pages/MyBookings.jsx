import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import BookingCard from '../components/BookingCard'
import BookingDetailModal from '../components/BookingDetailModal'
import BookingStatPill from '../components/BookingStatPill'
import AppEmoji from '../components/ui/AppEmoji'
import { ClipboardList, MessageCircle, StatusMessage } from '../components/ui/Icon'
import MotionIn, { MotionStagger, MotionItem } from '../components/MotionIn'
import { fadeUp, scaleIn } from '../lib/motion'
import { isSessionEnded, isUpcomingConfirmed } from '../utils/bookingLifecycle'
import { CONTACT } from '../lib/constants'

function byBookedAtDesc(a, b) {
  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
  return bTime - aTime
}

function bySessionDateAsc(a, b) {
  const dateCmp = a.date.localeCompare(b.date)
  if (dateCmp !== 0) return dateCmp
  return (a.start_hour ?? 0) - (b.start_hour ?? 0)
}

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { bookings, loading, error, cancelBooking } = useBookings(user?.id)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  const { processing, upcoming, past, stats } = useMemo(() => {
    const processingList = bookings.filter(b => b.status === 'processing').sort(byBookedAtDesc)
    const upcomingList = bookings.filter(isUpcomingConfirmed).sort(bySessionDateAsc)
    const pastList = bookings
      .filter(b => b.status !== 'processing' && (b.status !== 'confirmed' || isSessionEnded(b)))
      .sort(byBookedAtDesc)

    return {
      processing: processingList,
      upcoming: upcomingList,
      past: pastList,
      stats: {
        total: bookings.filter(b => b.status !== 'cancelled').length,
        upcoming: upcomingList.length,
      },
    }
  }, [bookings])

  async function handleCancel(id) {
    setCancellingId(id)
    const { error } = await cancelBooking(id)
    setCancellingId(null)
    if (error) {
      alert(error)
      return
    }
    setSelectedBooking(null)
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading your bookings…</p>
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailModal
            key={selectedBooking.id}
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onCancel={handleCancel}
            cancelling={cancellingId === selectedBooking.id}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
        <MotionIn className="mb-6" animateOnMount>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My <span className="gradient-text">Bookings</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Sorted by when you booked. Tap a reservation to view details or cancel.
          </p>
        </MotionIn>

        <MotionIn className="mb-8" animateOnMount delay={40}>
          <div className="grid grid-cols-2 gap-3">
            <BookingStatPill
              icon={<ClipboardList size={18} className="text-blue-600 dark:text-blue-400" />}
              label="All bookings"
              value={stats.total}
              accent="border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/90 to-white dark:from-slate-800 dark:to-slate-800/80"
            />
            <BookingStatPill
              icon={<AppEmoji name="court" size={20} />}
              label="Upcoming"
              value={stats.upcoming}
              accent="border-brand-gold-200 dark:border-brand-navy-700 bg-gradient-to-br from-brand-gold-50/90 to-white dark:from-slate-800 dark:to-slate-800/80"
            />
          </div>
        </MotionIn>

        {error && <StatusMessage type="error" className="mb-6">{error}</StatusMessage>}

        {bookings.length === 0 ? (
          <MotionIn animateOnMount delay={80}>
            <div className="card p-12 text-center">
              <div className="mb-4 flex justify-center">
                <AppEmoji name="court" size={56} />
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">No bookings yet</p>
              <p className="text-sm text-gray-400 mb-6">Get out on the court — book your first session today!</p>
              <button
                onClick={() => navigate('/book')}
                className="btn-primary text-sm"
              >
                Book a Court
              </button>
            </div>
          </MotionIn>
        ) : (
          <div className="space-y-10">
            {processing.length > 0 && (
              <MotionIn animateOnMount delay={40}>
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest">Awaiting confirmation</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    You&apos;ve submitted payment details. Staff will verify your reference and move these to <strong className="text-gray-700 dark:text-gray-200">confirmed</strong> once payment matches.
                  </p>
                </div>
                <MotionStagger className="space-y-4" staggerChildren={0.05} delayChildren={0.02} animateOnMount>
                  {processing.map(b => (
                    <MotionItem key={b.id} variants={scaleIn}>
                      <BookingCard
                        booking={b}
                        onClick={() => setSelectedBooking(b)}
                      />
                    </MotionItem>
                  ))}
                </MotionStagger>
              </MotionIn>
            )}

            {upcoming.length > 0 && (
              <MotionIn animateOnMount delay={processing.length > 0 ? 80 : 40}>
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Upcoming</h2>
                <MotionStagger className="space-y-4" staggerChildren={0.05} delayChildren={0.02} animateOnMount>
                  {upcoming.map(b => (
                    <MotionItem key={b.id} variants={scaleIn}>
                      <BookingCard
                        booking={b}
                        onClick={() => setSelectedBooking(b)}
                      />
                    </MotionItem>
                  ))}
                </MotionStagger>
              </MotionIn>
            )}

            {past.length > 0 && (
              <MotionIn animateOnMount delay={100}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Past</h2>
                <MotionStagger className="space-y-4 opacity-75" staggerChildren={0.04} delayChildren={0.02} animateOnMount>
                  {past.map(b => (
                    <MotionItem key={b.id} variants={fadeUp}>
                      <BookingCard
                        booking={b}
                        onClick={() => setSelectedBooking(b)}
                      />
                    </MotionItem>
                  ))}
                </MotionStagger>
              </MotionIn>
            )}
          </div>
        )}
        <MotionIn animateOnMount delay={120}>
          <a
            href={CONTACT.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 flex items-center justify-center gap-2.5 rounded-2xl border border-brand-gold-200 dark:border-brand-gold-900/40 bg-brand-gold-50/60 dark:bg-slate-800 px-5 py-4 text-sm font-medium text-brand-navy-900 dark:text-brand-gold-400 hover:bg-brand-gold-100/70 dark:hover:bg-slate-700 hover:border-brand-gold-200 dark:hover:border-brand-gold-500 transition-colors group"
          >
            <MessageCircle size={16} className="text-brand-gold-500 dark:text-brand-gold-400 flex-shrink-0" />
            <span>
              Questions, refunds, or anything else?{' '}
              <span className="font-semibold underline underline-offset-2 group-hover:text-brand-navy-900 dark:group-hover:text-brand-gold-300">
                Message us on Facebook
              </span>
            </span>
          </a>
        </MotionIn>
      </div>
    </>
  )
}
