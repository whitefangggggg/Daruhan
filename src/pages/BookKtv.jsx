import { SITE } from '../config/site'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useBlocker } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useAvailability } from '../hooks/useAvailability'
import { calculateKtvTotal, getKtvRateForHour, getKtvThemeForHour, KTV_RATE_BRACKETS } from '../lib/pricing'
import UserBookingTimeGrid from '../components/UserBookingTimeGrid'
import TimeGuideModal from '../components/TimeGuideModal'
import DatePicker from '../components/DatePicker'
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
import { formatHoldError } from '../utils/bookingHoldErrors'
import { getBookingEndHour, getMaxBookableDuration, getMaxDurationForDate, getBlockedHoursForDate, getPastHoursForDate } from '../utils/bookingHours'
import {
  resolveBookingCourtIds,
  formatCourtSelectionLabel,
} from '../utils/userBookingCourts'
import { computeSlotStates } from '../utils/slotAvailability'
import { transition as motionTransition } from '../lib/motion'
import { getPaymentMethodLogo, resolvePaymentQrImageUrl } from '../lib/paymentMethods'

const KTV_OPERATING_HOURS = SITE.ktv.operatingHours
/** Draft is stored separately from the pickleball booking draft. */
const draftKey = userId => `${userId}:ktv`

const WIZARD_STEPS = ['Details', 'Time slot', 'Review', 'Payment']

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

