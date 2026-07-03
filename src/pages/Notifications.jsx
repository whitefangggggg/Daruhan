import { Link } from 'react-router-dom'
import { Bell, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { NOTIFICATION_META, formatNotificationTime } from '../utils/notificationMeta'
import AnimateIn from '../components/AnimateIn'

function ReadPill({ isUnread }) {
  if (isUnread) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-full px-1.5 py-0.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Unread
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 flex-shrink-0">
      Read
    </span>
  )
}

export default function Notifications() {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user?.id, { limit: 100 })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-xs font-bold text-brand-gold-600/80 dark:text-brand-gold-400/80 uppercase tracking-widest mb-1">Inbox</p>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-sm font-semibold text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-300 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
      </AnimateIn>

      {loading ? (
        <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-12 flex items-center justify-center gap-3 shadow-sm">
          <div className="w-5 h-5 border-2 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading notifications…</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-brand-gold-200 dark:border-slate-700 bg-gradient-to-b from-white to-brand-gold-50/40 dark:from-slate-800 dark:to-slate-800/80 p-12 text-center shadow-sm">
          <Bell size={36} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" strokeWidth={1.5} />
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">No notifications yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            We&apos;ll notify you when bookings are confirmed, cancelled, or updated.
          </p>
          <Link to="/book" className="btn-primary text-sm inline-block">
            Book now
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {notifications.map((notification, i) => {
            const meta = NOTIFICATION_META[notification.type] ?? NOTIFICATION_META.booking_confirmed
            const Icon = meta.icon
            const isUnread = !notification.read_at

            return (
              <AnimateIn key={notification.id} delay={i * 40}>
                <li
                  className={`rounded-2xl border px-4 py-4 flex gap-3 shadow-sm ${
                    isUnread
                      ? 'border-brand-gold-200 dark:border-brand-navy-700 bg-brand-gold-50/50 dark:bg-brand-navy-900/30'
                      : 'border-brand-gold-100/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90'
                  }`}
                >
                  <span className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${meta.accent}`}>
                    <Icon size={18} strokeWidth={2.25} />
                  </span>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                        {notification.title}
                      </p>
                      <ReadPill isUnread={isUnread} />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {notification.body}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                      <div className="flex items-center gap-3">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs font-semibold text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-300 hover:underline inline-flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} />
                            Mark read
                          </button>
                        )}
                        {notification.booking_id && (
                          <Link
                            to="/my-bookings"
                            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-gold-600"
                          >
                            View booking →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              </AnimateIn>
            )
          })}
        </ul>
      )}
    </div>
  )
}
