import { describe, it, expect } from 'vitest'
import {
  resolveBookingCourtIds,
  canBookAtSlot,
  getBookedCourtCount,
  formatCourtSelectionLabel,
  normalizeCourtQuantity,
  maxSelectableCourts,
  MAX_COURT_QUANTITY,
} from './userBookingCourts.js'

const courts = [
  { id: 'a', name: 'Court 1' },
  { id: 'b', name: 'Court 2' },
  { id: 'c', name: 'Court 3' },
]

describe('normalizeCourtQuantity', () => {
  it('clamps to active courts and max 4', () => {
    expect(normalizeCourtQuantity(5, 2)).toBe(2)
    expect(normalizeCourtQuantity('multiple', 3)).toBe(2)
    expect(normalizeCourtQuantity('one', 3)).toBe(1)
  })
})

describe('maxSelectableCourts', () => {
  it('caps at venue max', () => {
    expect(maxSelectableCourts(5)).toBe(MAX_COURT_QUANTITY)
    expect(maxSelectableCourts(2)).toBe(2)
  })
})

describe('resolveBookingCourtIds', () => {
  it('uses all courts as the auto-assign pool', () => {
    expect(resolveBookingCourtIds(courts)).toEqual(['a', 'b', 'c'])
  })
})

describe('getBookedCourtCount', () => {
  it('returns the requested quantity', () => {
    expect(getBookedCourtCount(2)).toBe(2)
  })
})

describe('canBookAtSlot', () => {
  const perCourt = [new Set([10]), new Set(), new Set()]

  it('allows 1 court when any is free', () => {
    expect(canBookAtSlot(1, 9, 1, perCourt, new Set())).toBe(true)
  })

  it('requires enough free courts for 2 or 3', () => {
    expect(canBookAtSlot(2, 10, 1, perCourt, new Set())).toBe(true)
    expect(canBookAtSlot(3, 10, 1, perCourt, new Set())).toBe(false)
    expect(canBookAtSlot(2, 11, 1, perCourt, new Set())).toBe(true)
  })
})

describe('formatCourtSelectionLabel', () => {
  it('labels assigned courts after hold', () => {
    expect(formatCourtSelectionLabel(courts, 2, [{ court_id: 'b' }, { court_id: 'c' }])).toBe('Court 2, Court 3')
  })

  it('describes quantity before hold', () => {
    expect(formatCourtSelectionLabel(courts, 2)).toBe('2 courts (auto-assigned)')
  })
})
