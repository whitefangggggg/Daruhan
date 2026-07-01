import { addHours, isAfter, parseISO } from 'date-fns'

/** When the on-court session ends (local time, from booking date + hours). */
export function getSessionEndDateTime(booking) {
  const dayStart = parseISO(booking.date)
  const sessionStart = addHours(dayStart, booking.start_hour ?? 0)
  return addHours(sessionStart, booking.duration_hours ?? 1)
}

/** True once the court slot has passed or the booking was closed out. */
export function isSessionEnded(booking, now = new Date()) {
  if (booking.status === 'completed' || booking.status === 'cancelled') return true
  if (booking.status !== 'confirmed') return false
  return !isAfter(getSessionEndDateTime(booking), now)
}

/** Confirmed booking whose session is still ahead. */
export function isUpcomingConfirmed(booking, now = new Date()) {
  return booking.status === 'confirmed' && !isSessionEnded(booking, now)
}

/** Sum court hours from completed sessions. */
export function sumCompletedHours(bookings) {
  return bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.duration_hours ?? 0), 0)
}
