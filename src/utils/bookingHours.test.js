import { describe, it, expect } from 'vitest'
import {
  getOccupiedHours,
  getBookingEndHour,
  getMaxDurationForStart,
  getMaxBookableDuration,
  getMaxDurationForDate,
  isValidBookingRange,
  canStartOnAnyCourt,
  canStartOnAllCourts,
  getHoursFullyOccupied,
  isBookingRangeFree,
  getVenueClosedHours,
} from './bookingHours.js'
import { calculateTotal } from '../lib/pricing.js'

function courtSets(...hourLists) {
  return hourLists.map(hours => new Set(hours))
}

describe('getHoursFullyOccupied', () => {
  it('marks hour booked only when every court is occupied', () => {
    const perCourt = courtSets([8, 9], [8], [])
    expect(getHoursFullyOccupied(perCourt).has(8)).toBe(false)
    expect(getHoursFullyOccupied(perCourt).has(9)).toBe(false)

    const allBusyAt8 = courtSets([8], [8], [8])
    expect(getHoursFullyOccupied(allBusyAt8).has(8)).toBe(true)
    expect(getHoursFullyOccupied(allBusyAt8).has(9)).toBe(false)
  })

  it('scopes to the courts in the set (subset selection)', () => {
    // Only courts A and B selected — hour 10 free on both → not booked
    const twoCourts = courtSets([10], [])
    expect(getHoursFullyOccupied(twoCourts).has(10)).toBe(false)

    // Both selected courts busy at 10 → booked
    const bothBusy = courtSets([10], [10])
    expect(getHoursFullyOccupied(bothBusy).has(10)).toBe(true)
  })
})

describe('canStartOnAnyCourt (user auto-assign)', () => {
  it('allows start when at least one court fits the full duration', () => {
    const perCourt = courtSets([9], [], [])
  // Court A busy 9pm, B and C free — 8pm 3h fits on B/C
    expect(canStartOnAnyCourt(20, 3, perCourt)).toBe(true)
  })

  it('rejects when no court fits', () => {
    const perCourt = courtSets([20, 21, 22], [20, 21, 22], [20, 21, 22])
    expect(canStartOnAnyCourt(20, 3, perCourt)).toBe(false)
  })
})

describe('canStartOnAllCourts (admin multi-court)', () => {
  it('rejects when any selected court is blocked mid-range', () => {
    const perCourt = courtSets([21], [])
    // 8pm–10pm: court A has 9pm booked
    expect(canStartOnAllCourts(20, 3, perCourt)).toBe(false)
  })

  it('allows when every selected court is free for full duration', () => {
    const perCourt = courtSets([14], [15])
    expect(canStartOnAllCourts(20, 3, perCourt)).toBe(true)
  })

  it('rejects when one of two courts conflicts', () => {
    const perCourt = courtSets([], [21])
    expect(canStartOnAllCourts(20, 3, perCourt)).toBe(false)
  })
})

describe('admin vs user pickability divergence', () => {
  const perCourt = courtSets([21], [], [])

  it('user can pick 8pm 3h (court B/C free) but admin cannot reserve all courts', () => {
    expect(canStartOnAnyCourt(20, 3, perCourt)).toBe(true)
    expect(canStartOnAllCourts(20, 3, perCourt)).toBe(false)
  })

  it('old admin heuristic (range free in fully-booked hours) wrongly allowed the slot', () => {
    const unavailable = getHoursFullyOccupied(perCourt)
    expect(isBookingRangeFree(20, 3, unavailable)).toBe(true)
    expect(canStartOnAllCourts(20, 3, perCourt)).toBe(false)
  })
})

describe('getBookingEndHour — the clock time a booking ends (for display)', () => {
  it('1 hour at 7am ends at 8am', () => {
    expect(getBookingEndHour(7, 1)).toBe(8)
  })

  it('2 hours at 7am ends at 9am (not 8am)', () => {
    expect(getBookingEndHour(7, 2)).toBe(9)
  })

  it('3 hours at 20 (8pm) ends at 23 (11pm)', () => {
    expect(getBookingEndHour(20, 3)).toBe(23)
  })

  it('1 hour at 23 ends at 24 (midnight)', () => {
    expect(getBookingEndHour(23, 1)).toBe(24)
  })
})

describe('isValidBookingRange / getMaxDurationForStart', () => {
  it('rejects ranges that spill past midnight on the same day', () => {
    expect(isValidBookingRange(23, 2)).toBe(false)
    expect(getMaxDurationForStart(23)).toBe(1)
    expect(getMaxDurationForStart(20)).toBe(4)
  })

  it('accepts 7am for 2 hours', () => {
    expect(isValidBookingRange(7, 2)).toBe(true)
    expect(getOccupiedHours(7, 2)).toEqual([7, 8])
  })

  it('does not wrap occupied hours to midnight', () => {
    expect(getOccupiedHours(22, 3)).toEqual([22, 23])
    expect(canStartOnAnyCourt(22, 3, [new Set()])).toBe(false)
  })
})

describe('getVenueClosedHours', () => {
  it('closes 5AM–7AM for 7AM–5AM operating hours', () => {
    expect([...getVenueClosedHours()].sort((a, b) => a - b)).toEqual([5, 6])
  })
})

describe('getMaxBookableDuration', () => {
  it('stops before the 5AM–7AM closed window', () => {
    expect(getMaxBookableDuration(4, new Set())).toBe(1)
    expect(getMaxBookableDuration(3, new Set())).toBe(2)
    expect(getMaxBookableDuration(0, new Set())).toBe(5)
  })

  it('caps at midnight on the same calendar day', () => {
    expect(getMaxBookableDuration(23, new Set())).toBe(1)
    expect(getMaxBookableDuration(20, new Set())).toBe(4)
  })

  it('returns the longest duration with any valid start today', () => {
    expect(getMaxDurationForDate(new Set())).toBe(17)
  })
})

describe('pricing parity (frontend mirrors SQL calculate_court_total)', () => {
  const cases = [
    [7, 1, 300],
    [7, 2, 600],
    [17, 1, 300],
    [16, 2, 600],
    [20, 3, 900],
    [0, 1, 300],
    [12, 4, 1200],
    [23, 3, 950],
  ]

  it.each(cases)('start=%i duration=%i → ₱%i', (start, dur, expected) => {
    expect(calculateTotal(start, dur)).toBe(expected)
  })
})

describe('getOccupiedHours', () => {
  it('returns consecutive slot indices for a block (NOT the end time)', () => {
    // start=7, duration=2 → slots 7 and 8 are occupied (7am-8am and 8am-9am)
    expect(getOccupiedHours(7, 2)).toEqual([7, 8])
    // The booking *ends* at 9am — that's getBookingEndHour, not here
    expect(getOccupiedHours(20, 3)).toEqual([20, 21, 22])
  })
})
