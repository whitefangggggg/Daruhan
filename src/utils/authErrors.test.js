import { describe, it, expect } from 'vitest'
import { formatAuthError } from './authErrors.js'

describe('formatAuthError', () => {
  it('explains email rate limits in plain language', () => {
    expect(formatAuthError('Email rate limit exceeded')).toMatch(/wait about an hour/i)
  })

  it('maps invalid credentials', () => {
    expect(formatAuthError('Invalid login credentials')).toMatch(/incorrect email or password/i)
  })
})
