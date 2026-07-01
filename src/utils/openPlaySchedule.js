import { bookingRangesOverlap } from './bookingHours'
import { formatOpenPlayHour, isValidOpenPlayTimeRange } from './openPlay'

export function getOpenPlayRangeHours(startHour, endHour) {
  const hours = []
  for (let h = startHour; h < endHour; h++) hours.push(h)
  return hours
}

export function buildOccupiedSetFromSlots(slots) {
  const hours = new Set()
  for (const slot of slots) {
    for (let i = 0; i < slot.duration_hours; i++) {
      const h = slot.start_hour + i
      if (h < 24) hours.add(h)
    }
  }
  return hours
}

export function buildPerCourtOccupied(courtIds, bookings, blockedSlots, excludeBlockedSlotId = null) {
  const map = new Map(courtIds.map(id => [id, new Set()]))

  for (const booking of bookings) {
    if (!map.has(booking.court_id)) continue
    for (const h of buildOccupiedSetFromSlots([booking])) {
      map.get(booking.court_id).add(h)
    }
  }

  for (const slot of blockedSlots) {
    if (excludeBlockedSlotId && slot.id === excludeBlockedSlotId) continue
    if (!map.has(slot.court_id)) continue
    for (const h of buildOccupiedSetFromSlots([slot])) {
      map.get(slot.court_id).add(h)
    }
  }

  return map
}

export function openPlayRangeFitsCourt(occupiedSet, startHour, endHour, pastHours = new Set()) {
  if (!isValidOpenPlayTimeRange(startHour, endHour)) return false
  const range = getOpenPlayRangeHours(startHour, endHour)
  if (range.some(h => pastHours.has(h))) return false
  return range.every(h => !occupiedSet.has(h))
}

export function describeBookingConflict(booking) {
  const end = booking.start_hour + booking.duration_hours
  const statusLabel = booking.status === 'processing' ? 'pending payment' : 'confirmed'
  return `${formatOpenPlayHour(booking.start_hour)}–${formatOpenPlayHour(end)} · ${statusLabel} booking`
}

export function describeBlockedConflict(slot) {
  if (slot.reason?.startsWith('Open Play')) {
    const title = slot.reason.replace(/^Open Play:\s?/, '').trim()
    return title ? `Open play · ${title}` : 'Open play session'
  }
  return slot.reason?.trim() || 'Court blocked'
}

export function getCourtOpenPlayConflicts({
  courtId,
  startHour,
  endHour,
  bookings = [],
  blockedSlots = [],
  excludeBlockedSlotId = null,
  pastHours = new Set(),
}) {
  if (!isValidOpenPlayTimeRange(startHour, endHour)) return [{ type: 'invalid', summary: 'Invalid time range' }]

  const duration = endHour - startHour
  const conflicts = []
  const range = getOpenPlayRangeHours(startHour, endHour)

  if (range.some(h => pastHours.has(h))) {
    conflicts.push({ type: 'past', summary: 'Part of this window has already passed' })
  }

  for (const booking of bookings) {
    if (booking.court_id !== courtId) continue
    if (!['confirmed', 'processing'].includes(booking.status)) continue
    if (bookingRangesOverlap(startHour, duration, booking.start_hour, booking.duration_hours)) {
      conflicts.push({
        type: 'booking',
        summary: describeBookingConflict(booking),
        startHour: booking.start_hour,
        endHour: booking.start_hour + booking.duration_hours,
      })
    }
  }

  for (const slot of blockedSlots) {
    if (slot.court_id !== courtId) continue
    if (excludeBlockedSlotId && slot.id === excludeBlockedSlotId) continue
    if (bookingRangesOverlap(startHour, duration, slot.start_hour, slot.duration_hours)) {
      conflicts.push({
        type: slot.reason?.startsWith('Open Play') ? 'open_play' : 'blocked',
        summary: describeBlockedConflict(slot),
        startHour: slot.start_hour,
        endHour: slot.start_hour + slot.duration_hours,
      })
    }
  }

  return conflicts
}

export function analyzeCourtsForOpenPlay({
  courts,
  perCourtOccupied,
  bookings,
  blockedSlots,
  startHour,
  endHour,
  excludeBlockedSlotId = null,
  pastHours = new Set(),
}) {
  return courts.map(court => {
    const occupied = perCourtOccupied.get(court.id) ?? new Set()
    const conflicts = getCourtOpenPlayConflicts({
      courtId: court.id,
      startHour,
      endHour,
      bookings,
      blockedSlots,
      excludeBlockedSlotId,
      pastHours,
    })
    const available = openPlayRangeFitsCourt(occupied, startHour, endHour, pastHours)

    return {
      courtId: court.id,
      courtName: court.name,
      available,
      conflicts,
      primaryConflict: conflicts[0]?.summary ?? null,
    }
  })
}

export function pickFirstAvailableCourt(courtAnalysis, currentCourtId) {
  const current = courtAnalysis.find(c => c.courtId === currentCourtId)
  if (current?.available) return currentCourtId
  return courtAnalysis.find(c => c.available)?.courtId ?? ''
}

export function formatOpenPlayWindow(startHour, endHour) {
  return `${formatOpenPlayHour(startHour)} – ${formatOpenPlayHour(endHour)}`
}
