import { isSessionEnded } from './bookingLifecycle'

/**
 * Converts a raw booking record into a user-facing display status.
 * Never read booking.status directly in UI — use this instead.
 *
 * @param {object} booking  - Booking row (needs .status and .payment_reference)
 * @param {Date} [now]
 * @returns {{ label: string, tone: 'success'|'pending'|'warning'|'neutral' }}
 */
export function getDisplayStatus(booking, now = new Date()) {
  if (booking.status === 'processing') {
    return booking.payment_reference
      ? { label: 'Paid, waiting for confirmation', tone: 'pending' }
      : { label: 'Awaiting payment', tone: 'warning' }
  }
  if (booking.status === 'confirmed') {
    if (booking.date && isSessionEnded(booking, now)) {
      return { label: 'Completed', tone: 'neutral' }
    }
    return { label: 'Paid and confirmed', tone: 'success' }
  }
  if (booking.status === 'cancelled') {
    return { label: 'Cancelled', tone: 'neutral' }
  }
  if (booking.status === 'completed') {
    return { label: 'Completed', tone: 'neutral' }
  }
  return { label: booking.status, tone: 'neutral' }
}

/** Tailwind classes for each tone, used on status badges. */
export const STATUS_TONE = {
  success: { dot: 'bg-brand-gold-500', badge: 'bg-brand-gold-100 dark:bg-brand-navy-900/30 text-brand-gold-600 dark:text-brand-gold-400' },
  pending: { dot: 'bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300' },
  warning: { dot: 'bg-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-300' },
  neutral: { dot: 'bg-gray-400', badge: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300' },
}

export function isAdminReservation(booking) {
  return booking.payment_reference === 'ADMIN'
}

export function hasSubmittedUserPayment(booking) {
  return Boolean(
    booking.payment_reference
    && booking.payment_reference !== 'ADMIN',
  )
}

/**
 * Admin workflow bucket — use for filters, grouping, and action buttons.
 * @returns {'paid_verify'|'unpaid'|'admin_unpaid'|'confirmed'|'cancelled'|'completed'|'other'}
 */
export function getAdminBookingCategory(booking, now = new Date()) {
  if (booking.status === 'cancelled') return 'cancelled'
  if (booking.status === 'completed') return 'completed'
  if (booking.status === 'confirmed') {
    if (booking.date && isSessionEnded(booking, now)) return 'completed'
    if (isAdminReservation(booking) && booking.payment_collected !== true) return 'admin_unpaid'
    return 'confirmed'
  }
  if (booking.status === 'processing') {
    if (hasSubmittedUserPayment(booking)) return 'paid_verify'
    return 'unpaid'
  }
  return 'other'
}

const ADMIN_CATEGORY_META = {
  paid_verify: {
    label: 'Paid · verify',
    sectionTitle: 'Paid · awaiting verification',
    sectionHint: 'Payment submitted — check the reference, then confirm.',
    badge: 'bg-amber-100/90 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    cardClass: '!bg-gradient-to-br from-amber-50/90 to-white/85 dark:from-amber-900/20 dark:to-slate-800/80 !border-amber-300/50 dark:!border-amber-700/50',
    paymentHighlight: true,
    canVerify: true,
    canCancel: true,
    muted: false,
  },
  unpaid: {
    label: 'Unpaid hold',
    sectionTitle: 'Unpaid holds',
    sectionHint: 'No payment submitted yet — slot is held until they pay or it auto-cancels.',
    badge: 'bg-orange-100/90 dark:bg-orange-900/30 text-orange-900 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60',
    dot: 'bg-orange-500',
    cardClass: '!bg-gradient-to-br from-orange-50/90 to-white/88 dark:from-orange-900/20 dark:to-slate-800/80 !border-orange-400/45 dark:!border-orange-700/50',
    paymentHighlight: false,
    canVerify: false,
    canCancel: true,
    muted: false,
  },
  admin_unpaid: {
    label: 'Admin · not paid',
    sectionTitle: 'Admin reservations · unpaid',
    sectionHint: 'Confirmed admin booking — payment not marked collected yet.',
    badge: 'bg-indigo-100/90 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60',
    dot: 'bg-indigo-500',
    cardClass: '!bg-gradient-to-br from-indigo-50/90 to-white/88 dark:from-indigo-900/20 dark:to-slate-800/80 !border-indigo-300/55 dark:!border-indigo-700/50',
    paymentHighlight: false,
    canVerify: false,
    canCancel: true,
    muted: false,
  },
  confirmed: {
    label: 'Confirmed',
    sectionTitle: 'Confirmed',
    sectionHint: 'Paid and locked in — moves to Completed automatically when court time ends.',
    badge: 'bg-brand-gold-100/80 dark:bg-brand-navy-900/30 text-brand-gold-700 dark:text-brand-gold-400',
    dot: 'bg-brand-gold-500',
    cardClass: '',
    paymentHighlight: false,
    canVerify: false,
    canCancel: true,
    muted: false,
  },
  cancelled: {
    label: 'Cancelled',
    sectionTitle: 'Cancelled',
    sectionHint: 'Rejected, expired unpaid hold, or manually cancelled.',
    badge: 'bg-rose-100/80 dark:bg-rose-900/25 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/50',
    dot: 'bg-rose-400',
    cardClass: 'opacity-75',
    paymentHighlight: false,
    canVerify: false,
    canCancel: false,
    muted: true,
  },
  completed: {
    label: 'Completed',
    sectionTitle: 'Completed',
    sectionHint: 'Session finished — marked automatically when court time ends.',
    badge: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-slate-700',
    dot: 'bg-gray-400',
    cardClass: 'opacity-75',
    paymentHighlight: false,
    canVerify: false,
    canCancel: false,
    muted: true,
  },
  other: {
    label: 'Unknown',
    sectionTitle: 'Other',
    sectionHint: '',
    badge: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300',
    dot: 'bg-gray-300',
    cardClass: '',
    paymentHighlight: false,
    canVerify: false,
    canCancel: false,
    muted: true,
  },
}

export function getAdminBookingMeta(booking, now = new Date()) {
  const category = getAdminBookingCategory(booking, now)
  return { category, ...ADMIN_CATEGORY_META[category] }
}

export const ADMIN_BOOKING_SECTIONS = [
  'paid_verify',
  'unpaid',
  'admin_unpaid',
  'confirmed',
  'cancelled',
  'completed',
]

export function isAdminBookingPaid(booking, now = new Date()) {
  const cat = getAdminBookingCategory(booking, now)
  return cat === 'paid_verify' || cat === 'confirmed' || cat === 'completed'
}

export function isAdminBookingUnpaid(booking, now = new Date()) {
  const cat = getAdminBookingCategory(booking, now)
  return cat === 'unpaid' || cat === 'admin_unpaid'
}

export function isAdminBookingHistory(booking, now = new Date()) {
  const cat = getAdminBookingCategory(booking, now)
  return cat === 'cancelled' || cat === 'completed'
}

export function summarizePaidUnpaid(bookings, now = new Date()) {
  const paid = { count: 0, total: 0 }
  const unpaid = { count: 0, total: 0 }

  for (const booking of bookings) {
    if (isAdminBookingHistory(booking, now)) continue
    const amount = Number(booking.total_price) || 0
    if (isAdminBookingUnpaid(booking, now)) {
      unpaid.count += 1
      unpaid.total += amount
    } else if (isAdminBookingPaid(booking, now)) {
      paid.count += 1
      paid.total += amount
    }
  }

  return { paid, unpaid }
}

export function matchesAdminBookingFilter(booking, filter, now = new Date()) {
  if (filter === 'all') return true
  if (filter === 'paid') {
    return isAdminBookingPaid(booking, now) && !isAdminBookingHistory(booking, now)
  }
  if (filter === 'unpaid') return isAdminBookingUnpaid(booking, now)
  return getAdminBookingCategory(booking, now) === filter
}

export function countPaymentFilters(bookings, now = new Date()) {
  const counts = { all: bookings.length, paid: 0, unpaid: 0, cancelled: 0, completed: 0 }
  for (const booking of bookings) {
    if (isAdminBookingHistory(booking, now)) {
      const cat = getAdminBookingCategory(booking, now)
      if (cat === 'cancelled') counts.cancelled += 1
      else if (cat === 'completed') counts.completed += 1
      continue
    }
    if (isAdminBookingUnpaid(booking, now)) counts.unpaid += 1
    else if (isAdminBookingPaid(booking, now)) counts.paid += 1
  }
  return counts
}

export function getAdminBookingSortPriority(booking, now = new Date()) {
  const cat = getAdminBookingCategory(booking, now)
  if (cat === 'paid_verify') return 0
  if (cat === 'unpaid') return 1
  if (cat === 'admin_unpaid') return 2
  if (cat === 'confirmed') return 3
  if (cat === 'cancelled') return 4
  if (cat === 'completed') return 5
  return 6
}

/** paid_verify always first; then by workflow priority; then start time. */
export function sortAdminBookingsForDisplay(bookings, { filter, now = new Date() } = {}) {
  return [...bookings].sort((a, b) => {
    if (filter === 'paid') {
      const aNeedsVerify = getAdminBookingCategory(a, now) === 'paid_verify' ? 0 : 1
      const bNeedsVerify = getAdminBookingCategory(b, now) === 'paid_verify' ? 0 : 1
      if (aNeedsVerify !== bNeedsVerify) return aNeedsVerify - bNeedsVerify
      return a.start_hour - b.start_hour
    }

    const priorityDiff = getAdminBookingSortPriority(a, now) - getAdminBookingSortPriority(b, now)
    if (priorityDiff !== 0) return priorityDiff
    return a.start_hour - b.start_hour
  })
}

/** Day-view filter chips on Manage Bookings — label, copy, and chip styling. */
export const ADMIN_DAY_FILTERS = [
  {
    id: 'all',
    label: 'All',
    title: 'All bookings',
    description:
      'Every reservation on this day, grouped by status — from payment checks and holds through confirmed courts, cancelled, and completed sessions.',
    chipBorder: '',
    panelClass: 'border-brand-gold-200/70 bg-brand-gold-50/50 dark:border-brand-navy-700/50 dark:bg-brand-navy-900/20',
    titleClass: 'text-brand-navy-900 dark:text-brand-gold-100',
    bodyClass: 'text-brand-navy-800/90 dark:text-brand-gold-200/90',
  },
  {
    id: 'paid',
    label: 'Paid',
    title: 'Paid — active only',
    description:
      'Payment has been submitted or the booking is confirmed. Includes items waiting for your verification and courts already locked in. Finished or cancelled bookings are not shown here.',
    chipBorder: 'border-brand-gold-200/80 dark:border-brand-navy-700/60',
    panelClass: 'border-brand-gold-200/70 bg-brand-gold-50/60 dark:border-brand-navy-700/50 dark:bg-brand-navy-900/30',
    titleClass: 'text-brand-navy-900 dark:text-brand-gold-100',
    bodyClass: 'text-brand-navy-800/90 dark:text-brand-gold-200/90',
  },
  {
    id: 'unpaid',
    label: 'Unpaid',
    title: 'Unpaid — payment still needed',
    description:
      'Holds with no payment reference yet, plus admin reservations you have not marked as paid. Unpaid holds auto-cancel after 30 minutes if the player never pays.',
    chipBorder: 'border-orange-200/80 dark:border-orange-800/60',
    panelClass: 'border-orange-200/70 bg-orange-50/60 dark:border-orange-800/50 dark:bg-orange-900/20',
    titleClass: 'text-orange-900 dark:text-orange-100',
    bodyClass: 'text-orange-900/85 dark:text-orange-200/90',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    title: 'Cancelled — did not go through',
    description:
      'Bookings that were rejected, manually cancelled, or expired because payment was never submitted. No further action — kept here for your records.',
    chipBorder: 'border-rose-200/80 dark:border-rose-800/60',
    panelClass: 'border-rose-200/70 bg-rose-50/55 dark:border-rose-800/50 dark:bg-rose-900/15',
    titleClass: 'text-rose-900 dark:text-rose-100',
    bodyClass: 'text-rose-900/85 dark:text-rose-200/90',
  },
  {
    id: 'completed',
    label: 'Completed',
    title: 'Completed — session finished',
    description:
      'Court time has ended. These are marked automatically when the slot finishes — no need to tap Complete. Kept for history and monthly revenue.',
    chipBorder: 'border-gray-200/80 dark:border-gray-600/60',
    panelClass: 'border-gray-200/80 bg-gray-50/80 dark:border-gray-600/50 dark:bg-slate-800/40',
    titleClass: 'text-gray-900 dark:text-gray-100',
    bodyClass: 'text-gray-700 dark:text-gray-300',
  },
]

export function getAdminDayFilterMeta(filterId) {
  return ADMIN_DAY_FILTERS.find(f => f.id === filterId) ?? ADMIN_DAY_FILTERS[0]
}

export const ADMIN_LIST_SECTIONS = [
  {
    id: 'paid_verify',
    title: 'Needs verification',
    hint: 'Payment submitted — check the reference, then confirm.',
  },
  {
    id: 'unpaid',
    title: 'Unpaid',
    hint: 'No payment yet — holds until they pay or auto-cancel.',
  },
  {
    id: 'admin_unpaid',
    title: 'Admin · not paid',
    hint: 'Confirmed admin booking — payment not marked collected yet.',
  },
  {
    id: 'confirmed',
    title: 'Confirmed',
    hint: 'Upcoming or in progress — auto-completes when court time ends.',
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    hint: 'Rejected, expired hold, or manually cancelled.',
  },
  {
    id: 'completed',
    title: 'Completed',
    hint: 'Session finished — no action needed.',
  },
]

export function groupBookingsByPayment(bookings, now = new Date()) {
  const groups = { unpaid: [], paid: [], cancelled: [], completed: [] }
  for (const booking of bookings) {
    const cat = getAdminBookingCategory(booking, now)
    if (cat === 'cancelled') groups.cancelled.push(booking)
    else if (cat === 'completed') groups.completed.push(booking)
    else if (isAdminBookingUnpaid(booking, now)) groups.unpaid.push(booking)
    else groups.paid.push(booking)
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const aNeedsVerify = getAdminBookingCategory(a, now) === 'paid_verify' ? 0 : 1
      const bNeedsVerify = getAdminBookingCategory(b, now) === 'paid_verify' ? 0 : 1
      if (aNeedsVerify !== bNeedsVerify) return aNeedsVerify - bNeedsVerify
      return a.start_hour - b.start_hour
    })
  }
  return groups
}

