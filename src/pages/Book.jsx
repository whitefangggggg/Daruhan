import { SITE } from '../config/site'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useBlocker } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useAvailability } from '../hooks/useAvailability'
import { calculateTotal, RATE_BRACKETS, RATE_BRACKET_THEMES } from '../lib/pricing'
import UserBookingTimeGrid from '../components/UserBookingTimeGrid'
import PartialCourtConfirmDialog from '../components/PartialCourtConfirmDialog'
import TimeGuideModal from '../components/TimeGuideModal'
import DatePicker from '../components/DatePicker'
import AppEmoji from '../components/ui/AppEmoji'
import { AlertTriangle, Check } from '../components/ui/Icon'
import BookingPriceBreakdown from '../components/BookingPriceBreakdown'
import BookingSuccessReceipt, { REDIRECT_SECONDS } from '../components/BookingSuccessReceipt'
import BookingConfirmModal from '../components/BookingConfirmModal'
import PaymentQrImage from '../components/PaymentQrImage'
import {
  saveBookingDraft,
  loadBookingDraft,
  clearBookingDraft,
  draftHasProgress,
} from '../utils/bookingDraft'
import { TRAINER_RATE, trainerExtraTotal } from '../utils/parseBookingNotes'
import { formatHoldError } from '../utils/bookingHoldErrors'
import { getBookingEndHour, getMaxDurationForStart, getBlockedHoursForDate } from '../utils/bookingHours'
import {
  resolveBookingCourtIds,
  getBookedCourtCount,
  formatCourtSelectionLabel,
  normalizeCourtQuantity,
  maxSelectableCourts,
  MAX_COURT_QUANTITY,
} from '../utils/userBookingCourts'
import {
  computeSlotStates,
  isStartHourValidForCourts,
  shouldShowCourtDowngradeHint,
} from '../utils/slotAvailability'
import { transition as motionTransition } from '../lib/motion'
import gcashLogo from '../assets/gcash-logo.png'
import gotymeLogo from '../assets/gotyme-logo.png'

const PADDLE_RATE = 100
const BALL_RATE = 100

const WIZARD_STEPS = ['Details', 'Time slot', 'Extras', 'Review', 'Payment']

