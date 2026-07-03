import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isSameMonth,
} from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import OpenPlayPostCard from '../../components/openPlay/OpenPlayPostCard'
import OpenPlayScheduleForm from '../../components/openPlay/OpenPlayScheduleForm'
import OpenPlayCompleteModal from '../../components/openPlay/OpenPlayCompleteModal'
import {
  getOpenPlayDisplayStatus,
  sortOpenPlayPosts,
  isValidOpenPlayTimeRange,
  formatOpenPlayTimeRange,
  getOpenPlayDurationHours,
} from '../../utils/openPlay'
import { getCourtOpenPlayConflicts } from '../../utils/openPlaySchedule'
import { getPastHoursForDate } from '../../utils/bookingHours'
import {
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  ClipboardList,
  Pencil,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react'

const SOFT_EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
const SOFT_SPRING = { type: 'spring', stiffness: 240, damping: 28, mass: 0.7 }

function StatTile({ icon: Icon, label, value, sub, accent }) {
  return (
    <motion.div
      className="admin-card-flat p-5 h-full"
      whileHover={{ y: -2 }}
      transition={SOFT_SPRING}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
        style={{ background: accent.bg, color: accent.fg }}
      >
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <p className="admin-display text-[1.625rem] text-gray-900 dark:text-white leading-none tabular-nums">{value}</p>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>}
    </motion.div>
  )
}

const EMPTY_FORM = {
  court_id: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  start_hour: 8,
  end_hour: 10,
  rsvp_deadline: '',
  skill_level: 'All Levels',
  title: '',
  body: '',
  rsvp_link: '',
  attendance: '',
}

