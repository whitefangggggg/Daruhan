import { SITE } from '../config/site'

/** Hour indices (0–23) occupied within the same calendar day. No midnight wrap. */
export function getOccupiedHours(startHour, durationHours) {
  const hours = []
  for (let i = 0; i < durationHours; i++) {
    const h = startHour + i
    if (h >= 24) break
    hours.push(h)
  }
  return hours
}

/** Max duration that fits on the same calendar day from this start hour. */
export function getMaxDurationForStart(startHour) {
  if (startHour == null || startHour < 0 || startHour > 23) return 24
  return 24 - startHour
}

/**
 * Max duration from `startHour` that stays on the same calendar day and does not
 * cross venue closed hours or other blocked hours (e.g. past slots today).
 */
export function getMaxBookableDuration(startHour, blockedHours = new Set(), operatingHours) {
  if (startHour == null || startHour < 0 || startHour > 23) return 0
  const closed = getVenueClosedHours(operatingHours)
  let max = 0
  for (let dur = 1; dur <= 24; dur++) {
    if (!isValidBookingRange(startHour, dur)) break
    const range = getOccupiedHours(startHour, dur)
    if (range.length !== dur) break
    if (range.some(h => closed.has(h) || blockedHours.has(h))) break
    max = dur
  }
  return max
}

/** Longest duration that fits at least one start hour on this date. */
export function getMaxDurationForDate(blockedHours = new Set(), operatingHours) {
  let max = 0
  for (let start = 0; start < 24; start++) {
    if (blockedHours.has(start)) continue
    max = Math.max(max, getMaxBookableDuration(start, blockedHours, operatingHours))
  }
  return Math.max(1, max)
}

/** True when start + duration fits on one calendar day (matches SQL int4range on 0–23). */
export function isValidBookingRange(startHour, durationHours) {
  if (startHour == null || durationHours == null) return false
  return (
    startHour >= 0
    && startHour <= 23
    && durationHours >= 1
    && durationHours <= 24
    && startHour + durationHours <= 24
  )
}

/** Hours already passed today — not bookable when `dateStr` is today (local time). */
export function getPastHoursForDate(dateStr, now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (dateStr !== today) return new Set()
  const past = new Set()
  for (let h = 0; h < now.getHours(); h++) past.add(h)
  return past
}

/** Hours when the venue is closed (e.g. 5AM–7AM for 7AM–5AM operating hours). */
export function getVenueClosedHours(operatingHours = SITE.venue.operatingHours) {
  const { openHour = 0, closeHour = 0 } = operatingHours ?? {}
  const closed = new Set()
  if (closeHour === openHour) return closed
  if (closeHour < openHour) {
    for (let h = closeHour; h < openHour; h++) closed.add(h)
    return closed
  }
  for (let h = closeHour; h < 24; h++) closed.add(h)
  for (let h = 0; h < openHour; h++) closed.add(h)
  return closed
}

/** Past hours plus daily closed hours — used for slot pickers. */
export function getBlockedHoursForDate(dateStr, now = new Date(), operatingHours) {
  const blocked = getVenueClosedHours(operatingHours)
  for (const h of getPastHoursForDate(dateStr, now)) blocked.add(h)
  return blocked
}

/**
 * Hours shown in booking grids: openHour..23, then 0..openHour-1 (excludes closed window).
 * Matches 7AM–12MN then 12MN–5AM with 5AM–7AM omitted.
 */
export function getOperatingDisplayHours(operatingHours = SITE.venue.operatingHours) {
  const { openHour = 7 } = operatingHours ?? {}
  const closed = getVenueClosedHours(operatingHours)
  const hours = []
  for (let h = openHour; h < 24; h++) {
    if (!closed.has(h)) hours.push(h)
  }
  for (let h = 0; h < openHour; h++) {
    if (!closed.has(h)) hours.push(h)
  }
  return hours
}

/** True when a booking of `durationHours` can start at `startHour` on this date. */
export function canBookDurationAtStart(startHour, durationHours, blockedHours = new Set()) {
  return getMaxBookableDuration(startHour, blockedHours) >= durationHours
}

/** True when the full range is still ahead and fits on at least one court. */
export function canStartOnAnyCourt(startHour, durationHours, perCourtOccupied, pastHours = new Set(), operatingHours) {
  if (!isValidBookingRange(startHour, durationHours)) return false
  const range = getOccupiedHours(startHour, durationHours)
  if (range.length !== durationHours) return false
  const closed = getVenueClosedHours(operatingHours)
  if (range.some(h => pastHours.has(h) || closed.has(h))) return false
  if (!perCourtOccupied.length) return false
  return perCourtOccupied.some(occupied => range.every(h => !occupied.has(h)))
}

/** True when the full range fits on every court (admin multi-court reservations). */
export function canStartOnAllCourts(startHour, durationHours, perCourtOccupied, pastHours = new Set(), operatingHours) {
  if (!isValidBookingRange(startHour, durationHours)) return false
  const range = getOccupiedHours(startHour, durationHours)
  if (range.length !== durationHours) return false
  const closed = getVenueClosedHours(operatingHours)
  if (range.some(h => pastHours.has(h) || closed.has(h))) return false
  if (!perCourtOccupied.length) return false
  return perCourtOccupied.every(occupied => range.every(h => !occupied.has(h)))
}

/** How many courts can fit a booking at this start time. */
export function countCourtsFreeAtSlot(startHour, durationHours, perCourtOccupied, pastHours = new Set(), operatingHours) {
  if (!isValidBookingRange(startHour, durationHours)) return 0
  const range = getOccupiedHours(startHour, durationHours)
  if (range.length !== durationHours) return 0
  const closed = getVenueClosedHours(operatingHours)
  if (range.some(h => pastHours.has(h) || closed.has(h))) return 0
  if (!perCourtOccupied.length) return 0
  return perCourtOccupied.filter(occupied => range.every(h => !occupied.has(h))).length
}

/** Hours where every court in the set is occupied — used for "Booked" grid cells. */
export function getHoursFullyOccupied(perCourtOccupied) {
  const hours = new Set()
  if (!perCourtOccupied.length) return hours
  for (let h = 0; h < 24; h++) {
    if (perCourtOccupied.every(occupied => occupied.has(h))) hours.add(h)
  }
  return hours
}

/** True when every occupied hour is free in `unavailableHours`. */
export function isBookingRangeFree(startHour, durationHours, unavailableHours) {
  if (startHour == null || durationHours < 1) return false
  return getOccupiedHours(startHour, durationHours).every(h => !unavailableHours.has(h))
}

/** Same-day interval overlap (matches hold creation in Book.jsx). */
export function bookingRangesOverlap(startA, durationA, startB, durationB) {
  const endA = startA + durationA
  const endB = startB + durationB
  return startA < endB && endA > startB
}

/**
 * The clock hour when this booking ENDS — e.g. start=7 + duration=2 → 9 (7AM–9AM).
 * Can be 24 for a block ending at midnight. Same-day only; use isValidBookingRange first.
 */
export function getBookingEndHour(startHour, durationHours) {
  return startHour + durationHours
}

/**
 * @deprecated Use getBookingEndHour for display.  This returns the index of the
 * last occupied *slot* (start + duration - 1), not the end-of-booking clock time.
 */
export function getLastOccupiedHour(startHour, durationHours) {
  if (durationHours < 1) return startHour
  return (startHour + durationHours - 1) % 24
}
