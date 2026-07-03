import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  getPastHoursForDate,
  getBlockedHoursForDate,
  canStartOnAnyCourt,
  getHoursFullyOccupied,
} from '../utils/bookingHours'

function buildOccupiedSet(slots) {
  const hours = new Set()
  for (const slot of slots) {
    for (let i = 0; i < slot.duration_hours; i++) {
      const h = slot.start_hour + i
      if (h < 24) hours.add(h)
    }
  }
  return hours
}

/**
 * Availability across one or more courts (auto-assign uses all active courts).
 * A slot is pickable when at least one court can fit the booking; an hour shows
 * "Booked" only when every court has that hour taken.
 */
export function useAvailability(courtIds, date, operatingHours) {
  const idList = useMemo(
    () => (Array.isArray(courtIds) ? courtIds : courtIds ? [courtIds] : []).filter(Boolean),
    [courtIds],
  )
  const idKey = idList.join(',')

  const [perCourtOccupied, setPerCourtOccupied] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!idKey || !date) {
      setPerCourtOccupied([])
      setLoading(false)
      setError(null)
      return
    }
    setPerCourtOccupied([])
    fetchUnavailableHours()
  }, [idKey, date])

  async function fetchUnavailableHours() {
    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('get_court_occupancy', {
      p_date: date,
      p_court_ids: idList,
    })

    if (rpcError) {
      setError(rpcError.message)
      setPerCourtOccupied([])
      setLoading(false)
      return
    }

    const byCourt = new Map(idList.map(id => [id, []]))
    for (const row of data ?? []) {
      if (byCourt.has(row.court_id)) byCourt.get(row.court_id).push(row)
    }

    setPerCourtOccupied([...byCourt.values()].map(buildOccupiedSet))
    setLoading(false)
  }

  const pastHours = useMemo(() => getPastHoursForDate(date), [date])
  const blockedHours = useMemo(() => getBlockedHoursForDate(date, new Date(), operatingHours), [date, operatingHours])

  /** Hours where every court is taken — used for grid display only. */
  const unavailableHours = useMemo(
    () => getHoursFullyOccupied(perCourtOccupied),
    [perCourtOccupied],
  )

  const canStartAt = useCallback(
    (startHour, durationHours) => canStartOnAnyCourt(startHour, durationHours, perCourtOccupied, blockedHours, operatingHours),
    [perCourtOccupied, blockedHours, operatingHours],
  )

  return {
    perCourtOccupied,
    unavailableHours,
    canStartAt,
    pastHours,
    blockedHours,
    loading,
    error,
    refetch: fetchUnavailableHours,
  }
}
