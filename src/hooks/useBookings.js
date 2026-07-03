import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useBookings(userId) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    fetchBookings()
  }, [userId])

  async function fetchBookings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, courts(name, type), payment_methods(name, account_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setBookings(data)
    setLoading(false)
  }

  async function cancelBooking(bookingId) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (error) return { error: error.message }
    await fetchBookings()
    return { error: null }
  }

  return { bookings, loading, error, refetch: fetchBookings, cancelBooking }
}
