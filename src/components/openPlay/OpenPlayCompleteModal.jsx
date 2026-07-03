import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Coins, Users, X } from 'lucide-react'
import { formatOpenPlayTimeRange } from '../../utils/openPlay'

export default function OpenPlayCompleteModal({ post, onClose, onSubmit, submitting, error }) {
  const [attendance, setAttendance] = useState('')
  const [revenue, setRevenue] = useState('')

  useEffect(() => {
    if (post) {
      setAttendance(post.attendance != null ? String(post.attendance) : '')
      setRevenue(post.revenue != null ? String(post.revenue) : '')
    }
  }, [post])

  if (!post) return null

  function handleSubmit(e) {
    e.preventDefault()
    const attendanceNum = parseInt(attendance, 10)
    const revenueNum = parseFloat(revenue)
    if (isNaN(attendanceNum) || attendanceNum < 0) return
    if (isNaN(revenueNum) || revenueNum < 0) return
    onSubmit({ attendance: attendanceNum, revenue: revenueNum })
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(10,18,36,0.5)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-gold-700 mb-1">
              Wrap up session
            </p>
            <h2 className="font-bold text-gray-900 dark:text-white leading-snug">
              {post.title || 'Open Play Session'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {post.courts?.name} · {format(parseISO(post.date), 'EEE, MMM d')}
              {' · '}
              {formatOpenPlayTimeRange(post.start_hour, post.end_hour)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:bg-slate-800 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Mark this open play as complete and log how it did — attendance and money earned.
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              <Users size={12} />
              Attendance (headcount)
            </label>
            <input
              type="number"
              min={0}
              value={attendance}
              onChange={e => setAttendance(e.target.value)}
              required
              placeholder="e.g. 12"
              className="input-field"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              <Coins size={12} />
              Money earned (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₱</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                required
                placeholder="0.00"
                className="input-field pl-8"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Total collected for this open play session.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:bg-slate-800/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Mark complete'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
