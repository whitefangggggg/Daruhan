import { supabase } from './supabaseClient'

/**
 * Runs DB maintenance: past confirmed → completed, stale unpaid holds → cancelled.
 * Requires migration 025 (admin-only RPC). Silently no-ops if not deployed yet.
 */
export async function refreshBookingStatuses() {
  const { error } = await supabase.rpc('refresh_booking_statuses')
  if (error && error.code !== 'PGRST202') {
    console.warn('[refreshBookingStatuses]', error.message)
  }
}
