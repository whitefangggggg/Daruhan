import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useOpenPlayRsvps(userId) {
  const [rsvpPostIds, setRsvpPostIds] = useState(() => new Set())
  const [loading, setLoading] = useState(Boolean(userId))

  const fetchRsvps = useCallback(async () => {
    if (!userId) {
      setRsvpPostIds(new Set())
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('open_play_rsvps')
      .select('post_id')
      .eq('user_id', userId)

    if (!error) setRsvpPostIds(new Set((data ?? []).map(r => r.post_id)))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(Boolean(userId))
    fetchRsvps()
  }, [userId, fetchRsvps])

  const markRsvped = useCallback(async (postId) => {
    if (!userId) return { error: new Error('Not signed in') }

    const { error } = await supabase
      .from('open_play_rsvps')
      .insert({ user_id: userId, post_id: postId })

    if (!error) {
      setRsvpPostIds(prev => new Set([...prev, postId]))
    }
    return { error }
  }, [userId])

  const unmarkRsvped = useCallback(async (postId) => {
    if (!userId) return { error: new Error('Not signed in') }

    const { error } = await supabase
      .from('open_play_rsvps')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    if (!error) {
      setRsvpPostIds(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
    return { error }
  }, [userId])

  const hasRsvped = useCallback(
    postId => rsvpPostIds.has(postId),
    [rsvpPostIds],
  )

  return {
    rsvpPostIds,
    hasRsvped,
    markRsvped,
    unmarkRsvped,
    loading,
    refetch: fetchRsvps,
  }
}