/** Banks / e-wallets users may pay from when scanning a QR PH code */
const SENDER_PLATFORMS = [
  'GCash',
  'Maya',
  'GoTyme',
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

function PaymentMethodBrand({ name }) {
  const logo = getPaymentMethodLogo(name)

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="h-10 w-auto max-w-[140px] object-contain"
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

export default function BookKtv() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)

  const [rooms, setRooms] = useState([])
  const [roomsError, setRoomsError] = useState(null)
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [bookingName, setBookingName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState(1)
  const [startHour, setStartHour] = useState(null)
  const [timeGuideOpen, setTimeGuideOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  const [navBlocked, setNavBlocked] = useState(false)
  const navBlockClearRef = useRef(null)
  const [confirmReady, setConfirmReady] = useState(false)
  const [stepDirection, setStepDirection] = useState(1)
  const [pendingBookingIds, setPendingBookingIds] = useState([])
  const [assignedHolds, setAssignedHolds] = useState([])
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
  const allowNavigationRef = useRef(false)
  const resumeCheckedRef = useRef(false)
  const errorBannerRef = useRef(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultBookingName = profile?.full_name?.trim() ?? ''
  const defaultContactPhone = profile?.phone?.trim() ?? ''

  const roomIdsForBooking = useMemo(() => resolveBookingCourtIds(rooms), [rooms])

  const { perCourtOccupied, loading: availLoading, error: availError } = useAvailability(
    roomIdsForBooking,
    selectedDate,
    KTV_OPERATING_HOURS,
  )

  const pastHours = useMemo(() => getPastHoursForDate(selectedDate), [selectedDate])
  const blockedHours = useMemo(
    () => getBlockedHoursForDate(selectedDate, new Date(), KTV_OPERATING_HOURS),
    [selectedDate],
  )

  const slotStates = useMemo(
    () => computeSlotStates({
      duration,
      numCourts: 1,
      perCourtOccupied,
      blockedHours,
      pastHours,
      operatingHours: KTV_OPERATING_HOURS,
    }),
    [duration, perCourtOccupied, blockedHours, pastHours],
  )

  const hasStep1Edits = useMemo(() => (
    (bookingName.trim() && bookingName.trim() !== defaultBookingName)
    || (contactPhone.trim() && contactPhone.trim() !== defaultContactPhone)
    || selectedDate !== today
  ), [bookingName, defaultBookingName, contactPhone, defaultContactPhone, selectedDate, today])

  const hasBookingProgress = useMemo(() => (
    Boolean(pendingBookingIds.length)
    || step > 1
    || startHour !== null
    || Boolean(notes.trim())
    || hasStep1Edits
  ), [pendingBookingIds, step, startHour, notes, hasStep1Edits])

  const needsHoldRecovery = step === 4 && pendingBookingIds.length === 0 && !completedBooking

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowNavigationRef.current
      && !resumeOpen
      && hasBookingProgress
      && currentLocation.pathname === '/ktv'
      && nextLocation.pathname !== '/ktv',
  )

  const collectDraftSnapshot = useCallback(() => ({
    step,
    bookingName,
    contactPhone,
    selectedDate,
    duration,
    startHour,
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
    step, bookingName, contactPhone, selectedDate, duration, startHour,
    notes, pendingBookingIds, assignedHolds, paymentRefPhase, paymentReference,
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
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    setDuration(1)
    setStartHour(null)
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
    setSelectedDate(draft.selectedDate ?? format(new Date(), 'yyyy-MM-dd'))
    setDuration(draft.duration ?? 1)
    setStartHour(draft.startHour ?? null)
    setNotes(draft.notes ?? '')
    setPendingBookingIds(draft.pendingBookingIds?.length ? draft.pendingBookingIds : [])
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
    if (user?.id) saveBookingDraft(draftKey(user.id), collectDraftSnapshot())
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
      const draftIds = draft.pendingBookingIds?.length ? draft.pendingBookingIds : []

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
            clearBookingDraft(draftKey(user.id))
            navigate('/my-bookings')
            return
          }
          if (nextDraft.step === 4) nextDraft.step = 3
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
    if (user?.id) saveBookingDraft(draftKey(user.id), nextDraft)
    setResumeOpen(false)
    setResumeDraft(null)
  }

  async function startFresh() {
    const draft = resumeDraft
    if (user?.id) {
      const ids = draft?.pendingBookingIds?.length ? draft.pendingBookingIds : []
      if (ids.length) await cancelPendingHolds(ids)
    }
    if (user?.id) clearBookingDraft(draftKey(user.id))
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
    const draft = loadBookingDraft(draftKey(user.id))
    if (!draftHasProgress(draft, { profileName: defaultBookingName, today })) return
    setResumeDraft(draft)
    setResumeOpen(true)
  }, [user?.id, authLoading, defaultBookingName, today])

  useEffect(() => {
    if (!error || !errorBannerRef.current) return
    errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  useEffect(() => {
    if (step !== 4 || pendingBookingIds.length === 0 || !user?.id) return

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
            ? 'Your room hold expired after 30 minutes without payment. Please review and reserve again.'
            : 'Your reservation is no longer on hold. Please review and reserve again.',
        )
      })

    return () => { cancelled = true }
  }, [step, pendingBookingIds, user?.id])

  useEffect(() => {
    if (!user?.id || completedBooking || resumeOpen) return
    if (!hasBookingProgress) {
      clearBookingDraft(draftKey(user.id))
      return
    }
    saveBookingDraft(draftKey(user.id), collectDraftSnapshot())
  }, [user?.id, completedBooking, resumeOpen, hasBookingProgress, collectDraftSnapshot])

  useEffect(() => {
    if (completedBooking && user?.id) clearBookingDraft(draftKey(user.id))
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
    setRoomsLoading(true)
    setRoomsError(null)

    supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .eq('type', 'ktv')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setRooms([])
          setRoomsError(error.message || 'Could not load KTV rooms.')
          setRoomsLoading(false)
          return
        }
        setRooms(data ?? [])
        setRoomsLoading(false)
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
    if (step === 4) fetchPaymentMethods()
  }, [step, fetchPaymentMethods])

  useEffect(() => {
    if (!selectedPaymentMethodId) return
    const stillExists = paymentMethods.some(m => m.id === selectedPaymentMethodId)
    if (!stillExists) setSelectedPaymentMethodId(null)
  }, [paymentMethods, selectedPaymentMethodId])

  useEffect(() => {
    if (paymentMethods.length === 1) {
      setSelectedPaymentMethodId(paymentMethods[0].id)
    }
  }, [paymentMethods])

  useEffect(() => {
    if (
      step === 4
      && paymentMethods.length === 1
      && selectedPaymentMethodId
      && paymentRefPhase === 'select-method'
    ) {
      setPaymentRefPhase('qr')
    }
  }, [step, paymentMethods.length, selectedPaymentMethodId, paymentRefPhase])

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

  const maxDuration = useMemo(() => (
    startHour != null
      ? getMaxBookableDuration(startHour, blockedHours, KTV_OPERATING_HOURS)
      : getMaxDurationForDate(blockedHours, KTV_OPERATING_HOURS)
  ), [startHour, blockedHours])

  useEffect(() => {
    if (duration > maxDuration) setDuration(Math.max(1, maxDuration))
  }, [duration, maxDuration])

  useEffect(() => {
    if (step < 3 || step > 4) {
      setConfirmReady(false)
      return
    }
    if (step === 4 && paymentRefPhase === 'qr') {
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
  }, [completedBooking])

  function goToMyBookings() {
    allowNavigationRef.current = true
    navigateRef.current('/my-bookings')
  }

  const pricePerRoom = startHour !== null ? calculateKtvTotal(duration) : 0
  const totalPrice = pricePerRoom
  const bookingEndHour = startHour !== null ? getBookingEndHour(startHour, duration) : null
  const roomLabel = formatCourtSelectionLabel(rooms, 1, assignedHolds, 'room')
  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId) ?? null
  const paymentQrSrc = selectedMethod
    ? resolvePaymentQrImageUrl(selectedMethod, {
        totalPrice,
        bookingName: bookingName.trim(),
        courtName: roomLabel,
        date: selectedDate,
      })
    : null
  const singlePaymentMethod = paymentMethods.length === 1
  const resolvedSenderPlatform = paymentSenderPlatform === 'Other'
    ? paymentSenderPlatformOther.trim()
    : paymentSenderPlatform
  const senderAccountLabel = sendingFromDifferentPlatform
    ? (resolvedSenderPlatform || 'sending app or bank')
    : (selectedMethod?.name ?? 'e-wallet')

  const step1Valid = Boolean(bookingName.trim() && contactPhone.trim() && selectedDate)
  const step2Valid = startHour != null
    && getMaxBookableDuration(startHour, blockedHours, KTV_OPERATING_HOURS) >= duration

  function buildFullNotes() {
    return [
      `Booked under: ${bookingName.trim()}`,
      notes.trim(),
    ].filter(Boolean).join(' · ')
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
    if (step === 2 && rooms.length === 0) {
      setError('No KTV rooms are available to book right now. Please try again later.')
      return
    }
    if (step >= 3) return

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
    setStep(s => Math.min(3, s + 1))
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
    setStep(3)
  }

  async function goBack() {
    setError(null)
    if (navBlockClearRef.current) clearTimeout(navBlockClearRef.current)
    navBlockClearRef.current = null
    setNavBlocked(false)

    if (step === 4 && pendingBookingIds.length && user?.id) {
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
        setManualLeaveTo('/book')
        setLeaveOpen(true)
        return
      }
      navigate('/book')
      return
    }
    goBack()
  }

  async function continueToPayment() {
    setError(null)
    if (step !== 3 || !confirmReady) return
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
        setStep(4)
        return
      }
      setPendingBookingIds([])
      setAssignedHolds([])
    }

    if (!step2Valid) {
      setError('That time slot is no longer available. Please pick another start time.')
      setStepDirection(-1)
      setStep(2)
      return
    }

    setCreatingHold(true)

    const activeRoomIds = roomIdsForBooking
    if (activeRoomIds.length === 0) {
      setError('No active KTV rooms are configured yet. Please contact support.')
      setCreatingHold(false)
      return
    }

    const fullNotes = buildFullNotes()
    const { data: holdRows, error: holdError } = await supabase.rpc('create_booking_hold_auto', {
      p_date: selectedDate,
      p_start_hour: startHour,
      p_duration_hours: duration,
      p_notes: fullNotes,
      p_court_ids: activeRoomIds,
      p_paddles: 0,
      p_balls: 0,
      p_trainer_hours: 0,
      p_trainer_heads: 0,
      p_contact_phone: contactPhone.trim(),
      p_court_count: 1,
    })

    if (holdError) {
      setError(formatHoldError(holdError, 'KTV rooms'))
      setCreatingHold(false)
      if (holdError.message?.includes('SLOT_TAKEN') || holdError.code === '23P01') {
        setStepDirection(-1)
        setStep(2)
      }
      return
    }

    const holds = Array.isArray(holdRows) ? holdRows : holdRows ? [holdRows] : []
    if (!holds.length || !holds[0]?.booking_id) {
      setError('Could not reserve your room. Try again or contact support.')
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
    setStep(4)
  }

  async function submitPaymentReference(e) {
    e.preventDefault()
    if (step !== 4 || paymentRefPhase !== 'reference' || !confirmReady) return
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
        courtName: roomLabel,
        courtCount: 1,
        date: selectedDate,
        startHour,
        duration,
        courtCost: totalPrice,
        userNotes: notes.trim(),
        totalPrice,
        paymentMethodName: selectedMethod?.name ?? null,
        paymentReference: ref,
        paymentSenderName: sender,
        paymentSenderPlatform: sendingFromDifferentPlatform ? resolvedSenderPlatform : null,
      })
      setPendingBookingIds([])
      setAssignedHolds([])
      if (user?.id) clearBookingDraft(draftKey(user.id))
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
          unitLabel="Room"
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
          Book a <span className="gradient-text">KTV Room</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Step through details, then pay via QR — staff will confirm your room after verifying your payment reference.</p>
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
          className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl p-3 mb-6 text-sm"
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form
        onSubmit={e => {
          if (step === 4 && paymentRefPhase === 'reference') {
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
                  🎤 We&apos;ll assign your room
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                  Daruhan has {SITE.ktv.roomCount} KTV rooms. We automatically pick whichever room is free for
                  your chosen time — flat rate of ₱{SITE.ktv.ratePerHour}/hour, no need to choose a specific room.
                </p>
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

              <div className="rounded-xl border-2 border-brand-gold-300 dark:border-brand-gold-800/40 bg-brand-gold-50 dark:bg-brand-navy-900/20 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-gold-950 dark:text-brand-gold-100">Flat rate · any hour</span>
                <span className="text-lg font-extrabold text-brand-gold-700 dark:text-brand-gold-400 tabular-nums">₱{SITE.ktv.ratePerHour}/hr</span>
              </div>

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
                      onClick={() => setDuration(d => Math.min(maxDuration, d + 1))}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold text-xl hover:border-brand-gold-400 dark:hover:border-brand-gold-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center mt-4 leading-snug">
                    {startHour != null
                      ? `Max ${maxDuration}h from ${formatHour(startHour)} · ${SITE.ktv.hoursDetail}`
                      : `Up to ${maxDuration}h today · ${SITE.ktv.hoursDetail}`}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
                  {startHour !== null && (
                    <p className="text-xs font-semibold text-brand-gold-500 dark:text-brand-gold-400 mb-3">
                      {formatHour(startHour)} – {formatHour(bookingEndHour)} ({duration}h)
                    </p>
                  )}
                  {!roomsLoading && roomsError && (
                    <div className="rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 mb-3">
                      {roomsError}
                    </div>
                  )}
                  {roomsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                      <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-brand-gold-500 rounded-full animate-spin" />
                      Loading rooms…
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="text-sm text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-3 py-2.5 space-y-2">
                      <p>No active KTV rooms are available right now. Please try again later or contact support.</p>
                      {import.meta.env.DEV && !roomsError && (
                        <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                          Dev hint: run <code className="font-mono">supabase/migrations/007_ktv.sql</code> (adds
                          {' '}<code className="font-mono">courts.type</code>), then the KTV insert block in
                          {' '}<code className="font-mono">supabase/seed.sql</code> (9 rooms with
                          {' '}<code className="font-mono">type = &apos;ktv&apos;</code>) in the Supabase SQL Editor.
                          The time grid only appears once those rooms exist.
                        </p>
                      )}
                    </div>
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
                      numCourts={1}
                      selectedHour={startHour}
                      duration={duration}
                      onSelectHour={setStartHour}
                      onRequestPartialConfirm={() => {}}
                      operatingHours={KTV_OPERATING_HOURS}
                      getRate={getKtvRateForHour}
                      getTheme={getKtvThemeForHour}
                      rateBrackets={KTV_RATE_BRACKETS}
                      closedHoursNote={SITE.ktv.hoursDetail}
                      unitLabel="room"
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
              className="space-y-4"
            >
              <div className="card p-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 3 · Notes</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any special requests… e.g. number of guests"
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <BookingPriceBreakdown
                title="Confirm your booking"
                subtitle="Check the details and total, then continue to scan the payment QR."
                bookingName={bookingName.trim()}
                contactPhone={contactPhone.trim()}
                courtName={roomLabel}
                courtCount={1}
                date={selectedDate}
                startHour={startHour}
                duration={duration}
                courtCost={totalPrice}
                userNotes={notes.trim()}
                totalPrice={totalPrice}
                unitLabel="Room"
              />
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

              {needsHoldRecovery ? (
                <div className="card p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 4 · Payment</p>
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
                    <p className="font-semibold text-amber-950 dark:text-amber-200">No active room hold</p>
                    <p className="text-sm text-amber-900 dark:text-amber-400 leading-relaxed">
                      Your room reservation isn&apos;t on hold anymore — it may have expired after 30 minutes,
                      or the page was refreshed before payment finished. Go back to review and reserve your room again.
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
              {paymentRefPhase === 'select-method' && !singlePaymentMethod && (
                <div className="card p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 4 · Payment method</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Choose how you&apos;d like to pay{' '}
                    <span className="font-extrabold text-brand-gold-600">₱{totalPrice.toLocaleString()}</span>.
                    Your room is on hold while you complete payment.
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
                              ? 'border-brand-gold-500 bg-brand-gold-50 dark:bg-brand-navy-900/40 shadow-sm'
                              : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-gold-200 dark:hover:border-brand-gold-700'
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
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 4 · Scan &amp; pay</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Scan the <strong>QR PH</strong> code below and pay the exact amount:
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

                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/60 p-6">
                    <PaymentQrImage
                      method={selectedMethod}
                      qrSrc={paymentQrSrc}
                      onRetryLoad={fetchPaymentMethods}
                    />
                    {selectedMethod.account_name && (
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">{selectedMethod.account_name}</p>
                    )}
                  </div>

                  <p className="text-xs text-amber-900 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2">
                    After sending exactly <strong>₱{totalPrice.toLocaleString()}</strong>, tap <strong>Done paying</strong> and enter your reference number so staff can verify and confirm your booking.
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    QR PH accepts transfers from any participating bank or e-wallet — low fees via InstaPay or PESONet.
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
                      I paid using a <strong>different app or bank</strong> than the one shown on my receipt
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
          {(step < 4 || (step === 4 && paymentRefPhase === 'select-method' && !singlePaymentMethod && !needsHoldRecovery)) && (
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
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={navBlocked}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center disabled:opacity-60"
            >
              Continue
              <ArrowRight size={18} strokeWidth={2.5} className="flex-shrink-0" aria-hidden />
            </button>
          ) : step === 3 ? (
            <button
              type="button"
              onClick={continueToPayment}
              disabled={creatingHold || !step2Valid || !step1Valid || !confirmReady || rooms.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-center disabled:opacity-60"
            >
              {creatingHold ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Saving your room…
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
          ) : step === 4 && paymentRefPhase === 'select-method' && !singlePaymentMethod ? (
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
          ) : null}
              </div>
            </div>
          )}
          {step < 3 ? null : step === 3 ? null : step === 4 && needsHoldRecovery ? null : paymentRefPhase === 'select-method' ? null : paymentRefPhase === 'qr' ? (
            <>
              {!singlePaymentMethod && (
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
              )}
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

      <BookingConfirmModal
        open={leaveOpen}
        title="Leave this booking?"
        description="Your progress will be saved. You can pick up where you left off when you come back to Book a KTV room."
        cancelLabel="Stay on this page"
        confirmLabel="Leave for now"
        onCancel={cancelLeave}
        onConfirm={confirmLeave}
      />

      <BookingConfirmModal
        open={resumeOpen}
        title="Pick up where you left off?"
        description="You have a KTV booking in progress from earlier. Continue from your last step, or start a new booking from scratch."
        cancelLabel="Start over"
        confirmLabel="Continue booking"
        confirmTone="primary"
        onCancel={startFresh}
        onConfirm={confirmResume}
      />
    </div>
  )
}
