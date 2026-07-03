import { useEffect, useMemo, useState, useCallback } from 'react'
import { format, endOfMonth, parseISO, addMonths } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import TimeSlotPicker from './TimeSlotPicker'
import { useAvailability } from '../hooks/useAvailability'
import { calculateTotal, calculateKtvTotal, getKtvRateForHour, getKtvThemeForHour, KTV_RATE_BRACKETS } from '../lib/pricing'
import { canStartOnAllCourts, getHoursFullyOccupied, getMaxBookableDuration, getMaxDurationForDate } from '../utils/bookingHours'
import { SITE } from '../config/site'
import { StatusMessage, X } from './ui/Icon'
import BookingConfirmModal from './BookingConfirmModal'
import { CalendarPlus, Minus, Plus, Repeat } from 'lucide-react'
import { scaleIn, fadeIn, transition } from '../lib/motion'
import {
  countReservationDates,
  buildAdminReservationRpcParams,
} from '../utils/adminReservationDates'

const SOFT_EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

function formatRpcError(message) {
  if (!message) return 'Could not create reservation.'
  if (message.includes('NO_SLOTS_CREATED'))
    return 'No slots were available — chosen courts may already be booked on those dates.'
  if (message.includes('BOOKER_NAME_REQUIRED')) return 'Enter who this reservation is for.'
  if (message.includes('INVALID_DATE_RANGE')) return 'End date must be on or after the start date.'
  if (message.includes('INVALID_DURATION')) return 'Duration must be between 1 and 24 hours.'
  if (message.includes('Could not find the function'))
    return 'Database setup missing — run migration 012_admin_payment_collected.sql in Supabase.'
  return message
}

function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-base leading-none">{icon}</span>}
      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-700">{children}</p>
    </div>
  )
}

function DurationStepper({ value, onChange, max = 24 }) {
  const raw = String(value)
  const [inputVal, setInputVal] = useState(raw)

  useEffect(() => { setInputVal(String(value)) }, [value])

  function commit(str) {
    const n = parseInt(str, 10)
    if (!isNaN(n) && n >= 1 && n <= max) onChange(n)
    else setInputVal(String(value))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 disabled:opacity-40 transition-colors text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center"
        aria-label="Decrease duration"
      >
        <Minus size={16} />
      </button>
      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          min={1}
          max={max}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(inputVal) }}
          className="w-14 text-center font-bold text-lg text-gray-900 dark:text-white rounded-xl border-2 border-gray-200 dark:border-slate-700 focus:border-brand-gold-500 focus:outline-none py-1.5 bg-white dark:bg-slate-800"
          aria-label="Duration in hours"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">hour{value !== 1 ? 's' : ''}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 disabled:opacity-40 transition-colors text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center"
        aria-label="Increase duration"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

function PaymentChoice({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border-2 text-sm font-semibold transition-all ${
          value === true
            ? 'bg-brand-gold-500 border-brand-gold-500 text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-brand-gold-300 hover:bg-brand-gold-50/60'
        }`}
      >
        <span className="text-xl leading-none">{value === true ? '✅' : '💵'}</span>
        <span>Already paid</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border-2 text-sm font-semibold transition-all ${
          value === false
            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/60 dark:hover:bg-amber-900/20'
        }`}
      >
        <span className="text-xl leading-none">{value === false ? '⏳' : '🕐'}</span>
        <span>Not yet paid</span>
      </button>
    </div>
  )
}

