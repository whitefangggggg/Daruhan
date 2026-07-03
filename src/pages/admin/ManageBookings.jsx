import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { refreshBookingStatuses } from '../../lib/bookingMaintenance'
import toast from 'react-hot-toast'
import { AdminBookingsSkeleton } from '../../components/admin/AdminSkeleton'
import AppEmoji from '../../components/ui/AppEmoji'
import AdminReserveModal from '../../components/AdminReserveModal'
import BookingConfirmModal from '../../components/BookingConfirmModal'
import AdminBookingCardDetails from '../../components/admin/AdminBookingCardDetails'
import { Check, StatusMessage, X } from '../../components/ui/Icon'
import {
  ADMIN_DAY_FILTERS,
  ADMIN_LIST_SECTIONS,
  CALENDAR_DOT_CLASS,
  countBookingsByCategory,
  countPaymentFilters,
  getAdminBookingMeta,
  getAdminDayFilterMeta,
  getCalendarDotCategory,
  groupBookingsByCategory,
  matchesAdminBookingFilter,
  sortAdminBookingsForDisplay,
  summarizePaidUnpaid,
} from '../../utils/bookingStatus'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const SOFT_SPRING = { type: 'spring', stiffness: 240, damping: 28, mass: 0.7 }
const SOFT_EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function ManageBookings({ venueType = 'court' }) {
  const isKtv = venueType === 'ktv'
  const unitLabel = isKtv ? 'room' : 'court'
  const unitEmoji = isKtv ? 'microphone' : 'court'
  const pageTitle = isKtv ? 'KTV Bookings' : 'Bookings'
  const kicker = isKtv ? 'Admin · KTV' : 'Admin · Bookings'

  const [viewMonth, setViewMonth] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dayFilter, setDayFilter] = useState('all')
  const [fetchError, setFetchError] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [reserveOpen, setReserveOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const fetchMonth = useCallback(async (month) => {
    setLoading(true)
    setFetchError(null)
    await refreshBookingStatuses()
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(full_name, phone), courts!inner(name, type), payment_methods(name, account_name)')
      .eq('courts.type', venueType)
      .gte('date', format(startOfMonth(month), 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(month), 'yyyy-MM-dd'))
      .order('start_hour', { ascending: true })
    if (error) setFetchError(error.message)
    else setBookings(data ?? [])
    setLoading(false)
  }, [venueType])

  useEffect(() => { fetchMonth(viewMonth) }, [viewMonth, fetchMonth])

  useEffect(() => {
    supabase
      .from('courts')
      .select('id, name')
      .eq('is_active', true)
      .eq('type', venueType)
      .order('name')
      .then(({ data }) => setCourts(data ?? []))
  }, [venueType])

  function handleReserveSuccess() {
    fetchMonth(viewMonth)
  }

  async function updateBooking(id, patch) {
    setUpdating(id)
    const { error } = await supabase.from('bookings').update(patch).eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Booking updated')
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    }
    setUpdating(null)
  }

  const updateStatus = (id, status) => updateBooking(id, { status })
  const markPaymentCollected = (id) => updateBooking(id, { payment_collected: true })

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(viewMonth)
    const startDow = getDay(firstDay)
    const numDays = getDaysInMonth(viewMonth)
    const days = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= numDays; d++) {
      days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))
    }
    return days
  }, [viewMonth])

  const bookingsByDate = useMemo(() => {
    const map = {}
    bookings.forEach(b => {
      if (!map[b.date]) map[b.date] = []
      map[b.date].push(b)
    })
    return map
  }, [bookings])

  const selectedDayBookings = useMemo(() => {
    return sortAdminBookingsForDisplay(bookingsByDate[selectedDate] ?? [])
  }, [bookingsByDate, selectedDate])

  const filteredDayBookings = useMemo(
    () => sortAdminBookingsForDisplay(
      selectedDayBookings.filter(b => matchesAdminBookingFilter(b, dayFilter)),
      { filter: dayFilter },
    ),
    [selectedDayBookings, dayFilter],
  )

  const groupedDayBookings = useMemo(
    () => groupBookingsByCategory(selectedDayBookings),
    [selectedDayBookings],
  )

  const monthCounts = useMemo(() => countBookingsByCategory(bookings), [bookings])
  const monthRevenue = useMemo(
    () => bookings
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((s, b) => s + Number(b.total_price), 0),
    [bookings],
  )

  const selectedDayDisplay = format(parseLocalDate(selectedDate), 'EEEE, MMMM d')

  const filterCounts = useMemo(
    () => countPaymentFilters(selectedDayBookings),
    [selectedDayBookings],
  )

  const filterTotals = useMemo(
    () => summarizePaidUnpaid(selectedDayBookings),
    [selectedDayBookings],
  )

  const activeFilterMeta = useMemo(
    () => getAdminDayFilterMeta(dayFilter),
    [dayFilter],
  )

  function renderBookingCard(b) {
    const meta = getAdminBookingMeta(b)
    const isBusy = updating === b.id
    const isAdminReserve = b.payment_reference === 'ADMIN'
    const showMarkPaid = meta.category === 'admin_unpaid'
    const verifyLabel = meta.category === 'paid_verify' ? 'Verify & confirm' : 'Verify'

    return (
      <motion.li
        key={b.id}
        layout
        variants={{
          hidden: { opacity: 0, y: 8 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={SOFT_EASE}
        className={`admin-card-flat p-4 transition-opacity ${
          isBusy ? 'opacity-50 pointer-events-none' : ''
        } ${meta.muted ? 'opacity-70' : ''} ${meta.cardClass || ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white text-[14px] flex items-center gap-1.5">
              <AppEmoji name={unitEmoji} size={14} />
              {b.courts?.name}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
              {meta.label}
            </span>
            {isAdminReserve && meta.category !== 'admin_unpaid' && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 px-1.5 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="admin-display text-brand-gold-700 text-base flex-shrink-0 tabular-nums">
            ₱{Number(b.total_price).toLocaleString()}
          </p>
        </div>

        <AdminBookingCardDetails booking={b} />

        {(meta.canVerify || meta.canCancel || showMarkPaid) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100/70 dark:border-slate-700/70 flex-wrap">
            {meta.canVerify && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.12 }}
                onClick={() => updateStatus(b.id, 'confirmed')}
                className="text-[12px] bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 text-white px-3.5 py-2 rounded-lg hover:from-brand-gold-600 hover:to-brand-gold-700 font-semibold transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5"
              >
                <Check size={12} /> {verifyLabel}
              </motion.button>
            )}
            {showMarkPaid && (
              <button
                type="button"
                onClick={() => markPaymentCollected(b.id)}
                className="text-[12px] bg-brand-gold-50 dark:bg-brand-navy-900/30 text-brand-gold-700 dark:text-brand-gold-400 border border-brand-gold-200 dark:border-brand-navy-700/40 px-3.5 py-2 rounded-lg hover:bg-brand-gold-100 dark:hover:bg-brand-navy-900/40 font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                💵 Mark as paid
              </button>
            )}
            {meta.canCancel && (
              <button
                type="button"
                onClick={() => setCancelTarget(b)}
                className="text-[12px] text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3.5 py-2 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>
        )}
      </motion.li>
    )
  }

  function selectDate(dateStr) {
    setSelectedDate(dateStr)
    setDayFilter('all')
  }

  if (loading) return <AdminBookingsSkeleton />

  return (
    <>
      <AnimatePresence>
        {reserveOpen && (
          <AdminReserveModal
            key={selectedDate}
            open={reserveOpen}
            onClose={() => setReserveOpen(false)}
            selectedDate={selectedDate}
            courts={courts}
            onSuccess={handleReserveSuccess}
            venueType={venueType}
          />
        )}
      </AnimatePresence>

    <div className="admin-mobile-scroll lg:h-[calc(100dvh-3.5rem)] lg:min-h-0 lg:overflow-hidden">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 pb-[max(2rem,env(safe-area-inset-bottom))] lg:h-full lg:flex lg:flex-col lg:py-8 lg:pb-8">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SOFT_EASE}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 lg:flex-shrink-0"
        >
          <div>
            <p className="admin-kicker mb-2">{kicker}</p>
            <h1 className="admin-display text-[1.875rem] lg:text-[2.25rem] text-gray-900 dark:text-white leading-tight">
              Manage <span className="gradient-text">{pageTitle}</span>
            </h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap text-[13px]">
              <span className="admin-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-500" />
                {monthCounts.confirmed} confirmed
              </span>
              {monthCounts.paid_verify > 0 && (
                <span className="admin-chip !text-amber-700 dark:!text-amber-400 !border-amber-300/60 dark:!border-amber-800/60 !bg-amber-50/80 dark:!bg-amber-900/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {monthCounts.paid_verify} paid · verify
                </span>
              )}
              {monthCounts.unpaid > 0 && (
                <span className="admin-chip !text-orange-700 dark:!text-orange-400 !border-orange-300/55 dark:!border-orange-800/60 !bg-orange-50/80 dark:!bg-orange-900/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {monthCounts.unpaid} unpaid
                </span>
              )}
              <span className="text-gray-400 font-medium tabular-nums">
                ₱{monthRevenue.toLocaleString()} this month
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 admin-card-flat p-1.5 w-full sm:w-auto sm:flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMonth(m => subMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-brand-gold-50/80 text-gray-500 dark:text-gray-400 hover:text-brand-gold-700 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="min-w-[120px] text-center text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
              {format(viewMonth, 'MMM yyyy')}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth(m => addMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-brand-gold-50/80 text-gray-500 dark:text-gray-400 hover:text-brand-gold-700 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                setViewMonth(today)
                selectDate(format(today, 'yyyy-MM-dd'))
              }}
              className="ml-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-brand-gold-500 text-white hover:bg-brand-gold-600 transition-colors"
            >
              Today
            </button>
          </div>
        </motion.header>

        {fetchError && <StatusMessage type="error" className="mb-4 lg:flex-shrink-0">{fetchError}</StatusMessage>}

        {/* Split layout — only the booking list scrolls (lg+) */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 lg:flex-1 lg:min-h-0">

          {/* Calendar — stays put */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SOFT_EASE, delay: 0.06 }}
            className="self-start"
          >
            <div className="admin-card p-5">
              <div className="grid grid-cols-7 mb-2">
                {DOW_LABELS.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {loading ? null : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`pad-${idx}`} aria-hidden="true" />

                    const dateStr = format(day, 'yyyy-MM-dd')
                    const dayBk = bookingsByDate[dateStr] ?? []
                    const activeCount = dayBk.filter(b => b.status !== 'cancelled').length
                    const dotCategory = activeCount > 0 ? getCalendarDotCategory(dayBk) : null
                    const dotClass = dotCategory ? CALENDAR_DOT_CLASS[dotCategory] : ''
                    const isSelected = selectedDate === dateStr
                    const isCurrentDay = isToday(day)

                    return (
                      <motion.button
                        key={dateStr}
                        type="button"
                        onClick={() => selectDate(dateStr)}
                        whileTap={{ scale: 0.9 }}
                        transition={SOFT_SPRING}
                        className="relative flex flex-col items-center justify-center py-2 rounded-xl text-sm font-medium min-h-[42px] transition-colors"
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="day-pill"
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background: 'linear-gradient(135deg, #065f46, #059669)',
                              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                            }}
                            transition={SOFT_SPRING}
                          />
                        )}
                        <span
                          className={`relative z-10 leading-none ${
                            isSelected
                              ? 'text-white'
                              : isCurrentDay
                              ? 'text-brand-gold-700 font-bold'
                              : 'text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {dotClass && (
                          <span
                            className={`relative z-10 w-1 h-1 rounded-full mt-1 ${
                              isSelected ? 'bg-white/80' : dotClass
                            }`}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-brand-gold-200/60 dark:border-brand-navy-700/40 flex-wrap">
                {[
                  { color: 'bg-amber-500', label: 'Verify' },
                  { color: 'bg-orange-500', label: 'Unpaid' },
                  { color: 'bg-brand-gold-50 dark:bg-brand-navy-900/30', label: 'Paid' },
                  { color: 'bg-gray-300', label: 'Other' },
                ].map(item => (
                  <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* Booking list — only this column scrolls on desktop */}
          <section className="min-w-0 lg:flex lg:flex-col lg:min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SOFT_EASE, delay: 0.1 }}
              className="lg:flex-shrink-0"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-4 flex items-start justify-between gap-3 flex-wrap"
                >
                  <div>
                    <h2 className="admin-display text-xl text-gray-900 dark:text-white">{selectedDayDisplay}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReserveOpen(true)}
                    disabled={courts.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-600 hover:to-brand-gold-700 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    Add reservation
                  </button>
                </motion.div>
              </AnimatePresence>

              {selectedDayBookings.length > 0 && (
                <>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {ADMIN_DAY_FILTERS.map(f => {
                    const isPaid = f.id === 'paid'
                    const isUnpaid = f.id === 'unpaid'
                    const totals = isPaid
                      ? filterTotals.paid
                      : isUnpaid
                        ? filterTotals.unpaid
                        : null

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setDayFilter(f.id)}
                        className={`admin-chip ${dayFilter === f.id ? 'admin-chip-active' : ''} ${f.chipBorder}`}
                      >
                        {f.label}
                        {(isPaid || isUnpaid) ? (
                          <span className="tabular-nums font-semibold">
                            {totals.count}
                            <span className="opacity-70 font-medium ml-1">
                              · ₱{totals.total.toLocaleString()}
                            </span>
                          </span>
                        ) : (
                          <span className="opacity-60 tabular-nums">{filterCounts[f.id] ?? 0}</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={dayFilter}
                    role="status"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={`mb-5 rounded-xl border px-4 py-3.5 sm:px-5 sm:py-4 ${activeFilterMeta.panelClass}`}
                  >
                    <p className={`text-[15px] sm:text-base font-semibold leading-snug ${activeFilterMeta.titleClass}`}>
                      {activeFilterMeta.title}
                    </p>
                    <p className={`text-[13px] sm:text-sm mt-1.5 leading-relaxed max-w-2xl ${activeFilterMeta.bodyClass}`}>
                      {activeFilterMeta.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
                </>
              )}
            </motion.div>

            <div className="pb-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto admin-scroll lg:pr-2 lg:-mr-2 lg:pb-4">
            <AnimatePresence mode="wait">
              {filteredDayBookings.length === 0 ? (
                <motion.div
                  key="empty"
                  className="admin-card-flat p-12 text-center text-gray-400 relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={SOFT_EASE}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-gold-50/30 pointer-events-none" />
                  <CalendarDays size={34} strokeWidth={1.5} className="mx-auto mb-3 opacity-40 text-brand-gold-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 relative z-10">
                    {selectedDayBookings.length === 0
                      ? 'No bookings on this day'
                      : 'No bookings match this filter'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReserveOpen(true)}
                    disabled={courts.length === 0}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-brand-gold-700 dark:text-brand-gold-400 bg-brand-gold-100/50 dark:bg-brand-navy-900/30 border border-brand-gold-200/60 dark:border-brand-navy-700/50 hover:bg-brand-gold-100 dark:hover:bg-brand-navy-900/40 transition-colors disabled:opacity-50 relative z-10"
                  >
                    <Plus size={15} />
                    Add reservation
                  </button>
                </motion.div>
              ) : dayFilter === 'all' ? (
                <motion.div
                  key={`${selectedDate}-grouped`}
                  className="space-y-6"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                >
                  {ADMIN_LIST_SECTIONS.map(section => {
                    const items = groupedDayBookings[section.id]
                    if (!items?.length) return null
                    return (
                      <section key={section.id}>
                        <div className="mb-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {section.title}
                            <span className="opacity-60 font-semibold ml-1.5">({items.length})</span>
                          </p>
                          {section.hint && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{section.hint}</p>
                          )}
                        </div>
                        <motion.ul
                          className="space-y-2.5"
                          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        >
                          {items.map(renderBookingCard)}
                        </motion.ul>
                      </section>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.ul
                  key={`${selectedDate}-${dayFilter}`}
                  className="space-y-2.5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                  }}
                >
                  {filteredDayBookings.map(renderBookingCard)}
                </motion.ul>
              )}
            </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>

      <BookingConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel this booking?"
        description={
          cancelTarget
            ? `This will cancel the ${cancelTarget.courts?.name ?? unitLabel} reservation and free the slot for others.`
            : ''
        }
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
        confirmTone="danger"
        onCancel={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (!cancelTarget) return
          const id = cancelTarget.id
          setCancelTarget(null)
          await updateStatus(id, 'cancelled')
        }}
      />
    </>
  )
}
