import { SITE } from '../config/site'
import {
  countCourtsFreeAtSlot,
  isValidBookingRange,
} from './bookingHours'

export const MAX_COURT_QUANTITY = SITE.venue.maxCourtQuantity

/** Normalize saved draft values to 1–3. */
export function normalizeCourtQuantity(value, maxCourts = MAX_COURT_QUANTITY) {
  const cap = Math.min(MAX_COURT_QUANTITY, Math.max(1, maxCourts || 1))
  if (value === 'one' || value === 'auto') return 1
  if (value === 'multiple' || value === 'pick') return Math.min(2, cap)
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(cap, Math.max(1, Math.round(n)))
}

export function resolveBookingCourtIds(courts) {
  return courts.map(c => c.id)
}

export function canBookAtSlot(courtQuantity, startHour, durationHours, perCourtOccupied, pastHours) {
  const need = normalizeCourtQuantity(courtQuantity, perCourtOccupied.length || MAX_COURT_QUANTITY)
  if (!isValidBookingRange(startHour, durationHours)) return false
  return countCourtsFreeAtSlot(startHour, durationHours, perCourtOccupied, pastHours) >= need
}

export function getBookedCourtCount(courtQuantity) {
  return normalizeCourtQuantity(courtQuantity)
}

export function formatCourtSelectionLabel(courts, courtQuantity, assignedHolds = [], unitLabel = 'court') {
  if (assignedHolds.length > 0) {
    return assignedHolds
      .map(row => courts.find(c => c.id === row.court_id)?.name ?? unitLabel)
      .join(', ')
  }
  const n = normalizeCourtQuantity(courtQuantity, courts.length)
  if (n === 1) return `1 ${unitLabel} (auto-assigned)`
  return `${n} ${unitLabel}s (auto-assigned)`
}

export function maxSelectableCourts(activeCourtCount) {
  return Math.min(MAX_COURT_QUANTITY, Math.max(1, activeCourtCount))
}
