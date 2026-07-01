import { describe, it, expect } from 'vitest'
import {
  countPaymentFilters,
  getAdminBookingCategory,
  getAdminBookingMeta,
  getDisplayStatus,
  hasSubmittedUserPayment,
  isAdminBookingHistory,
  matchesAdminBookingFilter,
  summarizeMonthBookings,
  summarizePaidUnpaid,
  sortAdminBookingsForDisplay,
} from './bookingStatus.js'

describe('getAdminBookingCategory', () => {
  it('separates unpaid holds from paid processing', () => {
    expect(getAdminBookingCategory({ status: 'processing' })).toBe('unpaid')
    expect(getAdminBookingCategory({
      status: 'processing',
      payment_reference: 'REF123',
    })).toBe('paid_verify')
  })

  it('tracks admin reservations without payment collected', () => {
    expect(getAdminBookingCategory({
      status: 'confirmed',
      payment_reference: 'ADMIN',
      payment_collected: false,
    })).toBe('admin_unpaid')
    expect(getAdminBookingCategory({
      status: 'confirmed',
      payment_reference: 'ADMIN',
      payment_collected: true,
    })).toBe('confirmed')
  })

  it('uses cancelled and completed instead of a closed bucket', () => {
    expect(getAdminBookingCategory({ status: 'cancelled' })).toBe('cancelled')
    expect(getAdminBookingCategory({ status: 'completed' })).toBe('completed')
  })

  it('treats past confirmed sessions as completed', () => {
    const past = {
      status: 'confirmed',
      date: '2020-01-01',
      start_hour: 8,
      duration_hours: 2,
    }
    expect(getAdminBookingCategory(past)).toBe('completed')
  })
})

describe('getDisplayStatus', () => {
  it('shows completed for past confirmed sessions', () => {
    const past = {
      status: 'confirmed',
      date: '2020-01-01',
      start_hour: 8,
      duration_hours: 2,
    }
    expect(getDisplayStatus(past).label).toBe('Completed')
  })
})

describe('getAdminBookingMeta', () => {
  it('disables verify for unpaid holds', () => {
    expect(getAdminBookingMeta({ status: 'processing' }).canVerify).toBe(false)
    expect(getAdminBookingMeta({
      status: 'processing',
      payment_reference: 'REF123',
    }).canVerify).toBe(true)
  })

  it('disables actions on history bookings', () => {
    expect(getAdminBookingMeta({ status: 'cancelled' }).canCancel).toBe(false)
    expect(getAdminBookingMeta({ status: 'completed' }).canCancel).toBe(false)
  })
})

describe('hasSubmittedUserPayment', () => {
  it('ignores admin marker references', () => {
    expect(hasSubmittedUserPayment({ payment_reference: 'ADMIN' })).toBe(false)
    expect(hasSubmittedUserPayment({ payment_reference: 'GCASH-1' })).toBe(true)
  })
})

describe('matchesAdminBookingFilter', () => {
  it('filters by paid vs unpaid buckets', () => {
    const unpaid = { status: 'processing' }
    const paid = { status: 'processing', payment_reference: 'X' }
    const cancelled = { status: 'cancelled' }
    const completed = { status: 'completed' }
    expect(matchesAdminBookingFilter(unpaid, 'unpaid')).toBe(true)
    expect(matchesAdminBookingFilter(paid, 'unpaid')).toBe(false)
    expect(matchesAdminBookingFilter(paid, 'paid')).toBe(true)
    expect(matchesAdminBookingFilter(cancelled, 'paid')).toBe(false)
    expect(matchesAdminBookingFilter(cancelled, 'cancelled')).toBe(true)
    expect(matchesAdminBookingFilter(completed, 'completed')).toBe(true)
    expect(matchesAdminBookingFilter(completed, 'paid')).toBe(false)
    expect(matchesAdminBookingFilter(cancelled, 'all')).toBe(true)
  })
})

describe('countPaymentFilters', () => {
  it('counts cancelled and completed separately from paid and unpaid', () => {
    const counts = countPaymentFilters([
      { status: 'processing', date: '2030-01-01', start_hour: 8, duration_hours: 2 },
      { status: 'processing', payment_reference: 'A', date: '2030-01-01', start_hour: 9, duration_hours: 2 },
      { status: 'confirmed', date: '2030-01-01', start_hour: 10, duration_hours: 2 },
      { status: 'cancelled' },
      { status: 'completed' },
    ])
    expect(counts).toEqual({
      all: 5,
      unpaid: 1,
      paid: 2,
      cancelled: 1,
      completed: 1,
    })
  })
})

describe('isAdminBookingHistory', () => {
  it('includes cancelled and completed only', () => {
    expect(isAdminBookingHistory({ status: 'cancelled' })).toBe(true)
    expect(isAdminBookingHistory({ status: 'completed' })).toBe(true)
    expect(isAdminBookingHistory({ status: 'confirmed' })).toBe(false)
  })
})

describe('sortAdminBookingsForDisplay', () => {
  it('lists paid_verify before confirmed when filter is paid', () => {
    const confirmed = { status: 'confirmed', start_hour: 6, total_price: 100 }
    const verify = { status: 'processing', payment_reference: 'REF', start_hour: 10, total_price: 100 }
    const sorted = sortAdminBookingsForDisplay([confirmed, verify], { filter: 'paid' })
    expect(sorted[0].payment_reference).toBe('REF')
  })

  it('lists paid_verify before unpaid in the full day list', () => {
    const unpaid = { status: 'processing', start_hour: 8, total_price: 100 }
    const verify = { status: 'processing', payment_reference: 'REF', start_hour: 9, total_price: 100 }
    const sorted = sortAdminBookingsForDisplay([unpaid, verify])
    expect(sorted[0].payment_reference).toBe('REF')
  })
})

describe('summarizePaidUnpaid', () => {
  it('totals paid and unpaid counts and amounts', () => {
    const summary = summarizePaidUnpaid([
      { status: 'processing', total_price: 500 },
      { status: 'processing', payment_reference: 'A', total_price: 700 },
      { status: 'confirmed', total_price: 1000 },
      { status: 'confirmed', payment_reference: 'ADMIN', payment_collected: false, total_price: 300 },
      { status: 'cancelled', total_price: 999 },
      { status: 'completed', total_price: 400 },
    ])
    expect(summary.unpaid).toEqual({ count: 2, total: 800 })
    expect(summary.paid).toEqual({ count: 2, total: 1700 })
  })
})

describe('summarizeMonthBookings', () => {
  it('returns paid and unpaid totals for the month', () => {
    const summary = summarizeMonthBookings([
      { status: 'processing', total_price: 500 },
      { status: 'processing', payment_reference: 'A', total_price: 700 },
      { status: 'confirmed', total_price: 1000 },
    ])
    expect(summary.unpaid.count).toBe(1)
    expect(summary.paid.count).toBe(2)
    expect(summary.revenue).toBe(1000)
  })
})
