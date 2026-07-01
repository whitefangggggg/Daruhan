import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

const NOTIFICATION_LIMIT = 30

export function useNotifications(userId, { limit = NOTIFICATION_LIMIT } = {}) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read_at).length,
    [notifications],
  )

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, booking_id, type, title, body, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error) setNotifications(data ?? [])
    setLoading(false)
  }, [userId, limit])

  // Initial fetch + refetch whenever userId changes.
  useEffect(() => {
    setLoading(Boolean(userId))
    fetchNotifications()
  }, [userId, fetchNotifications])

  // Refetch when the user returns to the tab — catches confirmations that
  // happened while the tab was backgrounded, no realtime setup required.
  useEffect(() => {
    if (!userId) return undefined

    function handleFocus() {
      fetchNotifications()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [userId, fetchNotifications])

  const markAsRead = useCallback(async (notificationId) => {
    if (!userId) return

    const readAt = new Date().toISOString()
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read_at: readAt } : n)),
    )

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) fetchNotifications()
  }, [userId, fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return

    const readAt = new Date().toISOString()
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? readAt })))

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) fetchNotifications()
  }, [userId, unreadCount, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