function toDatetimeLocal(isoOrEmpty) {
  if (!isoOrEmpty) return ''
  const d = new Date(isoOrEmpty)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(str) {
  if (!str) return null
  return new Date(str).toISOString()
}

export default function ManageOpenPlay() {
  const { user } = useAuth()
  const [courts, setCourts] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [completePost, setCompletePost] = useState(null)
  const [completeSubmitting, setCompleteSubmitting] = useState(false)
  const [completeError, setCompleteError] = useState(null)

  const fetchPosts = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from('open_play_posts')
      .select('*, courts(name)')
      .order('date', { ascending: false })

    if (fetchErr) toast.error(fetchErr.message)
    else setPosts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    Promise.all([
      supabase.from('courts').select('id, name').eq('is_active', true).eq('type', 'court').order('name'),
      fetchPosts(),
    ]).then(([courtsRes]) => {
      if (courtsRes.data) setCourts(courtsRes.data)
    })
  }, [fetchPosts])

  const sortedPosts = useMemo(() => sortOpenPlayPosts(posts), [posts])

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return sortedPosts
    return sortedPosts.filter(p => getOpenPlayDisplayStatus(p) === filter)
  }, [sortedPosts, filter])

  const counts = useMemo(() => ({
    all: posts.filter(p => p.status !== 'cancelled').length,
    upcoming: posts.filter(p => getOpenPlayDisplayStatus(p) === 'upcoming').length,
    ended: posts.filter(p => getOpenPlayDisplayStatus(p) === 'ended').length,
    completed: posts.filter(p => getOpenPlayDisplayStatus(p) === 'completed').length,
  }), [posts])

  const monthKpis = useMemo(() => {
    const f = d => format(d, 'yyyy-MM-dd')
    const monthStart = f(startOfMonth(selectedMonth))
    const monthEnd = f(endOfMonth(selectedMonth))
    const monthPosts = posts.filter(p => {
      const s = getOpenPlayDisplayStatus(p)
      return s !== 'cancelled' && p.date >= monthStart && p.date <= monthEnd
    })

    const sessionCount = monthPosts.length
    const courtHours = monthPosts.reduce((s, p) => s + getOpenPlayDurationHours(p), 0)
    const upcomingCount = monthPosts.filter(p => getOpenPlayDisplayStatus(p) === 'upcoming').length
    const endedCount = monthPosts.filter(p => getOpenPlayDisplayStatus(p) === 'ended').length
    const completedCount = monthPosts.filter(p => getOpenPlayDisplayStatus(p) === 'completed').length
    const totalAttendance = monthPosts.reduce((s, p) => s + (p.attendance ?? 0), 0)
    const loggedSessions = monthPosts.filter(p => p.attendance != null).length
    const totalRevenue = monthPosts
      .filter(p => getOpenPlayDisplayStatus(p) === 'completed')
      .reduce((s, p) => s + Number(p.revenue ?? 0), 0)

    const byCourt = {}
    monthPosts.forEach(p => {
      const name = p.courts?.name ?? 'Unknown'
      byCourt[name] = (byCourt[name] ?? 0) + getOpenPlayDurationHours(p)
    })
    const courtBreakdown = Object.entries(byCourt).sort((a, b) => b[1] - a[1])
    const nextUpcoming = sortedPosts.find(p => getOpenPlayDisplayStatus(p) === 'upcoming') ?? null

    return {
      sessionCount,
      courtHours,
      upcomingCount,
      endedCount,
      completedCount,
      totalAttendance,
      loggedSessions,
      totalRevenue,
      courtBreakdown,
      nextUpcoming,
    }
  }, [posts, selectedMonth, sortedPosts])

  const isCurrentMonth = isSameMonth(selectedMonth, new Date())
  const canGoForward = !isCurrentMonth

  function openCreate() {
    setEditingPost(null)
    setForm({
      ...EMPTY_FORM,
      court_id: '',
      rsvp_deadline: toDatetimeLocal(new Date(Date.now() + 86400000).toISOString()),
    })
    setFormOpen(true)
  }

  function openEdit(post) {
    if (getOpenPlayDisplayStatus(post) !== 'upcoming') return
    setEditingPost(post)
    setForm({
      court_id: post.court_id,
      date: post.date,
      start_hour: post.start_hour,
      end_hour: post.end_hour,
      rsvp_deadline: toDatetimeLocal(post.rsvp_deadline),
      skill_level: post.skill_level ?? 'All Levels',
      title: post.title ?? '',
      body: post.body ?? '',
      rsvp_link: post.rsvp_link,
      attendance: post.attendance ?? '',
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingPost(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.court_id || !form.rsvp_link.trim()) {
      toast.error('Pick an available court and add an RSVP link.')
      return
    }
    if (!isValidOpenPlayTimeRange(form.start_hour, form.end_hour)) {
      toast.error('Invalid time range — session must fit on the same day.')
      return
    }
    const deadline = fromDatetimeLocal(form.rsvp_deadline)
    if (!deadline) {
      toast.error('Set an RSVP deadline.')
      return
    }

    setSubmitting(true)
    try {
      const { data: dayBookings, error: bookingsErr } = await supabase
        .from('bookings')
        .select('court_id, start_hour, duration_hours, status')
        .eq('date', form.date)
        .in('status', ['confirmed', 'processing'])

      if (bookingsErr) throw new Error(bookingsErr.message)

      const { data: dayBlocks, error: blocksErr } = await supabase
        .from('blocked_slots')
        .select('id, court_id, start_hour, duration_hours, reason')
        .eq('date', form.date)

      if (blocksErr) throw new Error(blocksErr.message)

      const conflicts = getCourtOpenPlayConflicts({
        courtId: form.court_id,
        startHour: form.start_hour,
        endHour: form.end_hour,
        bookings: dayBookings ?? [],
        blockedSlots: dayBlocks ?? [],
        excludeBlockedSlotId: editingPost?.blocked_slot_id ?? null,
        pastHours: getPastHoursForDate(form.date),
      })

      if (conflicts.length > 0) {
        toast.error(`${conflicts[0].summary}. Pick another court or time.`)
        setSubmitting(false)
        return
      }

      const payload = {
        court_id: form.court_id,
        date: form.date,
        start_hour: form.start_hour,
        end_hour: form.end_hour,
        rsvp_deadline: deadline,
        skill_level: form.skill_level || null,
        title: form.title.trim() || null,
        body: form.body.trim() || null,
        rsvp_link: form.rsvp_link.trim(),
        published_at: new Date().toISOString(),
      }

      if (editingPost) {
        const { error: updErr } = await supabase
          .from('open_play_posts')
          .update(payload)
          .eq('id', editingPost.id)
        if (updErr) throw new Error(updErr.message)
        toast.success('Open play post updated.')
      } else {
        const { error: insErr } = await supabase
          .from('open_play_posts')
          .insert({ ...payload, created_by: user.id })
        if (insErr) throw new Error(insErr.message)
        toast.success('Open play post published.')
      }

      closeForm()
      await fetchPosts()
    } catch (err) {
      const msg = err.message || 'Could not save post.'
      if (msg.includes('BOOKING_CONFLICT')) {
        toast.error('That court already has a booking in this time window. Pick another time or court.')
      } else {
        toast.error(msg)
      }
    }
    setSubmitting(false)
  }

  async function cancelPost(id) {
    if (!window.confirm('Cancel this open play post? The court block will be removed.')) return
    const { error: cancelErr } = await supabase
      .from('open_play_posts')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (cancelErr) toast.error(cancelErr.message)
    else await fetchPosts()
  }

  async function markComplete(id, { attendance, revenue }) {
    setCompleteSubmitting(true)
    setCompleteError(null)
    const { error: updErr } = await supabase
      .from('open_play_posts')
      .update({
        status: 'completed',
        attendance,
        revenue,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updErr) {
      setCompleteError(updErr.message)
      setCompleteSubmitting(false)
      return
    }

    setCompletePost(null)
    setCompleteSubmitting(false)
    toast.success('Session marked complete.')
    await fetchPosts()
  }

  function openComplete(post) {
    setCompleteError(null)
    setCompletePost(post)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-gold-200 dark:border-brand-navy-700/40 border-t-brand-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 lg:py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SOFT_EASE}
        className="flex items-end justify-between gap-4 flex-wrap mb-6"
      >
        <div>
          <p className="admin-kicker mb-2">Admin · Open Play</p>
          <h1 className="admin-display text-[1.875rem] lg:text-[2.25rem] text-gray-900 dark:text-white leading-tight">
            Sessions & <span className="gradient-text">Stats</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            Community sessions are tracked separately from paid court bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={courts.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-600 hover:to-brand-gold-700 shadow-sm disabled:opacity-50"
        >
          <CalendarPlus size={16} />
          Create post
        </button>
      </motion.header>

      {/* ── Open Play statistics ─────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SOFT_EASE, delay: 0.05 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="admin-kicker">Statistics</p>
          <div className="flex items-center gap-2 admin-card-flat p-1.5">
            <button
              type="button"
              onClick={() => setSelectedMonth(m => subMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-brand-gold-50/80 text-gray-500 dark:text-gray-400 hover:text-brand-gold-700 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="min-w-[120px] text-center text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
              {format(selectedMonth, 'MMM yyyy')}
            </p>
            <button
              type="button"
              onClick={() => setSelectedMonth(m => addMonths(m, 1))}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg hover:bg-brand-gold-50/80 text-gray-500 dark:text-gray-400 hover:text-brand-gold-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth(new Date())}
                className="ml-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-brand-gold-500 text-white hover:bg-brand-gold-600 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl p-6 lg:p-7 mb-4 text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 40%, #0d9488 100%)',
            boxShadow: '0 16px 40px -16px rgba(5, 150, 105, 0.55)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-brand-gold-200" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold-100">
              {format(selectedMonth, 'MMMM yyyy')} · Open Play
            </p>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <p className="admin-display text-[2.25rem] lg:text-[2.75rem] leading-none tabular-nums">
                {monthKpis.sessionCount} session{monthKpis.sessionCount !== 1 ? 's' : ''}
              </p>
              <p className="text-[13px] text-brand-gold-50/90 mt-3 font-medium">
                {monthKpis.courtHours}h court time · {monthKpis.upcomingCount} upcoming ·{' '}
                {monthKpis.completedCount} completed
                {monthKpis.totalRevenue > 0 && (
                  <> · ₱{monthKpis.totalRevenue.toLocaleString()} earned</>
                )}
              </p>
            </div>
            {monthKpis.nextUpcoming ? (
              <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 sm:max-w-[240px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-100 mb-1">Next up</p>
                <p className="text-sm font-semibold leading-snug">
                  {monthKpis.nextUpcoming.title || 'Open Play Session'}
                </p>
                <p className="text-[11px] text-brand-gold-100/85 mt-1">
                  {monthKpis.nextUpcoming.courts?.name} · {format(parseISO(monthKpis.nextUpcoming.date), 'MMM d')}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 sm:max-w-[240px]">
                <p className="text-[11px] text-brand-gold-100/90 leading-relaxed">
                  No upcoming sessions right now. Post one to fill the calendar.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatTile
            icon={Coins}
            label="Revenue"
            value={`₱${monthKpis.totalRevenue.toLocaleString()}`}
            sub={`${monthKpis.completedCount} completed in ${format(selectedMonth, 'MMMM')}`}
            accent={{ bg: 'rgba(245, 158, 11, 0.15)', fg: '#b45309' }}
          />
          <StatTile
            icon={UsersRound}
            label="Sessions posted"
            value={monthKpis.sessionCount}
            sub={`In ${format(selectedMonth, 'MMMM')}`}
            accent={{ bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857' }}
          />
          <StatTile
            icon={Clock}
            label="Open play hours"
            value={`${monthKpis.courtHours}h`}
            sub="Court time blocked"
            accent={{ bg: 'rgba(20, 184, 166, 0.12)', fg: '#0d9488' }}
          />
          <StatTile
            icon={ClipboardList}
            label="Attendance"
            value={monthKpis.totalAttendance}
            sub={
              monthKpis.loggedSessions > 0
                ? `${monthKpis.loggedSessions} session${monthKpis.loggedSessions !== 1 ? 's' : ''} logged`
                : 'Log when you mark complete'
            }
            accent={{ bg: 'rgba(168, 85, 247, 0.12)', fg: '#9333ea' }}
          />
        </div>

        <div className="admin-card-flat p-4">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Hours by court · {format(selectedMonth, 'MMMM')}
          </p>
          {monthKpis.courtBreakdown.length === 0 ? (
            <div className="py-6 text-center">
              <UsersRound size={28} strokeWidth={1.5} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No open play in this month yet</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-3 text-sm font-semibold text-brand-gold-700 hover:underline"
              >
                Create a session →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {monthKpis.courtBreakdown.map(([name, hours]) => {
                const maxHours = monthKpis.courtBreakdown[0][1] || 1
                const width = Math.max(8, Math.round((hours / maxHours) * 100))
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{name}</span>
                      <span className="text-gray-500 dark:text-gray-400 tabular-nums">{hours}h</span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-gold-50 dark:bg-brand-navy-900/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-gold-400 to-brand-gold-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.section>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="admin-kicker">All posts</p>
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
          { id: 'ended', label: 'Needs wrap-up', count: counts.ended },
          { id: 'completed', label: 'Completed', count: counts.completed },
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`admin-chip ${filter === f.id ? 'admin-chip-active' : ''}`}
          >
            {f.label}
            <span className="opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="admin-card-flat p-12 text-center text-gray-400">
          <Users size={36} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {posts.length === 0
              ? 'No open play posts yet'
              : `No ${filter === 'all' ? '' : filter} posts to show`}
          </p>
          {posts.length === 0 && (
            <button type="button" onClick={openCreate} className="mt-4 text-sm font-semibold text-brand-gold-700 hover:underline">
              Create your first post →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => {
            const displayStatus = getOpenPlayDisplayStatus(post)
            const canEdit = displayStatus === 'upcoming'
            return (
              <motion.div key={post.id} layout transition={SOFT_EASE} className="space-y-2">
                <OpenPlayPostCard post={post} variant="admin" />
                <div className="flex flex-wrap items-center gap-2 px-1">
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(post)}
                        className="text-[12px] font-semibold text-brand-gold-700 bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-navy-700/40 px-3 py-1.5 rounded-lg hover:bg-brand-gold-100 inline-flex items-center gap-1"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelPost(post.id)}
                        className="text-[12px] font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg"
                      >
                        Cancel post
                      </button>
                    </>
                  )}
                  {displayStatus === 'ended' && (
                    <button
                      type="button"
                      onClick={() => openComplete(post)}
                      className="text-[12px] font-semibold text-white bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400 px-3 py-1.5 rounded-lg hover:from-amber-600 hover:to-amber-700 inline-flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 size={12} /> Mark complete
                    </button>
                  )}
                  {displayStatus === 'completed' && (
                    <button
                      type="button"
                      onClick={() => openComplete(post)}
                      className="text-[12px] font-semibold text-brand-gold-700 bg-brand-gold-50 dark:bg-brand-navy-900/30 border border-brand-gold-200 dark:border-brand-navy-700/40 px-3 py-1.5 rounded-lg hover:bg-brand-gold-100 inline-flex items-center gap-1"
                    >
                      <Coins size={12} /> Edit totals
                    </button>
                  )}
                  <span className="text-[10px] text-gray-400 tabular-nums">
                    RSVP by {format(parseISO(post.rsvp_deadline), 'MMM d, h:mm a')}
                    {' · '}
                    {formatOpenPlayTimeRange(post.start_hour, post.end_hour)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {completePost && (
          <OpenPlayCompleteModal
            post={completePost}
            onClose={() => { setCompletePost(null); setCompleteError(null) }}
            onSubmit={data => markComplete(completePost.id, data)}
            submitting={completeSubmitting}
            error={completeError}
          />
        )}
        {formOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(10,18,36,0.5)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeForm}
          >
            <motion.div
              className="w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto admin-scroll bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <OpenPlayScheduleForm
                form={form}
                setForm={setForm}
                courts={courts}
                editingPost={editingPost}
                submitting={submitting}
                onSubmit={handleSubmit}
                onClose={closeForm}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
