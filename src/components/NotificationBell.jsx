import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { NOTIFICATION_META, formatNotificationTime } from '../utils/notificationMeta'

function UnreadBadge({ count }) {
  if (count <= 0) return null
  const label = count > 9 ? '9+' : String(count)
  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm leading-none"
      aria-hidden
    >
      {label}
    </span>
  )
}

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
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Read
    </span>
  )
}

export default function NotificationBell({ onNavigate }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications(user?.id)

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!user) return null

  function handleMarkRead(e, notification) {
    e.stopPropagation()
    if (!notification.read_at) markAsRead(notification.id)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) refetch()
        }}
        className="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-gold-600 hover:bg-brand-gold-50 border border-transparent hover:border-brand-gold-200 transition-colors"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={20} strokeWidth={2.25} />
        <UnreadBadge count={unreadCount} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl shadow-xl overflow-hidden z-[60] bg-white dark:bg-slate-800 border border-brand-gold-200 dark:border-slate-700"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-white to-brand-gold-50/40 dark:from-slate-800 dark:to-slate-800/80">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {unreadCount > 0
                  ? <span className="text-red-600 font-semibold">{unreadCount} unread</span>
                  : 'All caught up'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-300 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => { setOpen(false); onNavigate?.() }}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-gold-600 flex items-center gap-0.5"
              >
                View all
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[min(26rem,65vh)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell size={28} className="mx-auto mb-3 text-gray-200 dark:text-slate-600" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  We&apos;ll notify you when bookings are confirmed or updated.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {notifications.map(notification => {
                  const meta = NOTIFICATION_META[notification.type] ?? NOTIFICATION_META.booking_confirmed
                  const Icon = meta.icon
                  const isUnread = !notification.read_at

                  return (
                    <li
                      key={notification.id}
                      className={`px-4 py-3.5 flex gap-3 transition-colors ${
                        isUnread ? 'bg-brand-gold-50/40 dark:bg-brand-navy-900/30' : 'bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Icon */}
                      <span className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center ${meta.accent}`}>
                        <Icon size={17} strokeWidth={2.25} />
                      </span>

                      {/* Body */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <ReadPill isUnread={isUnread} />
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                          {notification.body}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[11px] text-gray-400">
                            {formatNotificationTime(notification.created_at)}
                          </span>

                          <div className="flex items-center gap-3">
                            {isUnread && (
                              <button
                                type="button"
                                onClick={e => handleMarkRead(e, notification)}
                                className="text-[11px] font-semibold text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-300 hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            {notification.booking_id ? (
                              <Link
                                to="/my-bookings"
                                onClick={() => { setOpen(false); onNavigate?.() }}
                                className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-gold-600"
                              >
                                View booking →
                              </Link>
                            ) : (
                              <Link
                                to="/notifications"
                                onClick={() => { setOpen(false); onNavigate?.() }}
                                className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-gold-600"
                              >
                                Details →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
