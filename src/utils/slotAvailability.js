import {
  countCourtsFreeAtSlot,
  getMaxBookableDuration,
  getOperatingDisplayHours,
} from './bookingHours'

/** @typedef {'past' | 'closed' | 'wontFit' | 'none' | 'partial' | 'full'} SlotAvailabilityState */

/**
 * maxFreeForFullDuration(h): courts that stay free for every hour in [h, h + duration).
 * Same as countCourtsFreeAtSlot — min free courts across the range.
 */
export function maxFreeCourtsForFullDuration(startHour, durationHours, perCourtOccupied, blockedHours = new Set(), operatingHours) {
  return countCourtsFreeAtSlot(startHour, durationHours, perCourtOccupied, blockedHours, operatingHours)
}

/**
 * @param {number} free
 * @param {number} numCourts
 * @returns {SlotAvailabilityState}
 */
export function classifySlotAvailability(free, numCourts) {
  if (free <= 0) return 'none'
  if (free >= numCourts) return 'full'
  return 'partial'
}

/**
 * Precompute slot states for the operating-hours grid (memo-friendly single pass).
 * @returns {Array<{ hour: number, free: number, state: SlotAvailabilityState }>}
 */
export function computeSlotStates({
  duration,
  numCourts,
  perCourtOccupied,
  blockedHours = new Set(),
  pastHours = new Set(),
  operatingHours,
}) {
  const states = []
  for (const hour of getOperatingDisplayHours(operatingHours)) {
    if (pastHours.has(hour)) {
      states.push({ hour, free: 0, state: 'past' })
      continue
    }

    if (getMaxBookableDuration(hour, blockedHours, operatingHours) < duration) {
      states.push({ hour, free: 0, state: 'wontFit' })
      continue
    }

    const free = maxFreeCourtsForFullDuration(hour, duration, perCourtOccupied, blockedHours, operatingHours)
    states.push({
      hour,
      free,
      state: classifySlotAvailability(free, numCourts),
    })
  }
  return states
}

export function countFullMatchSlots(duration, perCourtOccupied, blockedHours, numCourts, operatingHours) {
  let count = 0
  for (const hour of getOperatingDisplayHours(operatingHours)) {
    if (getMaxBookableDuration(hour, blockedHours, operatingHours) < duration) continue
    const free = maxFreeCourtsForFullDuration(hour, duration, perCourtOccupied, blockedHours, operatingHours)
    if (free >= numCourts) count += 1
  }
  return count
}

/** True when choosing numCourts - 1 unlocks at least two additional full-match starts. */
export function shouldShowCourtDowngradeHint({ duration, perCourtOccupied, blockedHours, numCourts, operatingHours }) {
  if (numCourts <= 1) return false
  const atCurrent = countFullMatchSlots(duration, perCourtOccupied, blockedHours, numCourts, operatingHours)
  const atReduced = countFullMatchSlots(duration, perCourtOccupied, blockedHours, numCourts - 1, operatingHours)
  return atReduced - atCurrent >= 2
}

export function isStartHourValidForCourts(startHour, duration, numCourts, perCourtOccupied, blockedHours, operatingHours) {
  if (startHour == null) return false
  return maxFreeCourtsForFullDuration(startHour, duration, perCourtOccupied, blockedHours, operatingHours) >= numCourts
}

export { getMaxDurationForStart } from './bookingHours'
