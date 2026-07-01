import { describe, it, expect } from 'vitest'
import {
  getRateForHour,
  getBracketForHour,
  calculateTotal,
  RATE_BRACKETS,
} from '../lib/pricing.js'

describe('getRateForHour', () => {
  it.each([
    [0, 300],
    [1, 350],
    [5, 350],
    [7, 300],
    [12, 300],
    [23, 300],
  ])('hour %i → ₱%i', (hour, rate) => {
    expect(getRateForHour(hour)).toBe(rate)
  })
})

describe('getBracketForHour', () => {
  it('maps boundary hours to the correct bracket', () => {
    expect(getBracketForHour(0).id).toBe('daytime')
    expect(getBracketForHour(5).id).toBe('lateNight')
    expect(getBracketForHour(7).id).toBe('daytime')
    expect(getBracketForHour(23).id).toBe('daytime')
  })
})

describe('RATE_BRACKETS display', () => {
  it('matches getRateForHour for each bracket sample hour', () => {
    const samples = [
      { bracketId: 'daytime', hour: 10 },
      { bracketId: 'lateNight', hour: 3 },
    ]
    for (const { bracketId, hour } of samples) {
      const bracket = RATE_BRACKETS.find(b => b.id === bracketId)
      expect(getRateForHour(hour)).toBe(bracket.rate)
    }
  })
})

describe('calculateTotal', () => {
  it('sums each hour in a cross-bracket booking', () => {
    // 11PM (300) + 12MN (300) + 1AM (350) = 950
    expect(calculateTotal(23, 3)).toBe(950)
  })
})
