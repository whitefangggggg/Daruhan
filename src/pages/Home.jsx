import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { CONTACT } from '../lib/constants'
import { THEME } from '../config/theme'
import Avatar from '../components/Avatar'
import AppEmoji from '../components/ui/AppEmoji'
import { MapPin } from '../components/ui/Icon'
import AnimateIn from '../components/AnimateIn'
import { isUpcomingConfirmed, sumCompletedHours } from '../utils/bookingLifecycle'
import { getBookingEndHour } from '../utils/bookingHours'
import BookingStatPill from '../components/BookingStatPill'
import { ClipboardList } from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatHour(h) {
  if (h === 0) return '12:00 MN'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

function dateLabel(dateStr) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE, MMM d')
}

export default function Home() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [upcoming, setUpcoming] = useState([])
  const [stats, setStats] = useState({ completed: 0, hoursPlayed: 0 })
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from('bookings')
        .select('*, courts(name, type)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(4),
      supabase
        .from('bookings')
        .select('status, duration_hours, date, start_hour')
        .eq('user_id', user.id),
    ]).then(([upRes, statRes]) => {
      const all = statRes.data || []
      const upcomingConfirmed = (upRes.data || []).filter(isUpcomingConfirmed)
      setUpcoming(upcomingConfirmed)
      setStats({
        completed: all.filter(b => b.status === 'completed').length,
        hoursPlayed: sumCompletedHours(all),
      })
      setLoading(false)
    })
  }, [user?.id, today])

  const firstName = profile?.full_name?.split(' ')[0] || 'Player'

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-gold-200/30 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-brand-gold-100/35 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-64 rounded-full bg-brand-navy-600/10 blur-3xl" />
      </div>

      <AnimateIn delay={0}>
        <div
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-white/10"
          style={{ background: THEME.gradients.navy }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brand-gold-400/15 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/profile" className="relative flex-shrink-0 group ring-2 ring-brand-gold-400/40 rounded-full">
                <Avatar user={user} profile={profile} size="lg" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-gold-400 border-2 border-brand-navy-900 rounded-full" />
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-medium text-brand-gold-200/90">{getGreeting()}</p>
                <h1 className="text-xl sm:text-2xl font-extrabold leading-tight truncate flex items-center gap-2">
                  {firstName}
                  <AppEmoji name="wave" size={24} />
                </h1>
                <p className="text-sm text-brand-gold-100/80 mt-1 truncate">Ready when you are — book a court in a few taps.</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-brand-gold-200/90 hidden sm:block flex-shrink-0 text-right leading-snug">
              {format(new Date(), 'EEE')}
              <span className="block text-white text-sm mt-0.5">{format(new Date(), 'MMM d')}</span>
            </p>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={80}>
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-0.5">On the court</p>
          <div className="grid grid-cols-2 gap-3">
            <BookingStatPill
              icon={<span className="text-base font-extrabold text-brand-navy-600 dark:text-brand-gold-400 tabular-nums">⏱</span>}
              label="Hours played"
              value={loading ? '—' : stats.hoursPlayed}
              accent="border-brand-gold-200 dark:border-brand-navy-700 bg-gradient-to-br from-brand-gold-50/90 to-white dark:from-slate-800 dark:to-slate-800/80"
            />
            <BookingStatPill
              icon={<span className="text-base">🏁</span>}
              label="Sessions done"
              value={loading ? '—' : stats.completed}
              accent="border-brand-gold-200/80 dark:border-brand-navy-700 bg-gradient-to-br from-brand-cream to-white dark:from-slate-800 dark:to-slate-800/80"
            />
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={140}>
        <div>
          <p className="text-xs font-bold text-brand-gold-600/80 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="h-px flex-1 w-10 bg-gradient-to-r from-transparent to-brand-gold-200" />
            Quick actions
            <span className="h-px flex-1 w-10 bg-gradient-to-l from-transparent to-brand-gold-200" />
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="relative overflow-hidden rounded-2xl p-5 text-left group shadow-md border border-brand-gold-400/20 transition-shadow duration-150 hover:shadow-lg"
              style={{ background: THEME.gradients.navy }}
            >
              <div className="absolute -right-2 -top-2 w-24 h-24 rounded-full bg-brand-gold-400/20 blur-xl group-hover:bg-brand-gold-400/30 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold-300/0 via-brand-gold-400/60 to-brand-gold-300/0 opacity-80" />
              <span className="relative mb-2 block drop-shadow-sm"><AppEmoji name="court" size={30} /></span>
              <p className="relative font-bold text-white text-sm">Book</p>
              <p className="relative text-brand-gold-200/90 text-xs mt-0.5">Court or KTV</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="relative overflow-hidden rounded-2xl p-5 text-left border border-brand-gold-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 backdrop-blur-sm shadow-md transition-shadow duration-150 hover:shadow-lg group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-gold-50/80 via-transparent to-brand-cream/50 dark:from-brand-navy-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              <span className="relative mb-2 block text-brand-gold-600 dark:text-brand-gold-400">
                <ClipboardList size={26} strokeWidth={2} />
              </span>
              <p className="relative font-bold text-gray-900 dark:text-white text-sm">My Bookings</p>
              <p className="relative text-gray-500 dark:text-gray-400 text-xs mt-0.5">Track reservations</p>
            </button>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={170}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-brand-gold-600/80 uppercase tracking-widest">Upcoming</p>
            {upcoming.length > 0 && (
              <Link to="/my-bookings" className="text-xs font-semibold text-brand-gold-500 hover:text-brand-gold-600 hover:underline">
                See all →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 p-8 flex items-center justify-center gap-3 shadow-sm">
              <div className="w-5 h-5 border-2 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-gradient-to-b from-white to-brand-gold-50/40 dark:from-slate-800 dark:to-slate-800/80 p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner border border-brand-gold-200 dark:border-slate-600 bg-gradient-to-br from-brand-gold-100 to-brand-gold-200 dark:from-brand-navy-800 dark:to-brand-navy-700">
                <AppEmoji name="court" size={34} />
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">No upcoming bookings</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Courts are open — grab a slot and we&apos;ll see you on the court.</p>
              <button type="button" onClick={() => navigate('/book')} className="btn-primary text-sm">
                Book now
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map(b => (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-2xl border border-brand-gold-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800 backdrop-blur-sm px-4 py-3.5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-brand-gold-300 transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-brand-gold-400 to-brand-gold-600" />
                  <div className="flex-shrink-0 w-12 text-center rounded-xl py-2 ml-1 border border-brand-gold-200 dark:border-slate-600 bg-gradient-to-br from-brand-gold-50 to-brand-gold-100 dark:from-slate-700 dark:to-slate-600">
                    <p className="text-[10px] font-bold text-brand-gold-600 dark:text-brand-gold-400 leading-none tracking-wide">
                      {format(parseISO(b.date), 'MMM').toUpperCase()}
                    </p>
                    <p className="text-lg font-extrabold text-brand-navy-900 dark:text-white leading-none mt-0.5">
                      {format(parseISO(b.date), 'd')}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <AppEmoji name={b.courts?.type === 'ktv' ? 'microphone' : 'court'} size={16} />
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{b.courts?.name}</p>
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-brand-gold-600 dark:text-brand-gold-400 bg-brand-gold-50 dark:bg-brand-navy-900/40 border border-brand-gold-200 dark:border-brand-navy-700 px-2 py-0.5 rounded-full">
                        {dateLabel(b.date)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatHour(b.start_hour)} → {formatHour(getBookingEndHour(b.start_hour, b.duration_hours))} · {b.duration_hours}h
                    </p>
                  </div>

                  <p className="font-bold text-brand-gold-600 text-sm flex-shrink-0 tabular-nums">
                    ₱{Number(b.total_price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimateIn>

      <AnimateIn delay={260}>
        <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-gradient-to-r from-white via-brand-gold-50/30 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-brand-gold-200 dark:border-slate-600 shadow-sm flex-shrink-0">
              <MapPin size={20} className="text-brand-gold-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{CONTACT.address}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{CONTACT.addressNote}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <a
              href={CONTACT.waze}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-brand-navy-900 dark:text-white border border-brand-gold-200 hover:bg-brand-gold-50 dark:hover:bg-brand-navy-900/30 transition-colors shadow-sm"
            >
              Waze
            </a>
            <a
              href={CONTACT.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-brand-navy-900 dark:text-white border border-brand-gold-200 hover:bg-brand-gold-50 dark:hover:bg-brand-navy-900/30 transition-colors shadow-sm"
            >
              Maps
            </a>
          </div>
        </div>
      </AnimateIn>
    </div>
  )
}
