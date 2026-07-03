import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  parseISO,
  isSameMonth,
  isFuture,
  getDaysInMonth,
} from 'date-fns'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { refreshBookingStatuses } from '../../lib/bookingMaintenance'
import { AdminDashboardSkeleton } from '../../components/admin/AdminSkeleton'
import AppEmoji from '../../components/ui/AppEmoji'
import AdminBookingCardDetails from '../../components/admin/AdminBookingCardDetails'
import BookingConfirmModal from '../../components/BookingConfirmModal'
import { Check, StatusMessage, X } from '../../components/ui/Icon'
import { parseBookingNotes } from '../../utils/parseBookingNotes'
import { getAdminBookingCategory } from '../../utils/bookingStatus'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Coins,
  CreditCard,
  Sparkles,
  Wallet,
} from 'lucide-react'

const SOFT_SPRING = { type: 'spring', stiffness: 240, damping: 28, mass: 0.7 }
const SOFT_EASE = { duration: 0.45, ease: [0.22, 1, 0.36, 1] }

function formatHour(h) {
  if (h === 0) return '12MN'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function TrendChip({ change, light }) {
  if (change === null || change === undefined) {
    return (
      <span className={`text-[11px] font-medium ${light ? 'text-white/60' : 'text-gray-400'}`}>
        No prior data
      </span>
    )
  }
  const up = change >= 0
  const tone = light
    ? up ? 'bg-white/15 text-brand-gold-100' : 'bg-white/15 text-rose-100'
    : up ? 'bg-brand-gold-50 dark:bg-brand-navy-900/30 text-brand-gold-700 dark:text-brand-gold-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tone}`}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(change)}%
    </span>
  )
}