const bookStepVariants = {
  enter: direction => ({
    opacity: 0,
    x: direction >= 0 ? 14 : -14,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: direction => ({
    opacity: 0,
    x: direction >= 0 ? -14 : 14,
  }),
}

const PAYMENT_METHOD_BRAND = {
  gcash: { image: gcashLogo },
  gotyme: { image: gotymeLogo },
}

/** Common PH e-wallets / banks users may send from via InstaPay / PESONet */
const SENDER_PLATFORMS = [
  'GCash',
  'GoTyme',
  'Maya',
  'BPI',
  'BDO',
  'Metrobank',
  'UnionBank',
  'Land Bank',
  'Security Bank',
  'Chinabank',
  'Other',
]

function formatHour(h) {
  if (h === 0 || h === 24) return '12:00 MN'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

function StepLabel({ num, label, done, active }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold transition-colors whitespace-nowrap ${active ? 'text-brand-gold-600 dark:text-brand-gold-400' : done ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        done ? 'bg-brand-gold-500 text-white' : active ? 'bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-gold-600 dark:text-brand-gold-400 border-2 border-brand-gold-400 dark:border-brand-gold-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
      }`}>
        {done ? <Check size={12} strokeWidth={3} /> : num}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  )
}

function TrainerHoursStepper({ value, max, onChange, unit = 'h' }) {
  const display = unit === 'pax'
    ? `${value} ${value === 1 ? 'person' : 'people'}`
    : `${value}h`

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="w-8 h-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 font-bold hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-all flex items-center justify-center text-lg disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[5.5rem] text-center font-extrabold text-gray-800 dark:text-gray-100 tabular-nums text-sm">
        {display}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 font-bold hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-all flex items-center justify-center text-lg disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

function ExtraToggle({ label, sublabel, checked, onChange, emoji, pricePreview, priceDetail }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${
        checked
          ? 'border-brand-gold-200 dark:border-brand-gold-800/50 bg-brand-gold-50/80 dark:bg-brand-navy-900/10'
          : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
          <AppEmoji name={emoji} size={24} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{label}</p>
          <p className="text-xs text-gray-400 leading-snug">{sublabel}</p>
          {checked && pricePreview != null && (
            <p className="text-xs font-bold text-brand-gold-600 dark:text-brand-gold-400 mt-1 tabular-nums">
              +₱{pricePreview.toLocaleString()}
              {priceDetail ? ` · ${priceDetail}` : ' for this booking'}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${checked ? 'Remove' : 'Add'} ${label}`}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors ${
          checked
            ? 'border-brand-gold-500 bg-brand-gold-500'
            : 'border-gray-200 dark:border-slate-600 bg-gray-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function Counter({ label, sublabel, value, onChange, min = 0, max = 20, emoji }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
          <AppEmoji name={emoji} size={24} />
        </span>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{label}</p>
          <p className="text-xs text-gray-400">{sublabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 font-bold hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-all flex items-center justify-center text-lg disabled:opacity-30 disabled:hover:border-gray-200 disabled:dark:hover:border-slate-600"
          disabled={value <= min}>−</button>
        <span className="w-8 text-center font-extrabold text-gray-800 dark:text-gray-100">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 font-bold hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-all flex items-center justify-center text-lg disabled:opacity-30 disabled:hover:border-gray-200 disabled:dark:hover:border-slate-600"
          disabled={value >= max}>+</button>
      </div>
    </div>
  )
}

function RateBracketsReference() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Court rate · per hour</p>
        <p className="text-xs text-gray-400 mt-0.5">Each hour in your booking uses the rate for that time.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {RATE_BRACKETS.map(row => {
          const theme = RATE_BRACKET_THEMES[row.themeId]
          return (
            <div
              key={row.id}
              className={`relative rounded-xl border px-3 py-3 overflow-hidden ${theme.bg} ${theme.border}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${theme.accent}`} />
              <p className={`text-[11px] font-bold uppercase tracking-wide ${theme.text}`}>{row.label}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{row.time}</p>
              <p className={`text-xl font-extrabold mt-2 tabular-nums leading-none ${theme.price}`}>
                ₱{row.rate}
                <span className="text-xs font-semibold">/hr</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaymentMethodBrand({ name }) {
  const key = (name || '').toLowerCase().replace(/\s+/g, '')
  const brand = PAYMENT_METHOD_BRAND[key]

  if (brand?.image) {
    return (
      <img
        src={brand.image}
        alt={name}
        className="h-10 w-auto max-w-[130px] object-contain"
      />
    )
  }

  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join('')

  return (
    <span className="text-lg font-extrabold text-gray-700 dark:text-gray-200 tracking-tight">{initials}</span>
  )
}

export default function Book() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)

  const [courts, setCourts] = useState([])
  const [courtsError, setCourtsError] = useState(null)
  const [courtsLoading, setCourtsLoading] = useState(true)
  const [bookingName, setBookingName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [courtQuantity, setCourtQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState(1)
  const [startHour, setStartHour] = useState(null)
  const [paddles, setPaddles] = useState(0)
  const [balls, setBalls] = useState(0)
  const [trainerHours, setTrainerHours] = useState(0)
  const [trainerHeads, setTrainerHeads] = useState(1)
  const [timeGuideOpen, setTimeGuideOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  /** Same tap must not hit "Continue" twice or land on "Confirm" after the footer swaps (layout stays fixed). */
  const [navBlocked, setNavBlocked] = useState(false)
  const navBlockClearRef = useRef(null)
  /** After landing on review, ignore submit briefly so the finger that pressed Continue cannot confirm. */
  const [confirmReady, setConfirmReady] = useState(false)
  /** 1 = forward (Continue), -1 = back */
  const [stepDirection, setStepDirection] = useState(1)
  /** Row created when moving to payment (holds slot); cancelled if user goes back from payment. */
  const [pendingBookingIds, setPendingBookingIds] = useState([])
  const [assignedHolds, setAssignedHolds] = useState([])
  /**
   * 'select-method' → user picks a wallet
   * 'qr'            → show QR for chosen method
   * 'reference'     → user enters reference + sender name
   */
  const [paymentRefPhase, setPaymentRefPhase] = useState('select-method')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentSenderName, setPaymentSenderName] = useState('')
  const [sendingFromDifferentPlatform, setSendingFromDifferentPlatform] = useState(false)
  const [paymentSenderPlatform, setPaymentSenderPlatform] = useState('')
  const [paymentSenderPlatformOther, setPaymentSenderPlatformOther] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)
  const [paymentMethodsError, setPaymentMethodsError] = useState(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null)
  const [creatingHold, setCreatingHold] = useState(false)
  const [completedBooking, setCompletedBooking] = useState(null)
  const [redirectSeconds, setRedirectSeconds] = useState(REDIRECT_SECONDS)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeDraft, setResumeDraft] = useState(null)
  const [manualLeaveTo, setManualLeaveTo] = useState(null)
  const [partialConfirm, setPartialConfirm] = useState(null)
  const [downgradeHintDismissed, setDowngradeHintDismissed] = useState(
    () => sessionStorage.getItem('daruhan:booking-downgrade-hint-dismissed') === '1',
  )
  const allowNavigationRef = useRef(false)
  const resumeCheckedRef = useRef(false)
  const errorBannerRef = useRef(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultBookingName = profile?.full_name?.trim() ?? ''
  const defaultContactPhone = profile?.phone?.trim() ?? ''

  const courtIdsForBooking = useMemo(() => resolveBookingCourtIds(courts), [courts])

  const { perCourtOccupied, loading: availLoading, error: availError } = useAvailability(courtIdsForBooking, selectedDate)

  const blockedHours = useMemo(() => getBlockedHoursForDate(selectedDate), [selectedDate])

  const slotStates = useMemo(
    () => computeSlotStates({
      duration,
      numCourts: courtQuantity,
      perCourtOccupied,
      pastHours: blockedHours,
    }),
    [duration, courtQuantity, perCourtOccupied, blockedHours],
  )

  const showDowngradeHint = useMemo(
    () => !downgradeHintDismissed && shouldShowCourtDowngradeHint({
      duration,
      perCourtOccupied,
      pastHours: blockedHours,
      numCourts: courtQuantity,
    }),
    [downgradeHintDismissed, duration, perCourtOccupied, blockedHours, courtQuantity],
  )

  const selectableCourtMax = maxSelectableCourts(courts.length)

  const hasStep1Edits = useMemo(() => (
    (bookingName.trim() && bookingName.trim() !== defaultBookingName)
    || (contactPhone.trim() && contactPhone.trim() !== defaultContactPhone)
    || selectedDate !== today
  ), [bookingName, defaultBookingName, contactPhone, defaultContactPhone, selectedDate, today])

  const hasBookingProgress = useMemo(() => (
    Boolean(pendingBookingIds.length)
    || step > 1
    || startHour !== null
    || paddles > 0
    || balls > 0
    || trainerHours > 0
    || Boolean(notes.trim())
    || hasStep1Edits
  ), [pendingBookingIds, step, startHour, paddles, balls, trainerHours, notes, hasStep1Edits])

  const needsHoldRecovery = step === 5 && pendingBookingIds.length === 0 && !completedBooking

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowNavigationRef.current
      && !resumeOpen
      && hasBookingProgress
      && currentLocation.pathname === '/book'
      && nextLocation.pathname !== '/book',
  )

  const collectDraftSnapshot = useCallback(() => ({
    step,
    bookingName,
    contactPhone,
    courtQuantity,
    selectedDate,
    duration,
    startHour,
    paddles,
    balls,
    trainerHours,
    trainerHeads,
    notes,
    pendingBookingIds,
    assignedHolds,
    paymentRefPhase,
    paymentReference,
    paymentSenderName,
    sendingFromDifferentPlatform,
    paymentSenderPlatform,
    paymentSenderPlatformOther,
    selectedPaymentMethodId,
  }), [
    step, bookingName, contactPhone, courtQuantity, selectedDate, duration, startHour,
    paddles, balls, trainerHours, trainerHeads, notes, pendingBookingIds, assignedHolds, paymentRefPhase, paymentReference,
    paymentSenderName, sendingFromDifferentPlatform, paymentSenderPlatform,
    paymentSenderPlatformOther, selectedPaymentMethodId,
  ])

  async function cancelPendingHolds(ids = pendingBookingIds) {
    if (!ids.length || !user?.id) return { error: null }
    return supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .in('id', ids)
      .eq('user_id', user.id)
  }

  function resetBookingForm() {
    setStepDirection(-1)
    setStep(1)
    setBookingName(profile?.full_name || '')
    setContactPhone(profile?.phone || '')
    setCourtQuantity(1)
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    setDuration(1)
    setStartHour(null)
    setPaddles(0)
    setBalls(0)
    setTrainerHours(0)
    setTrainerHeads(1)
    setNotes('')
    setPendingBookingIds([])
    setAssignedHolds([])
    setPaymentRefPhase('select-method')
    setPaymentReference('')
    setPaymentSenderName('')
    setSendingFromDifferentPlatform(false)
    setPaymentSenderPlatform('')
    setPaymentSenderPlatformOther('')
    setSelectedPaymentMethodId(null)
    setError(null)
  }

  function applyDraft(draft) {
    skipStartHourResetRef.current = true
    setBookingName(draft.bookingName ?? profile?.full_name ?? '')
    setContactPhone(draft.contactPhone ?? profile?.phone ?? '')
    setCourtQuantity(normalizeCourtQuantity(draft.courtQuantity ?? draft.courtMode, courts.length || MAX_COURT_QUANTITY))
    setSelectedDate(draft.selectedDate ?? format(new Date(), 'yyyy-MM-dd'))
    setDuration(draft.duration ?? 1)
    setStartHour(draft.startHour ?? null)
    setPaddles(draft.paddles ?? 0)
    setBalls(draft.balls ?? 0)
    const restoredTrainerHours = draft.trainerHours
      ?? (draft.wantsTrainer || (draft.trainers ?? 0) > 0 ? (draft.duration ?? 1) : 0)
    setTrainerHours(Math.min(restoredTrainerHours, draft.duration ?? 1))
    setTrainerHeads(Math.max(1, draft.trainerHeads ?? 1))
    setNotes(draft.notes ?? '')
    setPendingBookingIds(
      draft.pendingBookingIds?.length
        ? draft.pendingBookingIds
        : draft.pendingBookingId
          ? [draft.pendingBookingId]
          : [],
    )
    setAssignedHolds(draft.assignedHolds ?? [])
    setPaymentRefPhase(draft.paymentRefPhase ?? 'select-method')
    setPaymentReference(draft.paymentReference ?? '')
    setPaymentSenderName(draft.paymentSenderName ?? '')
    setSendingFromDifferentPlatform(Boolean(draft.sendingFromDifferentPlatform))
    setPaymentSenderPlatform(draft.paymentSenderPlatform ?? '')
    setPaymentSenderPlatformOther(draft.paymentSenderPlatformOther ?? '')
    setSelectedPaymentMethodId(draft.selectedPaymentMethodId ?? null)
    const restoredStep = draft.step ?? 1
    setStepDirection(1)
    setStep(restoredStep)
    setError(null)
  }

  function cancelLeave() {
    setLeaveOpen(false)
    setManualLeaveTo(null)
    if (blocker.state === 'blocked') blocker.reset()
  }

  function confirmLeave() {
    if (user?.id) saveBookingDraft(user.id, collectDraftSnapshot())
    setLeaveOpen(false)
    allowNavigationRef.current = true
    if (blocker.state === 'blocked') {
      blocker.proceed()
    } else if (manualLeaveTo) {
      navigate(manualLeaveTo)
    }
    setManualLeaveTo(null)
  }

  async function confirmResume() {
    const draft = resumeDraft
    if (!draft) return

    let nextDraft = { ...draft }

    if (user?.id) {
      const legacyId = draft.pendingBookingId
      const draftIds = draft.pendingBookingIds?.length
        ? draft.pendingBookingIds
        : legacyId
          ? [legacyId]
          : []

      if (draftIds.length) {
        const { data: rows } = await supabase
          .from('bookings')
          .select('id, status, payment_reference, court_id, total_price')
          .in('id', draftIds)
          .eq('user_id', user.id)

        const active = (rows ?? []).filter(r => r.status === 'processing')
        if (active.length === 0) {
          nextDraft.pendingBookingIds = []
          nextDraft.assignedHolds = []
          if (rows?.some(r => r.payment_reference)) {
            setResumeOpen(false)
            setResumeDraft(null)
            clearBookingDraft(user.id)
            navigate('/my-bookings')
            return
          }
          if (nextDraft.step === 5) nextDraft.step = 4
        } else {
          nextDraft.pendingBookingIds = active.map(r => r.id)
          nextDraft.assignedHolds = active.map(r => ({
            booking_id: r.id,
            court_id: r.court_id,
            total_price: r.total_price,
          }))
        }
      }
    }

    applyDraft(nextDraft)
    if (user?.id) saveBookingDraft(user.id, nextDraft)
    setResumeOpen(false)
    setResumeDraft(null)
  }

  async function startFresh() {
    const draft = resumeDraft
    if (user?.id) {
      const ids = draft?.pendingBookingIds?.length
        ? draft.pendingBookingIds
        : draft?.pendingBookingId
          ? [draft.pendingBookingId]
          : []
      if (ids.length) await cancelPendingHolds(ids)
    }
    if (user?.id) clearBookingDraft(user.id)
    resetBookingForm()
    setResumeOpen(false)
    setResumeDraft(null)
  }

  useEffect(() => {
    if (blocker.state === 'blocked') setLeaveOpen(true)
  }, [blocker.state])

  useEffect(() => {
    allowNavigationRef.current = false
  }, [])

  useEffect(() => {
    if (!user?.id || authLoading || resumeCheckedRef.current) return
    resumeCheckedRef.current = true
    const draft = loadBookingDraft(user.id)
    if (!draftHasProgress(draft, { profileName: defaultBookingName, today })) return
    setResumeDraft(draft)
    setResumeOpen(true)
  }, [user?.id, authLoading, defaultBookingName, today])

  useEffect(() => {
    if (!error || !errorBannerRef.current) return
    errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  useEffect(() => {
    if (step !== 5 || pendingBookingIds.length === 0 || !user?.id) return

    let cancelled = false
    supabase
      .from('bookings')
      .select('id, status')
      .in('id', pendingBookingIds)
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (cancelled) return
        const rows = data ?? []
        const stillActive = rows.filter(r => r.status === 'processing')
        if (stillActive.length === pendingBookingIds.length) return
        setPendingBookingIds(stillActive.map(r => r.id))
        setAssignedHolds(prev => prev.filter(h => stillActive.some(r => r.id === h.booking_id)))
        setPaymentRefPhase('select-method')
        setError(
          rows.some(r => r.status === 'cancelled')
            ? 'Your slot hold expired after 30 minutes without payment. Please review and reserve again.'
            : 'Your reservation is no longer on hold. Please review and reserve again.',
        )
      })

    return () => { cancelled = true }
  }, [step, pendingBookingIds, user?.id])

  useEffect(() => {
    if (!user?.id || completedBooking || resumeOpen) return
    if (!hasBookingProgress) {
      clearBookingDraft(user.id)
      return
    }
    saveBookingDraft(user.id, collectDraftSnapshot())
  }, [user?.id, completedBooking, resumeOpen, hasBookingProgress, collectDraftSnapshot])

  useEffect(() => {
    if (completedBooking && user?.id) clearBookingDraft(user.id)
  }, [completedBooking, user?.id])

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (profile?.full_name) {
      setBookingName(prev => (prev.trim() ? prev : profile.full_name))
    }
  }, [profile?.full_name])

  useEffect(() => {
    if (profile?.phone) {
      setContactPhone(prev => (prev.trim() ? prev : profile.phone))
    }
  }, [profile?.phone])

  useEffect(() => {
    let cancelled = false
    setCourtsLoading(true)
    setCourtsError(null)

    supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setCourts([])
          setCourtsError(error.message || 'Could not load courts.')
          setCourtsLoading(false)
          return
        }
        setCourts(data ?? [])
        if (data?.length) {
          setCourtQuantity(q => normalizeCourtQuantity(q, data.length))
        }
        setCourtsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const fetchPaymentMethods = useCallback(async () => {
    setPaymentMethodsLoading(true)
    setPaymentMethodsError(null)

    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, name, qr_image_url, account_name')
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      setPaymentMethods([])
      setPaymentMethodsError(error.message || 'Could not load payment options.')
    } else {
      setPaymentMethods(data ?? [])
    }

    setPaymentMethodsLoading(false)
  }, [])

  useEffect(() => {
    fetchPaymentMethods()
  }, [fetchPaymentMethods])

  useEffect(() => {
    if (step === 5) fetchPaymentMethods()
  }, [step, fetchPaymentMethods])

  useEffect(() => {
    if (!selectedPaymentMethodId) return
    const stillExists = paymentMethods.some(m => m.id === selectedPaymentMethodId)
    if (!stillExists) setSelectedPaymentMethodId(null)
  }, [paymentMethods, selectedPaymentMethodId])

  const skipStartHourResetRef = useRef(false)
  const prevDurationRef = useRef(duration)
  useEffect(() => {
    if (skipStartHourResetRef.current) {
      skipStartHourResetRef.current = false
      prevDurationRef.current = duration
      return
    }
    if (prevDurationRef.current !== duration) {
      prevDurationRef.current = duration
      setStartHour(null)
    }
  }, [duration])

  useEffect(() => {
    if (trainerHours > duration) setTrainerHours(duration)
  }, [duration, trainerHours])

  useEffect(() => {
    if (step < 4 || step > 5) {
      setConfirmReady(false)
      return
    }
    if (step === 5 && paymentRefPhase === 'qr') {
      setConfirmReady(false)
      return
    }
    setConfirmReady(false)
    const t = setTimeout(() => setConfirmReady(true), 450)
    return () => clearTimeout(t)
  }, [step, paymentRefPhase])

  useEffect(() => () => {
    if (navBlockClearRef.current) clearTimeout(navBlockClearRef.current)
  }, [])

  // Keep navigateRef current so the countdown effect never restarts due to
  // navigate changing identity when auth state settles post-submission.
  useEffect(() => { navigateRef.current = navigate })

  useEffect(() => {
    if (!completedBooking) return undefined

    setRedirectSeconds(REDIRECT_SECONDS)
    let remaining = REDIRECT_SECONDS
    const timer = setInterval(() => {
      remaining -= 1
      setRedirectSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
        allowNavigationRef.current = true
        navigateRef.current('/my-bookings')
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [completedBooking]) // navigate intentionally excluded — read via ref

  function goToMyBookings() {
    allowNavigationRef.current = true
    navigateRef.current('/my-bookings')
  }

  const courtCount = getBookedCourtCount(courtQuantity)
  const pricePerCourt = startHour !== null ? calculateTotal(startHour, duration) : 0
  const courtCost = pricePerCourt * courtCount
  const trainerCost = trainerExtraTotal(trainerHours, trainerHeads)
  const extrasCost = (paddles * PADDLE_RATE) + (balls * BALL_RATE) + trainerCost
  const totalPrice = courtCost + extrasCost
  const maxDuration = startHour != null ? getMaxDurationForStart(startHour) : 24
  const bookingEndHour = startHour !== null ? getBookingEndHour(startHour, duration) : null
  const courtLabel = formatCourtSelectionLabel(courts, courtQuantity, assignedHolds)
  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId) ?? null
  const resolvedSenderPlatform = paymentSenderPlatform === 'Other'
    ? paymentSenderPlatformOther.trim()
    : paymentSenderPlatform
  const senderAccountLabel = sendingFromDifferentPlatform
    ? (resolvedSenderPlatform || 'sending app or bank')
    : (selectedMethod?.name ?? 'e-wallet')

  const step1Valid = Boolean(bookingName.trim() && contactPhone.trim() && selectedDate)
  const step2Valid = isStartHourValidForCourts(
    startHour,
    duration,
    courtQuantity,
    perCourtOccupied,
    blockedHours,
  )

  function dismissDowngradeHint() {
    setDowngradeHintDismissed(true)
    try {
      sessionStorage.setItem('daruhan:booking-downgrade-hint-dismissed', '1')
    } catch {
      // ignore
    }
  }

  function handlePartialCourtConfirm() {
    if (!partialConfirm) return
    setCourtQuantity(normalizeCourtQuantity(partialConfirm.availableCourts, selectableCourtMax))
    setStartHour(partialConfirm.hour)
    setPartialConfirm(null)
  }

  function buildFullNotes() {
    const extrasNote = [
      paddles > 0 ? `${paddles} paddle rental${paddles > 1 ? 's' : ''} (₱${paddles * PADDLE_RATE})` : '',
      balls > 0 ? `${balls} ball${balls > 1 ? 's' : ''} (₱${balls * BALL_RATE})` : '',
      trainerHours > 0
        ? `trainer (${trainerHours}h × ${trainerHeads} pax × ₱${TRAINER_RATE}/hr)`
        : '',
    ].filter(Boolean).join(', ')
    return [
      `Booked under: ${bookingName.trim()}`,
      extrasNote,
      notes.trim(),
    ].filter(Boolean).join(' · ')
  }

  function handleCourtQuantityChange(quantity) {
    setCourtQuantity(normalizeCourtQuantity(quantity, selectableCourtMax))
    setStartHour(null)
  }

  function goNext() {
    setError(null)
    if (navBlocked) return
    if (step === 1 && !step1Valid) {
      setError('Please enter a booking name, contact number, and choose a date.')
      return
    }
    if (step === 2 && !step2Valid) {
      setError('Please select a start time for your booking.')
      return
    }
    if (step === 2 && courts.length === 0) {
      setError('No courts are available to book right now. Please try again later.')
      return
    }
    if (step >= 4) return

    if (step === 1) {
      try {
        if (sessionStorage.getItem('daruhan-timeguide-seen') !== '1') {
          setTimeGuideOpen(true)
          sessionStorage.setItem('daruhan-timeguide-seen', '1')
        }
      } catch {
        /* ignore storage errors */
      }
    }

    if (navBlockClearRef.current) clearTimeout(navBlockClearRef.current)
    setNavBlocked(true)
    navBlockClearRef.current = setTimeout(() => {
      setNavBlocked(false)
      navBlockClearRef.current = null
    }, 400)

    setStepDirection(1)
    setStep(s => Math.min(4, s + 1))
  }

  function returnToReview() {
    setError(null)
    setPaymentRefPhase('select-method')
    setPaymentReference('')
    setPaymentSenderName('')
    setSendingFromDifferentPlatform(false)
    setPaymentSenderPlatform('')
    setPaymentSenderPlatformOther('')
    setSelectedPaymentMethodId(null)
    setPendingBookingIds([])
    setAssignedHolds([])
    setStepDirection(-1)
    setStep(4)
  }

  async function goBack() {
    setError(null)
    if (navBlockClearRef.current) clearTimeout(navBlockClearRef.current)
    navBlockClearRef.current = null
    setNavBlocked(false)

    if (step === 5 && pendingBookingIds.length && user?.id) {
      const { error: cancelError } = await cancelPendingHolds()

      if (cancelError) {
        setError(cancelError.message || 'Could not cancel your hold. Please try again.')
        return
      }

      setPendingBookingIds([])
      setAssignedHolds([])
      setPaymentRefPhase('select-method')
      setPaymentReference('')
      setPaymentSenderName('')
      setSendingFromDifferentPlatform(false)
      setPaymentSenderPlatform('')
      setPaymentSenderPlatformOther('')
      setSelectedPaymentMethodId(null)
    }

    setStepDirection(-1)
    setStep(s => Math.max(1, s - 1))
  }

  function handleTopBack() {
    setError(null)
    if (step === 1) {
      if (hasBookingProgress) {
        setManualLeaveTo('/home')
        setLeaveOpen(true)
        return
      }
      navigate('/home')
      return
    }
    goBack()
  }

  async function continueToPayment() {
    setError(null)
    if (step !== 4 || !confirmReady) return
    if (startHour === null || !bookingName.trim()) return

    if (pendingBookingIds.length) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id, status')
        .in('id', pendingBookingIds)
        .eq('user_id', user.id)

      const active = (existing ?? []).filter(r => r.status === 'processing')
      if (active.length === pendingBookingIds.length) {
        setStepDirection(1)
        setStep(5)
        return
      }
      setPendingBookingIds([])
      setAssignedHolds([])
    }

    if (courtQuantity > selectableCourtMax) {
      setError(`Only ${selectableCourtMax} court${selectableCourtMax !== 1 ? 's' : ''} can be booked right now.`)
      setStepDirection(-1)
      setStep(1)
      return
    }

    if (!isStartHourValidForCourts(startHour, duration, courtQuantity, perCourtOccupied, blockedHours)) {
      setError('That time slot is no longer available. Please pick another start time.')
      setStepDirection(-1)
      setStep(2)
      return
    }

    setCreatingHold(true)

    const activeCourtIds = courtIdsForBooking
    if (activeCourtIds.length === 0) {
      setError('No active courts are configured yet. Please contact support.')
      setCreatingHold(false)
      return
    }

    const fullNotes = buildFullNotes()
    const { data: holdRows, error: holdError } = await supabase.rpc('create_booking_hold_auto', {
      p_date: selectedDate,
      p_start_hour: startHour,
      p_duration_hours: duration,
      p_notes: fullNotes,
      p_court_ids: activeCourtIds,
      p_paddles: paddles,
      p_balls: balls,
      p_trainer_hours: trainerHours,
      p_trainer_heads: trainerHours > 0 ? trainerHeads : 0,
      p_contact_phone: contactPhone.trim(),
      p_court_count: courtQuantity,
    })

    if (holdError) {
      setError(formatHoldError(holdError))
      setCreatingHold(false)
      if (holdError.message?.includes('SLOT_TAKEN') || holdError.code === '23P01') {
        setStepDirection(-1)
        setStep(2)
      }
      return
    }

    const holds = Array.isArray(holdRows) ? holdRows : holdRows ? [holdRows] : []
    if (!holds.length || !holds[0]?.booking_id) {
      setError('Could not reserve your slot. Try again or contact support.')
      setCreatingHold(false)
      return
    }

    setAssignedHolds(holds)
    setPendingBookingIds(holds.map(h => h.booking_id))
    setPaymentRefPhase('select-method')
    setPaymentReference('')
    setPaymentSenderName('')
    setSendingFromDifferentPlatform(false)
    setPaymentSenderPlatform('')
    setPaymentSenderPlatformOther('')
    setSelectedPaymentMethodId(null)
    setCreatingHold(false)
    setStepDirection(1)
    setStep(5)
  }

  async function submitPaymentReference(e) {
    e.preventDefault()
    if (step !== 5 || paymentRefPhase !== 'reference' || !confirmReady) return
    const ref = paymentReference.trim()
    const sender = paymentSenderName.trim()
    if (!ref) {
      setError('Enter the payment reference number from your receipt.')
      return
    }
    if (!sender) {
      setError(`Enter the name on your ${senderAccountLabel} account.`)
      return
    }
    if (sendingFromDifferentPlatform && !resolvedSenderPlatform) {
      setError('Select which app or bank you sent the payment from.')
      return
    }
    if (!pendingBookingIds.length) {
      setError('No booking in progress. Go back and try again.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error } = await supabase
      .from('bookings')
      .update({
        payment_reference: ref,
        payment_sender_name: sender,
        payment_method_id: selectedPaymentMethodId,
        payment_sender_platform: sendingFromDifferentPlatform ? resolvedSenderPlatform : null,
      })
      .in('id', pendingBookingIds)
      .eq('user_id', user.id)

    if (error) setError(error.message)
    else {
      setCompletedBooking({
        bookingName: bookingName.trim(),
        contactPhone: contactPhone.trim(),
        courtName: courtLabel,
        courtCount,
        date: selectedDate,
        startHour,
        duration,
        courtCost,
        paddles,
        balls,
        trainerHours,
        trainerHeads,
        userNotes: notes.trim(),
        totalPrice,
        paymentMethodName: selectedMethod?.name ?? null,
        paymentReference: ref,
        paymentSenderName: sender,
        paymentSenderPlatform: sendingFromDifferentPlatform ? resolvedSenderPlatform : null,
      })
      setPendingBookingIds([])
      setAssignedHolds([])
      if (user?.id) clearBookingDraft(user.id)
    }
    setSubmitting(false)
  }

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
    </div>
  )

  if (completedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <BookingSuccessReceipt
          {...completedBooking}
          secondsLeft={redirectSeconds}
          onGoToBookings={goToMyBookings}
        />
      </div>
    )
  }

  return (
    <div className={`mx-auto px-4 py-10 transition-[max-width] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${step === 2 ? 'max-w-4xl' : 'max-w-2xl'}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Book a <span className="gradient-text">Court</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Step through details, then pay via QR — staff will confirm your court after verifying your payment reference.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <StepLabel
              num={i + 1}
              label={label}
              done={step > i + 1}
              active={step === i + 1}
            />
            {i < WIZARD_STEPS.length - 1 && <div className="w-6 sm:flex-1 h-px bg-gray-100 dark:bg-slate-800 min-w-[8px]" />}
          </div>
        ))}
      </div>

      {error && (
        <div
          ref={errorBannerRef}
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-6 text-sm"
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form
        onSubmit={e => {
          if (step === 5 && paymentRefPhase === 'reference') {
            if (!confirmReady) {
              e.preventDefault()
              return
            }
            submitPaymentReference(e)
            return
          }
          e.preventDefault()
        }}
        className="space-y-6"
      >
        <motion.div layout transition={motionTransition.medium} className="relative">
          <AnimatePresence mode="wait" custom={stepDirection} initial={false}>
            {step === 1 && (
            <motion.div
              key={1}
              custom={stepDirection}
              variants={bookStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={motionTransition.medium}
              className="card p-5 space-y-4"
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1 · Details</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Booking name</label>
                <input
                  type="text"
                  value={bookingName}
                  onChange={e => setBookingName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Contact number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="e.g. 0917 123 4567"
                  required
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">We&apos;ll use this to reach you about your booking.</p>
              </div>
              <div className="rounded-2xl border-2 border-gray-900 dark:border-gray-100 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
                <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  How many courts do you need?
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-2 leading-snug">
                  Pick a <span className="underline decoration-2 underline-offset-2">quantity</span>
                  {' '}— not &ldquo;Court 1&rdquo; or &ldquo;Court 2.&rdquo;
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 mb-4 leading-relaxed">
                  &ldquo;2 courts&rdquo; means two courts at the same time. We auto-assign whichever courts are free (up to {SITE.venue.courtCount} courts).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {Array.from({ length: MAX_COURT_QUANTITY }, (_, i) => i + 1).map(n => {
                    const disabled = n > selectableCourtMax
                    const active = courtQuantity === n
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleCourtQuantityChange(n)}
                        aria-pressed={active}
                        aria-label={`Book ${n} court${n !== 1 ? 's' : ''}`}
                        className={`rounded-xl border-2 px-2 py-4 sm:py-5 text-center transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                          active
                            ? 'border-brand-gold-600 bg-brand-gold-50 dark:bg-brand-navy-900/40 shadow-md ring-2 ring-brand-gold-500/30'
                            : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 hover:border-gray-900 dark:hover:border-gray-200'
                        }`}
                      >
                        <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                          {n}
                        </p>
                      </button>
                    )
                  })}
                </div>
                {selectableCourtMax < MAX_COURT_QUANTITY && (
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-3">
                    Up to {selectableCourtMax} court{selectableCourtMax !== 1 ? 's' : ''} can be booked in one checkout right now.
                  </p>
                )}
              </div>
              <DatePicker
                label="Date"
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={val => { setSelectedDate(val); setStartHour(null) }}
              />
            </motion.div>
            )}

            {step === 2 && (
            <motion.div
              key={2}
              custom={stepDirection}
              variants={bookStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={motionTransition.medium}
              className="card p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2 · Duration & time</p>
                <button
                  type="button"
                  onClick={() => setTimeGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-gold-600 dark:text-brand-gold-400 px-2.5 py-1.5 rounded-full border border-brand-gold-200 dark:border-brand-gold-800/60 hover:bg-brand-gold-50 dark:hover:bg-brand-navy-900/20 transition-colors shrink-0"
                >
                  <span className="text-[12px] leading-none">?</span>
                  How time slots work
                </button>
              </div>

              <RateBracketsReference />

              <div className="grid grid-cols-1 md:grid-cols-[minmax(11rem,13rem)_minmax(0,1fr)] gap-5 md:gap-6 items-start">
                <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800 p-4 md:sticky md:top-24">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    How many hours?
                  </label>
                  <div className="flex flex-row items-center justify-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setDuration(d => Math.max(1, d - 1))}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold text-xl hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <div className="text-center min-w-[4.5rem]">
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">{duration}</span>
                      <span className="text-sm font-semibold text-gray-400 ml-1">hr{duration > 1 ? 's' : ''}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDuration(d => Math.min(maxDuration, Math.min(24, d + 1)))}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold text-xl hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center mt-4 leading-snug">
                    Max {maxDuration}h for this start time · priced per bracket above
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
                  {startHour !== null && (
                    <p className="text-xs font-semibold text-brand-gold-500 dark:text-brand-gold-400 mb-3">
                      {formatHour(startHour)} – {formatHour(bookingEndHour)} ({duration}h)
                    </p>
                  )}
                  {!courtsLoading && courtsError && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 mb-3">
                      {courtsError}
                    </div>
                  )}
                  {courtsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                      <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-brand-gold-500 rounded-full animate-spin" />
                      Loading courts…
                    </div>
                  ) : courts.length === 0 ? (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                      No active courts are available right now. Please try again later or contact support.
                    </p>
                  ) : availError ? (
                    <div className="rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                      <p>{availError}</p>
                      <p className="text-xs mt-1 text-red-600 dark:text-red-400">Check your connection and refresh the page to reload availability.</p>
                    </div>
                  ) : availLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                      <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-brand-gold-500 rounded-full animate-spin" />
                      Loading availability…
                    </div>
                  ) : (
                    <UserBookingTimeGrid
                      slotStates={slotStates}
                      numCourts={courtQuantity}
                      selectedHour={startHour}
                      duration={duration}
                      onSelectHour={setStartHour}
                      onRequestPartialConfirm={setPartialConfirm}
                      showDowngradeHint={showDowngradeHint}
                      onDismissDowngradeHint={dismissDowngradeHint}
                    />
                  )}
                </div>
              </div>
            </motion.div>
            )}

            {step === 3 && (
            <motion.div
              key={3}
              custom={stepDirection}
              variants={bookStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={motionTransition.medium}
              className="card p-5 space-y-4"
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 3 · Extras & notes</p>
              <Counter
                emoji="paddle"
                label="Paddle rental"
                sublabel={`₱${PADDLE_RATE} per paddle`}
                value={paddles}
                onChange={setPaddles}
                max={10}
              />
              <Counter
                emoji="ball"
                label="Ball purchase"
                sublabel={`₱${BALL_RATE} per ball`}
                value={balls}
                onChange={setBalls}
                max={20}
              />
              <div className="space-y-2">
                <ExtraToggle
                  emoji="fitness"
                  label="Trainer"
                  sublabel={`₱${TRAINER_RATE} per person, per hour`}
                  checked={trainerHours > 0}
                  onChange={on => {
                    if (on) {
                      setTrainerHours(duration)
                      setTrainerHeads(1)
                    } else {
                      setTrainerHours(0)
                    }
                  }}
                  pricePreview={trainerHours > 0 ? trainerCost : null}
                  priceDetail={
                    trainerHours > 0
                      ? `${trainerHours}h × ${trainerHeads} ${trainerHeads === 1 ? 'person' : 'people'}`
                      : null
                  }
                />
                {trainerHours > 0 && (
                  <div className="ml-3 space-y-2">
                    {duration > 1 && (
                      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-brand-gold-200 dark:border-brand-gold-900/40 bg-white/80 dark:bg-slate-800/60">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Trainer hours</p>
                          <p className="text-xs text-gray-400">Only need coaching for part of your session?</p>
                        </div>
                        <TrainerHoursStepper
                          value={trainerHours}
                          max={duration}
                          onChange={setTrainerHours}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-brand-gold-200 dark:border-brand-gold-900/40 bg-white/80 dark:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Players with trainer</p>
                        <p className="text-xs text-gray-400">How many people need coaching?</p>
                      </div>
                      <TrainerHoursStepper
                        value={trainerHeads}
                        max={20}
                        onChange={setTrainerHeads}
                        unit="pax"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests…"
                  className="input-field resize-none"
                />
              </div>
            </motion.div>
            )}

            {step === 4 && (
            <motion.div
              key={4}
              custom={stepDirection}
              variants={bookStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={motionTransition.medium}
              className="space-y-4"
            >
              <BookingPriceBreakdown
                title="Confirm your booking"
                subtitle="Check the details and total, then continue to scan the payment QR."
                bookingName={bookingName.trim()}
                contactPhone={contactPhone.trim()}
                courtName={courtLabel}
                courtCount={courtCount}
                date={selectedDate}
                startHour={startHour}
                duration={duration}
                courtCost={courtCost}
                paddles={paddles}
                balls={balls}
                trainerHours={trainerHours}
                trainerHeads={trainerHeads}
                userNotes={notes.trim()}
                totalPrice={totalPrice}
              />
            </motion.div>
            )}

            {step === 5 && (
            <motion.div
              key={5}
              custom={stepDirection}
              variants={bookStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={motionTransition.medium}
              className="space-y-4"
            >

              {needsHoldRecovery ? (
                <div className="card p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 5 · Payment</p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <p className="font-semibold text-amber-950">No active slot hold</p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      Your court reservation isn&apos;t on hold anymore — it may have expired after 30 minutes,
                      or the page was refreshed before payment finished. Go back to review and reserve your slot again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={returnToReview}
                    className="btn-primary w-full py-3 rounded-xl font-semibold"
                  >
                    Back to review
                  </button>
                </div>
              ) : (
              <>

              {/* ── Phase 1: choose payment method ── */}
              {paymentRefPhase === 'select-method' && (
                <div className="card p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 5 · Payment method</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Choose how you&apos;d like to pay{' '}
                    <span className="font-extrabold text-brand-gold-600">₱{totalPrice.toLocaleString()}</span>.
                    Your slot is on hold while you complete payment.
                  </p>

                  {paymentMethodsLoading ? (
                    <p className="text-sm text-gray-400 text-center py-4">Loading payment options…</p>
                  ) : paymentMethodsError ? (
                    <div className="rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                      <p>{paymentMethodsError}</p>
                      <button
                        type="button"
                        onClick={fetchPaymentMethods}
                        className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
                      >
                        Retry loading payment options
                      </button>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400 space-y-2">
                      <p>No payment methods are available yet.</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        In Supabase, open <strong>Table Editor → payment_methods</strong> and make sure
                        GCash / GoTyme rows exist with <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1">is_active = true</code>,
                        or re-run <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1">002_payment_methods.sql</code>.
                      </p>
                      <button
                        type="button"
                        onClick={fetchPaymentMethods}
                        className="text-xs font-semibold text-amber-900 dark:text-amber-300 hover:underline"
                      >
                        Retry loading payment options
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          aria-label={`Pay with ${method.name}`}
                          onClick={() => setSelectedPaymentMethodId(method.id)}
                          className={`relative rounded-2xl border-2 p-5 min-h-[88px] flex items-center justify-center transition-all ${
                            selectedPaymentMethodId === method.id
                              ? 'border-brand-gold-500 bg-brand-gold-50 shadow-sm'
                              : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-gold-200'
                          }`}
                        >
                          <PaymentMethodBrand name={method.name} />
                          {selectedPaymentMethodId === method.id && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand-gold-500 text-white flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Phase 2: scan QR ── */}
              {paymentRefPhase === 'qr' && selectedMethod && (
                <div className="card p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 5 · Scan &amp; pay</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Pay via <strong>{selectedMethod.name}</strong>. Make sure the amount is exact:
                  </p>

                  <div
                    className="rounded-2xl border-2 border-brand-gold-200 dark:border-slate-700 bg-gradient-to-r from-brand-gold-50 to-brand-cream dark:from-slate-800 dark:to-slate-800/80 px-4 py-3 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold-600 dark:text-brand-gold-400">Amount to send</p>
                    <p className="text-4xl sm:text-5xl font-black text-brand-gold-600 dark:text-brand-gold-400 leading-none mt-1">
                      ₱{totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-brand-navy-900 dark:text-brand-gold-300 mt-2">
                      Send this exact amount before tapping <strong>Done paying</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 p-6">
                    <PaymentQrImage method={selectedMethod} onRetryLoad={fetchPaymentMethods} />
                    {selectedMethod.account_name && (
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">{selectedMethod.account_name}</p>
                    )}
                  </div>

                  <p className="text-xs text-amber-900 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2">
                    After sending exactly <strong>₱{totalPrice.toLocaleString()}</strong>, tap <strong>Done paying</strong> and enter your reference number so staff can verify and confirm your booking.
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This QR can receive transfers from other banks and e-wallets via InstaPay or PESONet.
                  </p>

                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 cursor-pointer hover:border-brand-gold-200 dark:hover:border-brand-gold-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={sendingFromDifferentPlatform}
                      onChange={e => {
                        setSendingFromDifferentPlatform(e.target.checked)
                        if (!e.target.checked) {
                          setPaymentSenderPlatform('')
                          setPaymentSenderPlatformOther('')
                        }
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-gold-500 focus:ring-brand-gold-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                      I&apos;m sending from a <strong>different app or bank</strong> (not {selectedMethod.name})
                    </span>
                  </label>
                </div>
              )}

              {/* ── Phase 3: enter reference + sender name ── */}
              {paymentRefPhase === 'reference' && (
                <div className="card p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment details</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {sendingFromDifferentPlatform ? (
                      <>
                        You scanned the <strong>{selectedMethod?.name}</strong> QR but sent from another app or bank.
                        Tell us which one so staff can verify your{' '}
                        <span className="font-semibold text-gray-800 dark:text-gray-100">₱{totalPrice.toLocaleString()}</span> payment.
                      </>
                    ) : (
                      <>
                        Enter the info from your{' '}
                        {selectedMethod ? <strong>{selectedMethod.name}</strong> : 'e-wallet'}{' '}
                        receipt so staff can verify your{' '}
                        <span className="font-semibold text-gray-800 dark:text-gray-100">₱{totalPrice.toLocaleString()}</span> payment.
                      </>
                    )}
                  </p>

                  {sendingFromDifferentPlatform && (
                    <div>
                      <label htmlFor="payment-sender-platform" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                        Which app or bank did you send from?
                        <span className="ml-1 text-red-600 font-extrabold normal-case">*</span>
                        <span className="ml-1 text-red-600 font-semibold normal-case">(required)</span>
                      </label>
                      <select
                        id="payment-sender-platform"
                        value={paymentSenderPlatform}
                        onChange={e => {
                          setPaymentSenderPlatform(e.target.value)
                          if (e.target.value !== 'Other') setPaymentSenderPlatformOther('')
                        }}
                        className="input-field"
                      >
                        <option value="">Select one…</option>
                        {SENDER_PLATFORMS.map(platform => (
                          <option key={platform} value={platform}>{platform}</option>
                        ))}
                      </select>
                      {paymentSenderPlatform === 'Other' && (
                        <input
                          type="text"
                          value={paymentSenderPlatformOther}
                          onChange={e => setPaymentSenderPlatformOther(e.target.value)}
                          placeholder="e.g. RCBC, Seabank"
                          className="input-field mt-2"
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="payment-sender" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Name on your {senderAccountLabel} account
                      <span className="ml-1 text-red-600 font-extrabold normal-case">*</span>
                      <span className="ml-1 text-red-600 font-semibold normal-case">(required)</span>
                    </label>
                    <input
                      id="payment-sender"
                      type="text"
                      value={paymentSenderName}
                      onChange={e => setPaymentSenderName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      autoComplete="name"
                      className="input-field"
                    />
                    <p className="text-xs text-red-600 mt-1">Required: this helps staff match your payment to your account.</p>
                  </div>

                  <div>
                    <label htmlFor="payment-ref" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Reference number
                      <span className="ml-1 text-red-600 font-extrabold normal-case">*</span>
                      <span className="ml-1 text-red-600 font-semibold normal-case">(required)</span>
                    </label>
                    <input
                      id="payment-ref"
                      type="text"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      placeholder="e.g. 0123456789012"
                      autoComplete="off"
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              </>
              )}

            </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="w-full space-y-2">
          {(step < 5 || (step === 5 && paymentRefPhase === 'select-method' && !needsHoldRecovery)) && (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleTopBack}
                disabled={navBlocked}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-base font-semibold hover:border-brand-gold-300 dark:hover:border-brand-gold-500 hover:bg-brand-gold-50 dark:hover:bg-slate-700 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors disabled:opacity-60 flex-shrink-0 sm:min-w-[7.5rem]"
              >
                <ArrowLeft size={18} strokeWidth={2.5} aria-hidden />
                Back
              </button>
              <div className="flex-1 min-w-0">
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={navBlocked}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center disabled:opacity-60"
            >
              Continue
              <ArrowRight size={18} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
            </button>
          ) : step === 4 ? (
            <button
              type="button"
              onClick={continueToPayment}
              disabled={creatingHold || !step2Valid || !step1Valid || !confirmReady || courts.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center disabled:opacity-60"
            >
              {creatingHold ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Saving your slot…
                </>
              ) : !confirmReady ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Preparing…
                </>
              ) : (
                <>
                  Continue to payment
                  <ArrowRight size={18} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setError(null); setPaymentRefPhase('qr') }}
              disabled={!selectedPaymentMethodId || !confirmReady || paymentMethodsLoading || Boolean(paymentMethodsError)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center disabled:opacity-60"
            >
              {!confirmReady ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Preparing…
                </>
              ) : (
                <>
                  Continue to payment
                  <ArrowRight size={18} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
                </>
              )}
            </button>
          )}
              </div>
            </div>
          )}
          {step < 4 ? null : step === 4 ? null : step === 5 && needsHoldRecovery ? null : paymentRefPhase === 'select-method' ? null : paymentRefPhase === 'qr' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setPaymentRefPhase('select-method')
                  setSendingFromDifferentPlatform(false)
                  setPaymentSenderPlatform('')
                  setPaymentSenderPlatformOther('')
                }}
                className="w-full py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-brand-gold-200 hover:bg-brand-gold-50/50 transition-colors"
              >
                ← Change payment method
              </button>
              <button
                type="button"
                onClick={() => setPaymentRefPhase('reference')}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center"
              >
                Done paying
                <Check size={18} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setError(null); setPaymentRefPhase('qr') }}
                className="w-full py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-brand-gold-200 hover:bg-brand-gold-50/50 transition-colors"
              >
                ← Back to QR
              </button>
              <button
                type="submit"
                disabled={
                  submitting
                  || !confirmReady
                  || !paymentReference.trim()
                  || !paymentSenderName.trim()
                  || (sendingFromDifferentPlatform && !resolvedSenderPlatform)
                }
                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Submitting…
                  </>
                ) : !confirmReady ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Preparing…
                  </>
                ) : (
                  <>
                    Submit booking request
                    <Check size={18} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </form>

      <TimeGuideModal open={timeGuideOpen} onClose={() => setTimeGuideOpen(false)} />

      <PartialCourtConfirmDialog
        open={Boolean(partialConfirm)}
        onClose={() => setPartialConfirm(null)}
        onConfirm={handlePartialCourtConfirm}
        startHour={partialConfirm?.hour ?? null}
        duration={duration}
        availableCourts={partialConfirm?.availableCourts ?? 0}
        requestedCourts={courtQuantity}
      />

      <BookingConfirmModal
        open={leaveOpen}
        title="Leave this booking?"
        description="Your progress will be saved. You can pick up where you left off when you come back to Book a Court."
        cancelLabel="Stay on this page"
        confirmLabel="Leave for now"
        onCancel={cancelLeave}
        onConfirm={confirmLeave}
      />

      <BookingConfirmModal
        open={resumeOpen}
        title="Pick up where you left off?"
        description="You have a booking in progress from earlier. Continue from your last step, or start a new booking from scratch."
        cancelLabel="Start over"
        confirmLabel="Continue booking"
        confirmTone="primary"
        onCancel={startFresh}
        onConfirm={confirmResume}
      />
    </div>
  )
}
