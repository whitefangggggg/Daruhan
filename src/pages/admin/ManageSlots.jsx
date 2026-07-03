import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { Ban, CheckCircle2, Trash2 } from 'lucide-react'

const SOFT_EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

function formatHour(h) {
  if (h === 0) return '12:00 MN'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export default function ManageSlots() {
  const [courts, setCourts] = useState([])
  const [blockedSlots, setBlockedSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    court_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_hour: 8,
    duration_hours: 1,
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('courts').select('*').eq('is_active', true).eq('type', 'court'),
      supabase.from('blocked_slots').select('*, courts(name)').order('date', { ascending: false }),
    ]).then(([courtsRes, slotsRes]) => {
      if (courtsRes.data) setCourts(courtsRes.data)
      if (slotsRes.data) setBlockedSlots(slotsRes.data)
      setLoading(false)
    })
  }, [])

  async function handleBlock(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error: blockError } = await supabase.from('blocked_slots').insert(form)
    if (blockError) {
      toast.error(blockError.message)
    } else {
      toast.success('Slot blocked successfully.')
      const { data } = await supabase
        .from('blocked_slots')
        .select('*, courts(name)')
        .order('date', { ascending: false })
      if (data) setBlockedSlots(data)
      setForm(f => ({ ...f, reason: '' }))
    }
    setSubmitting(false)
  }

  async function removeBlock(id) {
    await supabase.from('blocked_slots').delete().eq('id', id)
    setBlockedSlots(prev => prev.filter(s => s.id !== id))
    toast.success('Block removed')
  }

  const setField = (key) => (e) =>
    setForm(f => ({
      ...f,
      [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
    }))

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-gold-200 dark:border-brand-navy-700/40 border-t-brand-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 lg:py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">

        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SOFT_EASE}
          className="mb-8"
        >
          <p className="admin-kicker mb-2">Admin · Court Maintenance</p>
          <h1 className="admin-display text-[1.875rem] lg:text-[2.25rem] text-gray-900 dark:text-white leading-tight">
            Block <span className="gradient-text">Hours</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            Reserve court hours for maintenance, private events, or closures.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT_EASE, delay: 0.05 }}
          className="admin-card p-6 mb-8"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <Ban size={15} className="text-rose-500 dark:text-rose-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Block a slot</h2>
          </div>

          <form onSubmit={handleBlock} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Court
                </label>
                <select value={form.court_id} onChange={setField('court_id')} required className="input-field">
                  <option value="">Select court</option>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={setField('date')}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Start hour
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.start_hour}
                  onChange={setField('start_hour')}
                  required
                  className="input-field"
                />
                <p className="text-[11px] text-gray-400 mt-1 font-medium">{formatHour(form.start_hour)}</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Duration (hrs)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={form.duration_hours}
                  onChange={setField('duration_hours')}
                  required
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Reason (optional)
              </label>
              <input
                type="text"
                value={form.reason}
                onChange={setField('reason')}
                placeholder="e.g. Court maintenance"
                className="input-field"
              />
            </div>
            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
            >
              {submitting ? 'Blocking…' : <><Ban size={15} /> Block slot</>}
            </motion.button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT_EASE, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="admin-kicker">Active Blocks</p>
            <span className="text-[11px] text-gray-400 font-medium tabular-nums">
              {blockedSlots.length} block{blockedSlots.length !== 1 ? 's' : ''}
            </span>
          </div>

          {blockedSlots.length === 0 ? (
            <div className="admin-card-flat p-10 text-center text-gray-400">
              <CheckCircle2 size={34} strokeWidth={1.5} className="mx-auto mb-3 text-brand-gold-500 opacity-60" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No blocked slots</p>
              <p className="text-[11px] mt-1 text-gray-400">All court hours are open.</p>
            </div>
          ) : (
            <motion.div
              className="space-y-2.5"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            >
              <AnimatePresence>
                {blockedSlots.map(s => (
                  <motion.div
                    key={s.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={SOFT_EASE}
                    className="admin-card-flat p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0">
                        <Ban size={16} className="text-rose-500 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-[13px]">{s.courts?.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {format(parseISO(s.date), 'MMM d, yyyy')} ·{' '}
                          {formatHour(s.start_hour)} – {formatHour((s.start_hour + s.duration_hours) % 24)}
                          {s.reason && <span className="text-gray-400"> · {s.reason}</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBlock(s.id)}
                      className="text-[12px] text-rose-500 hover:text-white hover:bg-rose-500 px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex-shrink-0 inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
    </div>
  )
}
