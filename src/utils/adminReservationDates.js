/**
 * Mirrors admin_create_reservations date selection in 011_admin_create_reservations.sql
 *
 * PostgreSQL extract(dow): 0=Sun … 6=Sat (same as JS Date.getDay()).
 * When repeatWeekly is false, only p_start_date is used server-side (p_end_date = start).
 * When repeatWeekly is true, every matching weekday from start through end is included.
 */

export function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Dates that admin_create_reservations would book (one entry per calendar day). */
export function getReservationDates(startStr, endStr, repeatWeekly) {
  const start = parseLocalDate(startStr)
  const end = parseLocalDate(endStr)
  if (end < start) return []

  const effectiveEnd = repeatWeekly ? end : start
  const targetDow = start.getDay()
  const dates = []
  const cursor = new Date(start)

  while (cursor <= effectiveEnd) {
    if (!repeatWeekly || cursor.getDay() === targetDow) {
      dates.push(formatDateLocal(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function countReservationDates(startStr, endStr, repeatWeekly) {
  return getReservationDates(startStr, endStr, repeatWeekly).length
}

/**
 * Params sent to admin_create_reservations — keep in sync with AdminReserveModal
 * and migration 012_admin_payment_collected.sql.
 *
 * paymentCollected: true = paid, false = not yet, null = not specified
 */
export function buildAdminReservationRpcParams({
  selectedDate,
  endDate,
  repeatWeekly,
  startHour,
  durationHours,
  courtIds,
  bookerName,
  adminNotes,
  paymentCollected = null,
}) {
  return {
    p_start_date: selectedDate,
    p_end_date: repeatWeekly ? endDate : selectedDate,
    p_start_hour: startHour,
    p_duration_hours: durationHours,
    p_court_ids: courtIds,
    p_booker_name: bookerName.trim(),
    p_repeat_weekly: repeatWeekly,
    p_admin_notes: adminNotes?.trim() || null,
    p_payment_collected: paymentCollected,
  }
}
