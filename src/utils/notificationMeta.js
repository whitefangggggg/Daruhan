import { CheckCircle2, XCircle, Clock, Coins } from 'lucide-react'

export const NOTIFICATION_META = {
  booking_confirmed: {
    icon: CheckCircle2,
    tone: 'green',
    accent: 'border-brand-gold-200 dark:border-brand-gold-900/40 bg-brand-gold-50 dark:bg-brand-navy-900/30 text-brand-gold-600 dark:text-brand-gold-400',
    dot: 'bg-brand-gold-500',
  },
  booking_cancelled: {
    icon: XCircle,
    tone: 'red',
    accent: 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
    dot: 'bg-red-500',
  },
  booking_completed: {
    icon: Clock,
    tone: 'gray',
    accent: 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
  payment_submitted: {
    icon: Coins,
    tone: 'amber',
    accent: 'border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
}

export function formatNotificationTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
