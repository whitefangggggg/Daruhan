import {
  countCourtsFreeAtSlot,
  getMaxDurationForStart,
  isValidBookingRange,
} from './bookingHours'

/** @typedef {'past' | 'none' | 'partial' | 'full'} SlotAvailabilityState */

/**
 * maxFreeForFullDuration(h): courts that stay free for every hour in [h, h + duration).
 * Same as countCourtsFreeAtSlot — min free courts across the range.
 */
export function maxFreeCourtsForFullDuration(startHour, durationHours, perCourtOccupied, pastHours = new Set()) {
  return countCourtsFreeAtSlot(startHour, durationHours, perCourtOccupied, pastHours)
}

/**
 * @param {number} free
 * @param {number} numCourts
 * @param {{ isPast?: boolean, invalid?: boolean }} [opts]
 * @returns {SlotAvailabilityState}
 */
export function classifySlotAvailability(free, numCourts, { isPast = false, invalid = false } = {}) {
  if (isPast || invalid || free <= 0) return 'none'
  if (free >= numCourts) return 'full'
  return 'partial'
}

/**
 * Precompute all 24 start-hour slots for the grid (memo-friendly single pass).
 * @returns {Array<{ hour: number, free: number, state: SlotAvailabilityState }>}
 */
export function computeSlotStates({ duration, numCourts, perCourtOccupied, pastHours = new Set() }) {
  const states = []
  for (let hour = 0; hour < 24; hour++) {
    const isPast = pastHours.has(hour)
    const invalid = !isValidBookingRange(hour, duration)
    const free = invalid || isPast
      ? 0
      : maxFreeCourtsForFullDuration(hour, duration, perCourtOccupied, pastHours)

    states.push({
      hour,
      free,
      state: isPast ? 'past' : classifySlotAvailability(free, numCourts, { invalid }),
    })
  }
  return states
}

export function countFullMatchSlots(duration, perCourtOccupied, pastHours, numCourts) {
  let count = 0
  for (let hour = 0; hour < 24; hour++) {
    if (pastHours.has(hour)) continue
    if (!isValidBookingRange(hour, duration)) continue
    const free = maxFreeCourtsForFullDuration(hour, duration, perCourtOccupied, pastHours)
    if (free >= numCourts) count += 1
  }
  return count
}

/** True when choosing numCourts - 1 unlocks at least two additional full-match starts. */
export function shouldShowCourtDowngradeHint({ duration, perCourtOccupied, pastHours, numCourts }) {
  if (numCourts <= 1) return false
  const atCurrent = countFullMatchSlots(duration, perCourtOccupied, pastHours, numCourts)
  const atReduced = countFullMatchSlots(duration, perCourtOccupied, pastHours, numCourts - 1)
  return atReduced - atCurrent >= 2
}

export function isStartHourValidForCourts(startHour, duration, numCourts, perCourtOccupied, pastHours) {
  if (startHour == null) return false
  return maxFreeCourtsForFullDuration(startHour, duration, perCourtOccupied, pastHours) >= numCourts
}

export { getMaxDurationForStart }
