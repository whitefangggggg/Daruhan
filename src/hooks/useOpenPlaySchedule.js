import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getPastHoursForDate } from '../utils/bookingHours'
import {
  analyzeCourtsForOpenPlay,
  buildPerCourtOccupied,
} from '../utils/openPlaySchedule'

/**
 * Loads bookings + blocked slots for a date and analyzes court availability
 * for an open play window. Excludes the editing post's own block when updating.
 */
export function useOpenPlaySchedule({ courts, date, startHour, endHour, excludeBlockedSlotId = null }) {
  const courtIds = useMemo(() => courts.map(c => c.id), [courts])
  const courtKey = courtIds.join(',')

  const [bookings, setBookings] = useState([])
  const [blockedSlots, setBlockedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!date || courtIds.length === 0) {
      setBookings([])
      setBlockedSlots([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [bookingsRes, blocksRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('court_id, start_hour, duration_hours, status')
          .eq('date', date)
          .in('status', ['confirmed', 'processing'])
          .in('court_id', courtIds),
        supabase
          .from('blocked_slots')
          .select('id, court_id, start_hour, duration_hours, reason')
          .eq('date', date)
          .in('court_id', courtIds),
      ])

      if (cancelled) return

      if (bookingsRes.error || blocksRes.error) {
        setError(bookingsRes.error?.message ?? blocksRes.error?.message)
        setBookings([])
        setBlockedSlots([])
      } else {
        setBookings(bookingsRes.data ?? [])
        setBlockedSlots(blocksRes.data ?? [])
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [date, courtKey])

  const pastHours = useMemo(() => getPastHoursForDate(date), [date])

  const perCourtOccupied = useMemo(
    () => buildPerCourtOccupied(courtIds, bookings, blockedSlots, excludeBlockedSlotId),
    [courtIds, bookings, blockedSlots, excludeBlockedSlotId],
  )

  const courtAnalysis = useMemo(
    () => analyzeCourtsForOpenPlay({
      courts,
      perCourtOccupied,
      bookings,
      blockedSlots,
      startHour,
      endHour,
      excludeBlockedSlotId,
      pastHours,
    }),
    [courts, perCourtOccupied, bookings, blockedSlots, startHour, endHour, excludeBlockedSlotId, pastHours],
  )

  const availableCourtCount = courtAnalysis.filter(c => c.available).length

  return {
    bookings,
    blockedSlots,
    perCourtOccupied,
    courtAnalysis,
    availableCourtCount,
    pastHours,
    loading,
    error,
  }
}
