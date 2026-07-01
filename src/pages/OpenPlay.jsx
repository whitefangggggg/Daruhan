import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { UsersRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useOpenPlayRsvps } from '../hooks/useOpenPlayRsvps'
import OpenPlayPostCard from '../components/openPlay/OpenPlayPostCard'
import AnimateIn from '../components/AnimateIn'
import { SITE } from '../config/site'
import { getOpenPlayDisplayStatus, sortOpenPlayPosts } from '../utils/openPlay'

export default function OpenPlay() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [rsvpBusy, setRsvpBusy] = useState(null)
  const [rsvpError, setRsvpError] = useState(null)

  const { hasRsvped, markRsvped, unmarkRsvped } = useOpenPlayRsvps(user?.id)

  useEffect(() => {
    supabase
      .from('open_play_posts')
      .select('*, courts(name)')
      .order('date', { ascending: true })
      .then(({ data }) => {
        setPosts(sortOpenPlayPosts(data ?? []))
        setLoading(false)
      })
  }, [])

  const sortedPosts = useMemo(() => sortOpenPlayPosts(posts), [posts])

  const filteredPosts = useMemo(() => {
    if (filter === 'mine') {
      return sortedPosts.filter(p => hasRsvped(p.id))
    }
    if (filter === 'ended') {
      return sortedPosts.filter(p => {
        const s = getOpenPlayDisplayStatus(p)
        return s === 'ended' || s === 'completed'
      })
    }
    if (filter === 'all') return sortedPosts
    return sortedPosts.filter(p => getOpenPlayDisplayStatus(p) === filter)
  }, [sortedPosts, filter, hasRsvped])

  const counts = useMemo(() => ({
    all: posts.filter(p => p.status !== 'cancelled').length,
    upcoming: posts.filter(p => getOpenPlayDisplayStatus(p) === 'upcoming').length,
    ended: posts.filter(p => {
      const s = getOpenPlayDisplayStatus(p)
      return s === 'ended' || s === 'completed'
    }).length,
    mine: posts.filter(p => hasRsvped(p.id)).length,
  }), [posts, hasRsvped])

  async function handleMarkRsvped(postId) {
    setRsvpBusy(postId)
    setRsvpError(null)
    const { error } = await markRsvped(postId)
    if (error) setRsvpError(error.message || 'Could not save RSVP.')
    setRsvpBusy(null)
  }

  async function handleUnmarkRsvped(postId) {
    setRsvpBusy(postId)
    setRsvpError(null)
    const { error } = await unmarkRsvped(postId)
    if (error) setRsvpError(error.message || 'Could not remove RSVP.')
    setRsvpBusy(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <AnimateIn>
        <div>
          <p className="text-xs font-bold text-brand-gold-600/80 uppercase tracking-widest mb-1">Community</p>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Open Play</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {SITE.copy.openPlayIntro}{' '}
            <span className="font-semibold text-brand-gold-700">&quot;I&apos;ve RSVPed&quot;</span>{' '}
            to pin it on your home feed.
          </p>
        </div>
      </AnimateIn>

      {rsvpError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {rsvpError}
        </p>
      )}

      <AnimateIn delay={60}>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { id: 'mine', label: 'My RSVPs', count: counts.mine },
            { id: 'ended', label: 'Past', count: counts.ended },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f.id
                  ? 'bg-brand-gold-500 text-brand-navy-950 border-brand-gold-500'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-brand-gold-200 dark:border-slate-700 hover:border-brand-gold-300'
              }`}
            >
              {f.label}
              <span className={filter === f.id ? 'opacity-80' : 'opacity-50'}>{f.count}</span>
            </button>
          ))}
        </div>
      </AnimateIn>

      {loading ? (
        <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 p-10 flex items-center justify-center gap-3 shadow-sm">
          <div className="w-5 h-5 border-2 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading sessions…</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-gradient-to-b from-white to-brand-gold-50/40 dark:from-slate-800 dark:to-slate-800/80 p-10 text-center shadow-sm">
          <UsersRound size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {filter === 'mine' ? 'No RSVPs saved yet' : 'No open play posted yet'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === 'mine'
              ? 'After you RSVP on Reclub, tap "I\'ve RSVPed" on a session to track it here and on Home.'
              : 'Check back soon — new sessions drop weekly.'}
          </p>
          {filter === 'mine' && counts.upcoming > 0 && (
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className="mt-4 text-sm font-semibold text-brand-gold-600 hover:underline"
            >
              Browse upcoming sessions →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post, i) => (
            <AnimateIn key={post.id} delay={80 + i * 50}>
              <OpenPlayPostCard
                post={post}
                variant="user"
                hasRsvped={hasRsvped(post.id)}
                rsvpBusy={rsvpBusy === post.id}
                onMarkRsvped={() => handleMarkRsvped(post.id)}
                onUnmarkRsvped={() => handleUnmarkRsvped(post.id)}
              />
            </AnimateIn>
          ))}
        </div>
      )}

      <AnimateIn delay={120}>
        <p className="text-center text-xs text-gray-400">
          Questions about open play?{' '}
          <Link to="/home" className="text-brand-gold-600 font-semibold hover:underline">
            Back to home
          </Link>
        </p>
      </AnimateIn>
    </div>
  )
}