export const ADMIN_PAYMENT_SECTIONS = [
  { id: 'unpaid', title: 'Unpaid', hint: 'No payment yet — holds and admin reservations awaiting payment.' },
  { id: 'paid', title: 'Paid', hint: 'Payment submitted or confirmed — verify if still processing.' },
  { id: 'cancelled', title: 'Cancelled', hint: 'Did not go through.' },
  { id: 'completed', title: 'Completed', hint: 'Session finished — auto-marked when court time ends.' },
]

export function countBookingsByCategory(bookings, now = new Date()) {
  const counts = {
    all: bookings.length,
    paid_verify: 0,
    unpaid: 0,
    admin_unpaid: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  }
  for (const booking of bookings) {
    const cat = getAdminBookingCategory(booking, now)
    if (counts[cat] != null) counts[cat] += 1
  }
  return counts
}

export function groupBookingsByCategory(bookings, now = new Date()) {
  const groups = Object.fromEntries(ADMIN_BOOKING_SECTIONS.map(id => [id, []]))
  for (const booking of bookings) {
    const cat = getAdminBookingCategory(booking, now)
    if (groups[cat]) groups[cat].push(booking)
  }
  for (const id of ADMIN_BOOKING_SECTIONS) {
    groups[id].sort((a, b) => a.start_hour - b.start_hour)
  }
  return groups
}

export function summarizeMonthBookings(bookings) {
  const { paid, unpaid } = summarizePaidUnpaid(bookings)
  const revenue = bookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((s, b) => s + Number(b.total_price), 0)
  return { paid, unpaid, revenue }
}

export function getCalendarDotCategory(dayBookings, now = new Date()) {
  const active = dayBookings.filter(b => getAdminBookingCategory(b, now) !== 'cancelled')
  if (active.some(b => getAdminBookingCategory(b, now) === 'paid_verify')) return 'paid_verify'
  if (active.some(b => isAdminBookingUnpaid(b, now))) return 'unpaid'
  if (active.some(b => isAdminBookingPaid(b, now))) return 'paid'
  return 'other'
}

export const CALENDAR_DOT_CLASS = {
  paid_verify: 'bg-amber-500',
  unpaid: 'bg-orange-500',
  paid: 'bg-brand-gold-500',
  other: 'bg-gray-300',
}
