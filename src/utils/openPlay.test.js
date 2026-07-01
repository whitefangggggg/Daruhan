import { describe, it, expect } from 'vitest'
import {
  getOpenPlayDisplayStatus,
  getOpenPlayDurationHours,
  getOpenPlaySkillTheme,
  sortOpenPlayPosts,
  formatCountdown,
  formatCountdownLabel,
  isValidOpenPlayTimeRange,
} from './openPlay.js'

describe('getOpenPlayDisplayStatus', () => {
  const base = {
    status: 'upcoming',
    rsvp_deadline: new Date(Date.now() + 3600000).toISOString(),
  }

  it('returns upcoming before deadline', () => {
    expect(getOpenPlayDisplayStatus(base)).toBe('upcoming')
  })

  it('returns ended after deadline', () => {
    const post = { ...base, rsvp_deadline: new Date(Date.now() - 1000).toISOString() }
    expect(getOpenPlayDisplayStatus(post)).toBe('ended')
  })

  it('returns cancelled when manually cancelled', () => {
    const post = { ...base, status: 'cancelled' }
    expect(getOpenPlayDisplayStatus(post)).toBe('cancelled')
  })

  it('returns completed when admin wrapped up', () => {
    const post = { ...base, status: 'completed' }
    expect(getOpenPlayDisplayStatus(post)).toBe('completed')
  })
})

describe('sortOpenPlayPosts', () => {
  it('puts upcoming before ended', () => {
    const upcoming = {
      id: '1',
      status: 'upcoming',
      date: '2026-07-01',
      start_hour: 8,
      end_hour: 10,
      rsvp_deadline: new Date(Date.now() + 86400000).toISOString(),
    }
    const ended = {
      id: '2',
      status: 'ended',
      date: '2026-06-01',
      start_hour: 8,
      end_hour: 10,
      rsvp_deadline: new Date(Date.now() - 86400000).toISOString(),
    }
    const sorted = sortOpenPlayPosts([ended, upcoming])
    expect(sorted[0].id).toBe('1')
  })
})

describe('formatCountdown', () => {
  it('formats hours and minutes', () => {
    expect(formatCountdown(2 * 3600000 + 14 * 60000)).toBe('2h 14m 0s')
  })

  it('returns null when zero', () => {
    expect(formatCountdown(0)).toBeNull()
  })
})

describe('formatCountdownLabel', () => {
  it('prefixes RSVP close text', () => {
    expect(formatCountdownLabel(60000)).toBe('RSVPs close in 1m 0s')
    expect(formatCountdownLabel(0)).toBe('RSVPs closed')
  })
})

describe('getOpenPlayDurationHours', () => {
  it('uses end_hour minus start_hour', () => {
    expect(getOpenPlayDurationHours({ start_hour: 7, end_hour: 9 })).toBe(2)
  })
})

describe('isValidOpenPlayTimeRange', () => {
  it('rejects spill past midnight', () => {
    expect(isValidOpenPlayTimeRange(23, 25)).toBe(false)
  })
})

describe('getOpenPlaySkillTheme', () => {
  it('returns distinct themes per skill level', () => {
    expect(getOpenPlaySkillTheme('Advanced').id).toBe('advanced')
    expect(getOpenPlaySkillTheme('Beginner').id).toBe('beginner')
    expect(getOpenPlaySkillTheme('Intermediate').id).toBe('intermediate')
    expect(getOpenPlaySkillTheme('All Levels').id).toBe('all-levels')
  })

  it('falls back to All Levels for unknown values', () => {
    expect(getOpenPlaySkillTheme('Expert').id).toBe('all-levels')
    expect(getOpenPlaySkillTheme(null).id).toBe('all-levels')
  })
})