export default function AdminReserveModal({
  open,
  onClose,
  selectedDate,
  courts = [],
  onSuccess,
  venueType = 'court',
}) {
  const isKtv = venueType === 'ktv'
  const unitLabel = isKtv ? 'room' : 'court'
  const unitLabelCap = isKtv ? 'Room' : 'Court'
  const unitIcon = isKtv ? '🎤' : '🏓'
  const operatingHours = isKtv ? SITE.ktv.operatingHours : SITE.venue.operatingHours
  const priceForRange = useCallback(
    (start, dur) => (isKtv ? calculateKtvTotal(dur) : calculateTotal(start, dur)),
    [isKtv],
  )
  const [bookerName, setBookerName]     = useState('')
  const [selectedCourtIds, setSelectedCourtIds] = useState([])
  const [startHour, setStartHour]       = useState(null)
  const [durationHours, setDurationHours] = useState(3)
  const [paymentCollected, setPaymentCollected] = useState(null)
  const [repeatWeekly, setRepeatWeekly] = useState(false)
  const [endDate, setEndDate]           = useState(selectedDate)
  const [adminNotes, setAdminNotes]     = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState(null)
  const [result, setResult]             = useState(null)
  const [successPromptOpen, setSuccessPromptOpen] = useState(false)

  const allCourtIds       = useMemo(() => courts.map(c => c.id), [courts])
  const allCourtsSelected = selectedCourtIds.length === allCourtIds.length && allCourtIds.length > 0

  function resetFormFields() {
    setSelectedCourtIds([...allCourtIds])
    setEndDate(format(endOfMonth(parseISO(selectedDate)), 'yyyy-MM-dd'))
    setError(null)
    setResult(null)
    setBookerName('')
    setAdminNotes('')
    setRepeatWeekly(false)
    setStartHour(null)
    setDurationHours(3)
    setPaymentCollected(null)
  }

  // Clamp duration when a late start time limits how long the block can run
  useEffect(() => {
    if (startHour == null) return
    const max = getMaxBookableDuration(startHour, blockedHours, operatingHours)
    if (durationHours > max) setDurationHours(Math.max(1, max))
  }, [startHour, durationHours, blockedHours, operatingHours])

  // Reset on open
  useEffect(() => {
    if (!open) return
    setSuccessPromptOpen(false)
    resetFormFields()
  }, [open, selectedDate, allCourtIds])

  // Keyboard + scroll lock
  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape' && !submitting && !successPromptOpen) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, submitting, successPromptOpen])

  // Availability
  const courtIdsForAvail = selectedCourtIds.length ? selectedCourtIds : allCourtIds
  const {
    perCourtOccupied,
    pastHours,
    blockedHours,
    loading: availabilityLoading,
  } = useAvailability(courtIdsForAvail, open ? selectedDate : null, operatingHours)

  const availabilityReady = courtIdsForAvail.length > 0
    && perCourtOccupied.length === courtIdsForAvail.length

  const unavailableHours = useMemo(() => {
    if (!availabilityReady) return new Set()
    return getHoursFullyOccupied(perCourtOccupied)
  }, [perCourtOccupied, availabilityReady])

  const canStartAt = useCallback((hour, dur) => {
    if (!availabilityReady) return false
    return canStartOnAllCourts(hour, dur, perCourtOccupied, blockedHours, operatingHours)
  }, [perCourtOccupied, blockedHours, availabilityReady, operatingHours])

  // Derived
  const pricePerCourt = startHour != null ? priceForRange(startHour, durationHours) : 0
  const dateCount     = countReservationDates(selectedDate, endDate, repeatWeekly)
  const totalSlots    = dateCount * selectedCourtIds.length
  const totalRevenue  = pricePerCourt * totalSlots
  const weekdayLabel  = format(parseISO(selectedDate), 'EEEE')
  const dateLabel     = format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')
  const maxDuration = startHour != null
    ? getMaxBookableDuration(startHour, blockedHours, operatingHours)
    : getMaxDurationForDate(blockedHours, operatingHours)

  function toggleCourt(id) {
    setSelectedCourtIds(prev => {
      const next = prev.includes(id)
        ? (prev.length === 1 ? prev : prev.filter(c => c !== id))
        : [...prev, id]
      return next
    })
    setStartHour(prev => (prev != null && canStartAt(prev, durationHours) ? prev : null))
  }

  function selectAllCourts() {
    setSelectedCourtIds([...allCourtIds])
    setStartHour(prev => (prev != null && canStartAt(prev, durationHours) ? prev : null))
  }

  function setDuration(h) {
    const capped = Math.min(h, maxDuration)
    setDurationHours(capped)
    setStartHour(prev => (prev != null && canStartAt(prev, capped) ? prev : null))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!bookerName.trim() || !selectedCourtIds.length || startHour == null) return

    setSubmitting(true)
    setError(null)
    setResult(null)

    const { data, error: rpcError } = await supabase.rpc(
      'admin_create_reservations',
      buildAdminReservationRpcParams({
        selectedDate,
        endDate,
        repeatWeekly,
        startHour,
        durationHours,
        courtIds: selectedCourtIds,
        bookerName,
        adminNotes,
        paymentCollected,
      }),
    )

    setSubmitting(false)

    if (rpcError) {
      setError(formatRpcError(rpcError.message))
      return
    }

    setResult(data)
    setSuccessPromptOpen(true)
    onSuccess?.(data)
  }

  function handleAddAnotherReservation() {
    setSuccessPromptOpen(false)
    resetFormFields()
  }

  function handleViewBookings() {
    setSuccessPromptOpen(false)
    onClose()
  }

  const successDescription = result
    ? `${result.inserted} slot${result.inserted !== 1 ? 's' : ''} created${
        result.skipped > 0 ? ` · ${result.skipped} skipped` : ''
      }. Do you still want to add reservations?`
    : 'Do you still want to add reservations?'

  const canSubmit = Boolean(
    bookerName.trim() && selectedCourtIds.length && startHour != null
    && !availabilityLoading && !submitting && courts.length > 0,
  )

  if (!open) return null

  return (
    <>
    <motion.div
      className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center lg:p-6"
      style={{ background: 'rgba(10,18,36,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={submitting || successPromptOpen ? undefined : onClose}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeIn}
      transition={transition.fast}
    >
      <motion.div
        className={[
          'w-full flex flex-col min-h-0 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden',
          'rounded-t-[2rem] max-h-[94dvh]',
          'lg:rounded-[1.75rem] lg:max-w-5xl lg:max-h-[min(90dvh,820px)]',
        ].join(' ')}
        style={{
          background: 'linear-gradient(160deg,rgba(255,255,255,0.98) 0%,rgba(240,253,244,0.96) 100%)',
        }}
        onClick={e => e.stopPropagation()}
        variants={scaleIn}
        transition={transition.medium}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-reserve-title"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between gap-4 px-5 lg:px-8 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-600 mb-0.5">
              Admin · New {isKtv ? 'KTV' : ''} Reservation
            </p>
            <h2
              id="admin-reserve-title"
              className="admin-display text-xl lg:text-2xl text-gray-900 dark:text-white leading-tight"
            >
              Add Booking
              <span className="ml-2 text-sm font-normal text-gray-400 normal-case tracking-normal">
                {dateLabel}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || successPromptOpen}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {courts.length === 0 ? (
          <div className="px-5 py-6">
            <StatusMessage type="error">No active {unitLabel}s found. Add {unitLabel}s in Supabase first.</StatusMessage>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain admin-scroll lg:overflow-hidden lg:flex lg:flex-col">
          <form
            id="admin-reserve-form"
            onSubmit={handleSubmit}
            className="flex flex-col lg:flex-1 lg:min-h-0 lg:flex-row lg:overflow-hidden"
          >
            {/* ── LEFT PANEL ── */}
            <div className="flex-shrink-0 lg:w-[300px] xl:w-[320px] lg:overflow-y-auto lg:admin-scroll px-5 lg:px-6 py-5 lg:border-r border-gray-100 dark:border-slate-700 space-y-6">

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <StatusMessage type="error">{error}</StatusMessage>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 1. Booker name */}
              <div>
                <SectionLabel icon="👤">Who is this for?</SectionLabel>
                <input
                  type="text"
                  value={bookerName}
                  onChange={e => setBookerName(e.target.value)}
                  placeholder="e.g. Ggift, Bas Quano"
                  required
                  autoComplete="off"
                  autoFocus
                  className="input-field w-full"
                />
              </div>

              {/* 2. Courts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel icon={unitIcon}>{unitLabelCap}s</SectionLabel>
                  {!allCourtsSelected && allCourtIds.length > 1 && (
                    <button
                      type="button"
                      onClick={selectAllCourts}
                      className="text-[11px] font-semibold text-brand-gold-700 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-200 -mt-3"
                    >
                      Select all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {courts.map(court => {
                    const active = selectedCourtIds.includes(court.id)
                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => toggleCourt(court.id)}
                        className={`${isKtv ? 'min-w-[4.5rem]' : 'flex-1'} py-3 px-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                          active
                            ? 'bg-brand-gold-500 border-brand-gold-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-brand-gold-300'
                        }`}
                      >
                        {court.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Duration */}
              <div>
                <SectionLabel icon="⏱">Duration</SectionLabel>
                <DurationStepper value={durationHours} onChange={setDuration} max={maxDuration} />
                <p className="text-[11px] text-gray-400 mt-2">
                  {startHour != null
                    ? `Up to ${maxDuration}h from this start time (same day).`
                    : 'Type 1–24, or pick a start time first to see the limit.'}
                </p>
              </div>

              {/* 4. Payment status */}
              <div>
                <SectionLabel icon="💰">Was payment collected?</SectionLabel>
                <PaymentChoice value={paymentCollected} onChange={setPaymentCollected} />
                {paymentCollected === null && (
                  <p className="text-[11px] text-gray-400 mt-2">You can update this later from the booking list.</p>
                )}
              </div>

              {/* 5. Repeat weekly */}
              <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60 p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={repeatWeekly}
                    onChange={e => setRepeatWeekly(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-brand-gold-600 focus:ring-brand-gold-500"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                      <Repeat size={14} className="text-brand-gold-600 flex-shrink-0" />
                      Repeat every {weekdayLabel}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Books the same slot weekly until the end date.
                    </span>
                  </span>
                </label>
                <AnimatePresence>
                  {repeatWeekly && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Until
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={selectedDate}
                        max={format(addMonths(parseISO(selectedDate), 6), 'yyyy-MM-dd')}
                        onChange={e => setEndDate(e.target.value)}
                        className="input-field w-full"
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 6. Notes */}
              <div>
                <SectionLabel icon="📝">Notes</SectionLabel>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="e.g. Weekly lease, paid monthly"
                  className="input-field w-full"
                />
              </div>

              {/* 7. Summary — appears once a time is selected */}
              <AnimatePresence>
                {startHour != null && selectedCourtIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={SOFT_EASE}
                    className="rounded-2xl border border-brand-gold-200 dark:border-brand-navy-700/40 bg-brand-gold-50/60 dark:bg-brand-navy-900/20 px-4 py-4 space-y-2"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-700 dark:text-brand-gold-400">Summary</p>
                    <p className="admin-display text-[1.5rem] text-brand-gold-700 dark:text-brand-gold-400 tabular-nums leading-none">
                      ₱{totalRevenue.toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-700 dark:text-gray-200 space-y-0.5">
                      <p>
                        <span className="font-semibold">{selectedCourtIds.length}</span> {unitLabel}{selectedCourtIds.length > 1 ? 's' : ''}
                        <span className="text-gray-400 mx-1.5">·</span>
                        <span className="font-semibold">{durationHours}h</span> per session
                      </p>
                      {repeatWeekly && dateCount > 1 ? (
                        <p>
                          <span className="font-semibold">{dateCount}</span> {weekdayLabel}s
                          <span className="text-gray-400 mx-1.5">·</span>
                          {totalSlots} total slots
                        </p>
                      ) : (
                        <p>{totalSlots} slot{totalSlots !== 1 ? 's' : ''} on this date</p>
                      )}
                    </div>
                    {paymentCollected === true && (
                      <p className="text-xs font-semibold text-brand-gold-700 flex items-center gap-1">
                        ✅ Payment already collected
                      </p>
                    )}
                    {paymentCollected === false && (
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                        ⏳ Payment not yet collected
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── RIGHT PANEL — time grid ── */}
            <div className="flex flex-col lg:flex-1 lg:min-h-0 lg:overflow-hidden">
              <div className="lg:flex-1 lg:overflow-y-auto lg:admin-scroll px-5 lg:px-7 py-5">
                <div className="flex items-baseline justify-between mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-700">
                    Start time
                  </p>
                  <p className="text-xs text-gray-400">
                    Pick a <span className="font-semibold text-gray-600 dark:text-gray-300">{durationHours}h</span> block
                  </p>
                </div>
                {availabilityLoading ? (
                  <div className="flex items-center gap-2 py-16 justify-center text-sm text-gray-400">
                    <span className="w-5 h-5 border-2 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
                    Checking availability…
                  </div>
                ) : (
                  <TimeSlotPicker
                    unavailableHours={unavailableHours}
                    pastHours={pastHours}
                    blockedHours={blockedHours}
                    selectedHour={startHour}
                    duration={durationHours}
                    onSelectHour={setStartHour}
                    canStartAt={canStartAt}
                    gridClassName="grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6"
                    operatingHours={operatingHours}
                    {...(isKtv ? {
                      getRate: getKtvRateForHour,
                      getTheme: getKtvThemeForHour,
                      rateBrackets: KTV_RATE_BRACKETS,
                    } : {})}
                  />
                )}
              </div>

              {/* ── FOOTER ── */}
              <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-5 lg:px-7 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row gap-2 sm:items-center">
                <button
                  type="submit"
                  form="admin-reserve-form"
                  disabled={!canSubmit}
                  className="flex-1 sm:flex-none sm:min-w-[200px] py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-600 hover:to-brand-gold-700 transition-all shadow-sm disabled:opacity-40 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <CalendarPlus size={15} />
                      {repeatWeekly ? 'Create recurring' : 'Create reservation'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting || successPromptOpen}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:bg-slate-800/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                {startHour != null && (
                  <p className="text-xs text-gray-400 sm:ml-auto text-center sm:text-right hidden lg:block">
                    {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
                    {' · '}
                    <span className="font-semibold text-brand-gold-700">₱{totalRevenue.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
          </form>
          </div>
        )}
      </motion.div>
    </motion.div>

    <BookingConfirmModal
      open={successPromptOpen}
      zIndex={80}
      title="Reservation added!"
      description={successDescription}
      confirmLabel="Yes, add another"
      cancelLabel="No, view bookings"
      onConfirm={handleAddAnotherReservation}
      onCancel={handleViewBookings}
    />
    </>
  )
}
