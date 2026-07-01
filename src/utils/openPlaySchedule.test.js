import { describe, it, expect } from 'vitest'
import {
  analyzeCourtsForOpenPlay,
  getCourtOpenPlayConflicts,
  openPlayRangeFitsCourt,
  pickFirstAvailableCourt,
} from './openPlaySchedule.js'

const courts = [
  { id: 'c1', name: 'Court 1' },
  { id: 'c2', name: 'Court 2' },
]

describe('getCourtOpenPlayConflicts', () => {
  it('detects overlapping confirmed bookings', () => {
    const conflicts = getCourtOpenPlayConflicts({
      courtId: 'c1',
      startHour: 8,
      endHour: 10,
      bookings: [{ court_id: 'c1', start_hour: 9, duration_hours: 2, status: 'confirmed' }],
      blockedSlots: [],
    })
    expect(conflicts.some(c => c.type === 'booking')).toBe(true)
  })

  it('detects blocked slots and open play blocks', () => {
    const conflicts = getCourtOpenPlayConflicts({
      courtId: 'c1',
      startHour: 8,
      endHour: 10,
      bookings: [],
      blockedSlots: [{
        id: 'b1',
        court_id: 'c1',
        start_hour: 8,
        duration_hours: 2,
        reason: 'Open Play: Morning rally',
      }],
    })
    expect(conflicts.some(c => c.type === 'open_play')).toBe(true)
  })

  it('ignores the editing post block when excluded', () => {
    const conflicts = getCourtOpenPlayConflicts({
      courtId: 'c1',
      startHour: 8,
      endHour: 10,
      bookings: [],
      blockedSlots: [{
        id: 'keep',
        court_id: 'c1',
        start_hour: 8,
        duration_hours: 2,
        reason: 'Open Play: Morning rally',
      }],
      excludeBlockedSlotId: 'keep',
    })
    expect(conflicts).toHaveLength(0)
  })
})

describe('analyzeCourtsForOpenPlay', () => {
  it('marks only courts free for the full window', () => {
    const perCourtOccupied = new Map([
      ['c1', new Set([8, 9])],
      ['c2', new Set()],
    ])
    const analysis = analyzeCourtsForOpenPlay({
      courts,
      perCourtOccupied,
      bookings: [{ court_id: 'c1', start_hour: 8, duration_hours: 2, status: 'confirmed' }],
      blockedSlots: [],
      startHour: 8,
      endHour: 10,
    })
    expect(analysis.find(c => c.courtId === 'c1')?.available).toBe(false)
    expect(analysis.find(c => c.courtId === 'c2')?.available).toBe(true)
  })
})

describe('openPlayRangeFitsCourt', () => {
  it('requires every hour in the window to be free', () => {
    expect(openPlayRangeFitsCourt(new Set([9]), 8, 10)).toBe(false)
    expect(openPlayRangeFitsCourt(new Set([9]), 10, 12)).toBe(true)
  })
})

describe('pickFirstAvailableCourt', () => {
  it('keeps current court when still available', () => {
    const analysis = [
      { courtId: 'c1', available: true },
      { courtId: 'c2', available: true },
    ]
    expect(pickFirstAvailableCourt(analysis, 'c2')).toBe('c2')
  })

  it('switches to the first free court when current is blocked', () => {
    const analysis = [
      { courtId: 'c1', available: false },
      { courtId: 'c2', available: true },
    ]
    expect(pickFirstAvailableCourt(analysis, 'c1')).toBe('c2')
  })
})
