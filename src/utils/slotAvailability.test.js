import { describe, it, expect } from 'vitest'
import {
  classifySlotAvailability,
  computeSlotStates,
  countFullMatchSlots,
  maxFreeCourtsForFullDuration,
  shouldShowCourtDowngradeHint,
} from './slotAvailability.js'

function courtSets(...hourLists) {
  return hourLists.map(hours => new Set(hours))
}

describe('maxFreeCourtsForFullDuration', () => {
  it('returns courts free for the entire duration (min across hours)', () => {
    const perCourt = courtSets([21], [], [])
    // 8pm–10pm: only courts B and C free for all 3 hours
    expect(maxFreeCourtsForFullDuration(20, 3, perCourt)).toBe(2)
  })

  it('returns 0 when no court fits the full range', () => {
    const perCourt = courtSets([20, 21, 22], [20, 21, 22], [20, 21, 22])
    expect(maxFreeCourtsForFullDuration(20, 3, perCourt)).toBe(0)
  })
})

describe('classifySlotAvailability', () => {
  it('classifies full, partial, and none against requested courts', () => {
    expect(classifySlotAvailability(3, 3)).toBe('full')
    expect(classifySlotAvailability(2, 3)).toBe('partial')
    expect(classifySlotAvailability(0, 3)).toBe('none')
    expect(classifySlotAvailability(2, 3, { isPast: true })).toBe('none')
  })
})

describe('computeSlotStates', () => {
  it('marks partial slots when fewer courts free than requested', () => {
    const perCourt = courtSets([21], [], [])
    const states = computeSlotStates({
      duration: 3,
      numCourts: 3,
      perCourtOccupied: perCourt,
      pastHours: new Set(),
    })
    const eightPm = states.find(s => s.hour === 20)
    expect(eightPm?.free).toBe(2)
    expect(eightPm?.state).toBe('partial')
  })
})

describe('shouldShowCourtDowngradeHint', () => {
  it('suggests fewer courts when two more full slots unlock', () => {
    const perCourt = courtSets([21], [], [])
    const atThree = countFullMatchSlots(3, perCourt, new Set(), 3)
    const atTwo = countFullMatchSlots(3, perCourt, new Set(), 2)
    expect(atTwo - atThree).toBeGreaterThanOrEqual(2)
    expect(shouldShowCourtDowngradeHint({
      duration: 3,
      perCourtOccupied: perCourt,
      pastHours: new Set(),
      numCourts: 3,
    })).toBe(true)
  })

  it('is false when only one court requested', () => {
    expect(shouldShowCourtDowngradeHint({
      duration: 2,
      perCourtOccupied: courtSets([]),
      pastHours: new Set(),
      numCourts: 1,
    })).toBe(false)
  })
})
