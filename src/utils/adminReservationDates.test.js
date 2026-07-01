import { describe, it, expect } from 'vitest'
import {
  getReservationDates,
  countReservationDates,
  buildAdminReservationRpcParams,
} from './adminReservationDates.js'

describe('getReservationDates / countReservationDates', () => {
  it('single day when repeat is off (ignores far endDate)', () => {
    expect(getReservationDates('2026-06-18', '2026-06-30', false)).toEqual(['2026-06-18'])
    expect(countReservationDates('2026-06-18', '2026-06-30', false)).toBe(1)
  })

  it('single day when repeat off and start equals end', () => {
    expect(getReservationDates('2026-06-18', '2026-06-18', false)).toEqual(['2026-06-18'])
  })

  it('weekly repeat on Thursdays Jun 18–30 2026 (2 Thursdays)', () => {
    // 2026-06-18 is Thursday (dow 4)
    expect(getReservationDates('2026-06-18', '2026-06-30', true)).toEqual([
      '2026-06-18',
      '2026-06-25',
    ])
    expect(countReservationDates('2026-06-18', '2026-06-30', true)).toBe(2)
  })

  it('weekly repeat on Mondays Jun 1–30 2026', () => {
    // 2026-06-01 is Monday
    expect(getReservationDates('2026-06-01', '2026-06-30', true)).toEqual([
      '2026-06-01',
      '2026-06-08',
      '2026-06-15',
      '2026-06-22',
      '2026-06-29',
    ])
    expect(countReservationDates('2026-06-01', '2026-06-30', true)).toBe(5)
  })

  it('weekly repeat with same start and end is one occurrence', () => {
    expect(getReservationDates('2026-06-18', '2026-06-18', true)).toEqual(['2026-06-18'])
  })

  it('returns empty when end is before start', () => {
    expect(getReservationDates('2026-06-20', '2026-06-10', true)).toEqual([])
    expect(getReservationDates('2026-06-20', '2026-06-10', false)).toEqual([])
  })

  it('repeat on does NOT book every day in range', () => {
    const dates = getReservationDates('2026-06-18', '2026-06-24', true)
    expect(dates).toEqual(['2026-06-18'])
    expect(dates.length).toBeLessThan(7)
  })

  it('repeat off does NOT book every day even if endDate is month end', () => {
    const dates = getReservationDates('2026-06-18', '2026-08-31', false)
    expect(dates).toHaveLength(1)
    expect(dates[0]).toBe('2026-06-18')
  })
})

describe('buildAdminReservationRpcParams', () => {
  const base = {
    selectedDate: '2026-06-18',
    endDate: '2026-08-31',
    startHour: 20,
    durationHours: 3,
    courtIds: ['c1', 'c2', 'c3'],
    bookerName: 'Ggift',
    adminNotes: '',
  }

  it('repeat off: single day, repeat flag false', () => {
    const params = buildAdminReservationRpcParams({ ...base, repeatWeekly: false })
    expect(params.p_start_date).toBe('2026-06-18')
    expect(params.p_end_date).toBe('2026-06-18')
    expect(params.p_repeat_weekly).toBe(false)
  })

  it('repeat on: uses end date and repeat flag true', () => {
    const params = buildAdminReservationRpcParams({ ...base, repeatWeekly: true })
    expect(params.p_start_date).toBe('2026-06-18')
    expect(params.p_end_date).toBe('2026-08-31')
    expect(params.p_repeat_weekly).toBe(true)
  })

  it('trims booker name and nulls empty notes', () => {
    const params = buildAdminReservationRpcParams({
      ...base,
      repeatWeekly: false,
      bookerName: '  Bas Quano  ',
      adminNotes: '   ',
    })
    expect(params.p_booker_name).toBe('Bas Quano')
    expect(params.p_admin_notes).toBeNull()
  })
})

describe('slot totals (preview math)', () => {
  it('3 courts × 2 weekly dates = 6 slots', () => {
    const dates = countReservationDates('2026-06-18', '2026-06-30', true)
    expect(dates * 3).toBe(6)
  })

  it('3 courts × 1 single day = 3 slots', () => {
    const dates = countReservationDates('2026-06-18', '2026-06-30', false)
    expect(dates * 3).toBe(3)
  })
})