function StatTile({ icon: Icon, label, value, sub, trend, accent }) {
  return (
    <motion.div
      className="admin-card-flat p-5 h-full"
      whileHover={{ y: -2 }}
      transition={SOFT_SPRING}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent.bg, color: accent.fg }}
        >
          <Icon size={17} strokeWidth={2.2} />
        </div>
        {trend !== undefined && <TrendChip change={trend} />}
      </div>
      <p className="admin-display text-[1.625rem] text-gray-900 dark:text-white leading-none tabular-nums">{value}</p>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [statData, setStatData] = useState([])
  const [pendingPayments, setPendingPayments] = useState([])
  const [unpaidHolds, setUnpaidHolds] = useState([])
  const [todaySchedule, setTodaySchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [rejectTarget, setRejectTarget] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function refreshStatsAndSchedule() {
    await refreshBookingStatuses()
    const today = format(new Date(), 'yyyy-MM-dd')
    const [statsRes, todayRes] = await Promise.all([
      supabase.from('bookings').select('status, total_price, date, duration_hours, courts(type)'),
      supabase
        .from('bookings')
        .select('*, profiles(full_name), courts(name)')
        .eq('date', today)
        .eq('status', 'confirmed')
        .order('start_hour'),
    ])
    if (statsRes.data) setStatData(statsRes.data)
    if (todayRes.data) setTodaySchedule(todayRes.data)
  }

  async function fetchData() {
    setLoading(true)
    await refreshBookingStatuses()
    const today = format(new Date(), 'yyyy-MM-dd')

    const [statsRes, pendingRes, todayRes] = await Promise.all([
      supabase.from('bookings').select('status, total_price, date, duration_hours, courts(type)'),
      supabase
        .from('bookings')
        .select('*, profiles(full_name, phone), courts(name, type), payment_methods(name, account_name)')
        .eq('status', 'processing')
        .order('date', { ascending: true }),
      supabase
        .from('bookings')
        .select('*, profiles(full_name), courts(name)')
        .eq('date', today)
        .eq('status', 'confirmed')
        .order('start_hour'),
    ])

    if (statsRes.data) setStatData(statsRes.data)
    if (pendingRes.data) {
      const processing = pendingRes.data ?? []
      setPendingPayments(processing.filter(b => getAdminBookingCategory(b) === 'paid_verify'))
      setUnpaidHolds(processing.filter(b => getAdminBookingCategory(b) === 'unpaid'))
    }
    if (todayRes.data) setTodaySchedule(todayRes.data)
    setLoading(false)
  }

  async function quickAction(id, status) {
    setUpdating(id)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(status === 'cancelled' ? 'Booking rejected' : 'Payment verified!')
      setPendingPayments(prev => prev.filter(b => b.id !== id))
      await refreshStatsAndSchedule()
    }
    setUpdating(null)
  }

  const kpis = useMemo(() => {
    const f = d => format(d, 'yyyy-MM-dd')
    const monthStart = f(startOfMonth(selectedMonth))
    const monthEnd = f(endOfMonth(selectedMonth))
    const prevMonthStart = f(startOfMonth(subMonths(selectedMonth, 1)))
    const prevMonthEnd = f(endOfMonth(subMonths(selectedMonth, 1)))

    const active = statData.filter(b => ['confirmed', 'completed'].includes(b.status))
    const totalRevenue = active.reduce((s, b) => s + Number(b.total_price), 0)
    const isKtvRow = b => b.courts?.type === 'ktv'

    const monthRows = active.filter(b => b.date >= monthStart && b.date <= monthEnd)
    const monthRevenue = monthRows.reduce((s, b) => s + Number(b.total_price), 0)
    const monthHours = monthRows.reduce((s, b) => s + (b.duration_hours ?? 0), 0)
    const monthCount = monthRows.length
    const monthCourtRevenue = monthRows.filter(b => !isKtvRow(b)).reduce((s, b) => s + Number(b.total_price), 0)
    const monthKtvRevenue = monthRows.filter(isKtvRow).reduce((s, b) => s + Number(b.total_price), 0)

    const prevRows = active.filter(b => b.date >= prevMonthStart && b.date <= prevMonthEnd)
    const prevRevenue = prevRows.reduce((s, b) => s + Number(b.total_price), 0)
    const prevCount = prevRows.length

    const revenueChange = prevRevenue > 0
      ? Math.round((monthRevenue - prevRevenue) / prevRevenue * 100)
      : null
    const countChange = prevCount > 0
      ? Math.round((monthCount - prevCount) / prevCount * 100)
      : null

    return {
      totalRevenue,
      monthRevenue,
      monthCourtRevenue,
      monthKtvRevenue,
      revenueChange,
      monthCount,
      countChange,
      monthHours,
    }
  }, [statData, selectedMonth])

  const chartData = useMemo(() => {
    const f = d => format(d, 'yyyy-MM-dd')
    const monthStart = f(startOfMonth(selectedMonth))
    const monthEnd = f(endOfMonth(selectedMonth))
    
    const daysInMonth = getDaysInMonth(selectedMonth)
    const data = []
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i), 'yyyy-MM-dd')
      data.push({
        date: dateStr,
        displayDate: format(parseISO(dateStr), 'MMM d'),
        revenue: 0,
        bookings: 0
      })
    }

    const monthRows = statData.filter(b => 
      ['confirmed', 'completed'].includes(b.status) && 
      b.date >= monthStart && 
      b.date <= monthEnd
    )

    monthRows.forEach(b => {
      const dayData = data.find(d => d.date === b.date)
      if (dayData) {
        dayData.revenue += Number(b.total_price)
        dayData.bookings += 1
      }
    })

    return data
  }, [statData, selectedMonth])

  const isCurrentMonth = isSameMonth(selectedMonth, new Date())
  const canGoForward = !isCurrentMonth

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:py-10 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-8">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SOFT_EASE}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="admin-kicker mb-2">Admin · Bookings Overview</p>
            <h1 className="admin-display text-[1.875rem] lg:text-[2.25rem] text-gray-900 dark:text-white leading-tight">
              Welcome back, <span className="gradient-text">Admin</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Month picker for KPIs */}
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
        </motion.header>

        {/* ── Hero stat card ─────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...SOFT_EASE, delay: 0.05 }}
          className="admin-hero p-7 lg:p-9"
        >
          <div className="admin-hero-content grid md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-brand-gold-200" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold-100">
                  {format(selectedMonth, 'MMMM yyyy')} · All Bookings
                </p>
              </div>
              <p className="admin-display text-[2.5rem] lg:text-[3.25rem] leading-none tabular-nums">
                ₱{kpis.monthRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <TrendChip change={kpis.revenueChange} light />
                <span className="text-[12px] text-brand-gold-50/80">
                  {kpis.monthCount} booking{kpis.monthCount !== 1 ? 's' : ''} ·{' '}
                  {kpis.monthHours}h total
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap text-[12px] text-brand-gold-50/80">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  🏓 Court: <span className="font-semibold text-white">₱{kpis.monthCourtRevenue.toLocaleString()}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  🎤 KTV: <span className="font-semibold text-white">₱{kpis.monthKtvRevenue.toLocaleString()}</span>
                </span>
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-100 mb-1">
                All-time revenue
              </p>
              <p className="admin-display text-2xl text-white tabular-nums">
                ₱{kpis.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── KPI tiles (bookings only) ──────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SOFT_EASE, delay: 0.12 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              icon={Coins}
              label="Revenue"
              value={`₱${kpis.monthRevenue.toLocaleString()}`}
              trend={kpis.revenueChange}
              accent={{ bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857' }}
            />
            <StatTile
              icon={ClipboardList}
              label="Bookings"
              value={kpis.monthCount}
              trend={kpis.countChange}
              accent={{ bg: 'rgba(59, 130, 246, 0.12)', fg: '#2563eb' }}
            />
            <StatTile
              icon={Clock}
              label="Booked hours"
              value={`${kpis.monthHours}h`}
              sub="Confirmed + completed"
              accent={{ bg: 'rgba(168, 85, 247, 0.12)', fg: '#9333ea' }}
            />
            <StatTile
              icon={CreditCard}
              label="Paid · verify"
              value={pendingPayments.length}
              sub={pendingPayments.length > 0 ? 'Check payment reference' : 'All caught up'}
              accent={
                pendingPayments.length > 0
                  ? { bg: 'rgba(245, 158, 11, 0.18)', fg: '#b45309' }
                  : { bg: 'rgba(148, 163, 184, 0.12)', fg: '#64748b' }
              }
            />
            <StatTile
              icon={Wallet}
              label="Unpaid holds"
              value={unpaidHolds.length}
              sub={unpaidHolds.length > 0 ? 'Waiting for payment' : 'None right now'}
              accent={
                unpaidHolds.length > 0
                  ? { bg: 'rgba(251, 146, 60, 0.16)', fg: '#c2410c' }
                  : { bg: 'rgba(148, 163, 184, 0.12)', fg: '#64748b' }
              }
            />
          </div>
        </motion.section>

        {/* ── Revenue Chart ─────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT_EASE, delay: 0.15 }}
          className="admin-card-flat p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="admin-kicker text-gray-500 dark:text-gray-400">Revenue Trend</p>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-1">Daily earnings for {format(selectedMonth, 'MMMM')}</h3>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  dy={10}
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  tickFormatter={(val) => `₱${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' 
                  }}
                  itemStyle={{ color: '#047857', fontWeight: 600 }}
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* ── Pending Payments ───────────────────────────── */}
        <AnimatePresence>
          {pendingPayments.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SOFT_EASE}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <p className="admin-kicker">Paid · awaiting verification</p>
                  <span className="text-[11px] font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">
                    {pendingPayments.length}
                  </span>
                </div>
              </div>

              <motion.div
                className="space-y-2.5"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {pendingPayments.map(b => {
                  const isBusy = updating === b.id
                  return (
                    <motion.div
                      key={b.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={SOFT_EASE}
                      className={`admin-card-flat p-5 transition-opacity !bg-gradient-to-br from-amber-50/90 to-white/85 dark:from-amber-900/20 dark:to-slate-800/80 !border-amber-300/50 dark:!border-amber-700/50 ${
                        isBusy ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                              <AppEmoji name={b.courts?.type === 'ktv' ? 'microphone' : 'court'} size={15} />
                              {b.courts?.name}
                            </span>
                            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                              Paid · verify
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400 tabular-nums mb-2">
                            {format(parseISO(b.date), 'MMM d')}
                          </p>
                          <AdminBookingCardDetails booking={b} />
                        </div>

                        <p className="admin-display text-brand-gold-700 text-xl flex-shrink-0 tabular-nums">
                          ₱{Number(b.total_price).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-amber-200/40 flex-wrap">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          onClick={() => quickAction(b.id, 'confirmed')}
                          className="text-[12px] bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 text-white px-4 py-2 rounded-lg hover:from-brand-gold-600 hover:to-brand-gold-700 font-semibold transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5"
                        >
                          <Check size={13} /> Verify &amp; confirm
                        </motion.button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(b)}
                          className="text-[12px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3.5 py-2 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {unpaidHolds.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SOFT_EASE}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <p className="admin-kicker">Unpaid holds</p>
                  <span className="text-[11px] font-bold text-white bg-orange-500 rounded-full px-2 py-0.5">
                    {unpaidHolds.length}
                  </span>
                </div>
              </div>

              <motion.div className="space-y-2.5">
                {unpaidHolds.map(b => (
                  <motion.div
                    key={b.id}
                    className="admin-card-flat p-5 !bg-gradient-to-br from-orange-50/90 to-white/88 dark:from-orange-900/20 dark:to-slate-800/80 !border-orange-400/45 dark:!border-orange-700/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                            <AppEmoji name={b.courts?.type === 'ktv' ? 'microphone' : 'court'} size={15} />
                            {b.courts?.name}
                          </span>
                          <span className="text-[11px] font-semibold text-orange-900 dark:text-orange-400 bg-orange-100/90 dark:bg-orange-900/20 border border-orange-200/80 dark:border-orange-900/40 px-2 py-0.5 rounded-full">
                            Unpaid hold
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 tabular-nums mb-2">
                          {format(parseISO(b.date), 'MMM d')}
                        </p>
                        <AdminBookingCardDetails booking={b} />
                      </div>
                      <p className="admin-display text-brand-gold-700 text-xl flex-shrink-0 tabular-nums">
                        ₱{Number(b.total_price).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Today's Schedule ────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT_EASE, delay: 0.2 }}
          className="pb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="admin-kicker">Today's Schedule</p>
            <p className="text-[11px] text-gray-400 font-medium">
              {format(new Date(), 'MMM d, yyyy')}
            </p>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="admin-card-flat p-10 text-center text-gray-400">
              <CalendarDays size={34} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No confirmed bookings today.</p>
              <p className="text-[11px] mt-1 text-gray-400">Enjoy the calm.</p>
            </div>
          ) : (
            <div className="admin-card-flat overflow-hidden">
              {todaySchedule.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SOFT_EASE, delay: 0.25 + i * 0.05 }}
                  className={`px-5 py-4 flex items-center gap-4 ${
                    i > 0 ? 'border-t border-brand-gold-200/50' : ''
                  } ${isFuture(parseISO(`${b.date}T${String(b.start_hour).padStart(2, '0')}:00:00`)) ? '' : 'opacity-60'}`}
                >
                  <div className="w-14 flex-shrink-0 text-center">
                    <p className="admin-display text-sm text-brand-gold-700">{formatHour(b.start_hour)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{b.duration_hours}h</p>
                  </div>
                  <div className="w-px h-9 bg-gradient-to-b from-brand-gold-200 to-transparent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-[13px]">{b.courts?.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {parseBookingNotes(b.notes).bookerName || b.profiles?.full_name || '—'}
                    </p>
                  </div>
                  <p className="admin-display text-brand-gold-700 flex-shrink-0 text-sm tabular-nums">
                    ₱{Number(b.total_price).toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

      <BookingConfirmModal
        open={Boolean(rejectTarget)}
        title="Reject this payment?"
        description={
          rejectTarget
            ? `This cancels the ${rejectTarget.courts?.name ?? 'court'} booking and frees the slot. Only reject if payment was not received.`
            : ''
        }
        confirmLabel="Yes, reject booking"
        cancelLabel="Keep booking"
        confirmTone="danger"
        onCancel={() => setRejectTarget(null)}
        onConfirm={async () => {
          if (!rejectTarget) return
          const id = rejectTarget.id
          setRejectTarget(null)
          await quickAction(id, 'cancelled')
        }}
      />
    </div>
  )
}
