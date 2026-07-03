import { format, parseISO } from 'date-fns'
import { Check, ExternalLink, Sparkles } from 'lucide-react'
import OpenPlayCountdown from './OpenPlayCountdown'
import {
  getOpenPlayDisplayStatus,
  getOpenPlaySkillTheme,
  formatOpenPlayTimeRange,
} from '../../utils/openPlay'

export default function OpenPlayPostCard({
  post,
  variant = 'user',
  hasRsvped = false,
  rsvpBusy = false,
  onMarkRsvped,
  onUnmarkRsvped,
  compactRsvp = false,
}) {
  const displayStatus = getOpenPlayDisplayStatus(post)
  const ended = displayStatus === 'ended'
  const cancelled = displayStatus === 'cancelled'
  const completed = displayStatus === 'completed'
  const muted = ended || cancelled || completed
  const isLive = !muted
  const isUserLive = variant === 'user' && isLive
  const theme = getOpenPlaySkillTheme(post.skill_level)

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        muted
          ? 'border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/60 opacity-75'
          : isLive
            ? `${theme.border} ${theme.shadow} ${theme.borderHover} ${theme.shadowHover} hover:-translate-y-0.5`
            : 'border-brand-gold-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-800/90 shadow-sm hover:shadow-md hover:border-brand-gold-300 dark:hover:border-brand-gold-700'
      }`}
      style={isLive ? { background: theme.cardGradient } : undefined}
    >
      {isLive && (
        <>
          <div
            className="absolute -top-12 -right-8 w-36 h-36 rounded-full opacity-40 pointer-events-none"
            style={{ background: theme.orbPrimary }}
            aria-hidden
          />
          <div
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-30 pointer-events-none"
            style={{ background: theme.orbSecondary }}
            aria-hidden
          />
          <div className={`absolute top-0 left-0 right-0 h-1 ${theme.topBar} opacity-90`} aria-hidden />
        </>
      )}

      {isLive && variant === 'admin' && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accentBar}`} />
      )}

      <div className="relative p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isUserLive && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.14em] rounded-full px-2 py-0.5 border ${theme.labelBadge}`}>
                <Sparkles size={10} />
                Open Play
              </span>
            )}
            <OpenPlayCountdown
              rsvpDeadline={post.rsvp_deadline}
              status={displayStatus}
              prominent={isUserLive}
              compact={variant === 'admin'}
              theme={theme}
            />
          </div>
          {post.skill_level && (
            <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 border ${
              isLive ? theme.skillBadge : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
            }`}>
              {post.skill_level}
            </span>
          )}
        </div>

        <div>
          <h3 className={`font-extrabold text-lg leading-snug tracking-tight ${
            muted ? 'text-gray-600 dark:text-gray-300' : isLive ? theme.title : 'text-gray-900 dark:text-white'
          }`}>
            {post.title || 'Open Play Session'}
          </h3>
          <p className={`text-sm mt-1 font-semibold ${
            muted ? 'text-gray-500 dark:text-gray-400' : isLive ? theme.meta : 'text-brand-gold-700 dark:text-brand-gold-400'
          }`}>
            {post.courts?.name ?? 'Court'} · {format(parseISO(post.date), 'EEE, MMM d')}
            {' · '}
            {formatOpenPlayTimeRange(post.start_hour, post.end_hour)}
          </p>
        </div>

        {post.body && (
          <p className={`text-sm leading-relaxed ${
            muted ? 'text-gray-500 dark:text-gray-400' : isLive ? theme.body : 'text-gray-700 dark:text-gray-200'
          }`}>
            {post.body}
          </p>
        )}

        {variant === 'user' && displayStatus === 'upcoming' && post.rsvp_link && !(compactRsvp && hasRsvped) && (
          <div className="space-y-2.5">
            <a
              href={post.rsvp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-extrabold shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
              style={{
                background: theme.rsvpGradient,
                color: theme.rsvpText,
              }}
            >
              RSVP on Reclub
              <ExternalLink size={15} />
            </a>

            {!compactRsvp && (
              hasRsvped ? (
                <div className={`flex items-center justify-between gap-3 rounded-xl backdrop-blur-sm px-4 py-3 shadow-sm border ${theme.rsvpPanelBg}`}>
                  <span className={`inline-flex items-center gap-2 text-sm font-bold ${theme.title}`}>
                    <span className="w-6 h-6 rounded-full bg-brand-gold-500 text-brand-navy-950 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    On your home feed
                  </span>
                  {onUnmarkRsvped && (
                    <button
                      type="button"
                      disabled={rsvpBusy}
                      onClick={onUnmarkRsvped}
                      className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-rose-700 dark:hover:text-rose-400 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : onMarkRsvped ? (
                <div className={`rounded-xl border-2 border-dashed backdrop-blur-sm px-4 py-3 ${theme.rsvpDashedBorder} ${theme.rsvpDashedBg}`}>
                  <p className={`text-xs font-medium mb-2 ${theme.body}`}>Already signed up on Reclub?</p>
                  <button
                    type="button"
                    disabled={rsvpBusy}
                    onClick={onMarkRsvped}
                    className={`w-full py-2.5 rounded-lg text-sm font-extrabold bg-white/80 border hover:bg-white dark:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm ${theme.title} ${theme.rsvpPanelBorder}`}
                  >
                    {rsvpBusy ? 'Saving…' : "Yes, I've RSVPed — add to My Open Play"}
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}

        {variant === 'user' && compactRsvp && hasRsvped && displayStatus === 'upcoming' && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold rounded-full px-3 py-1 shadow-sm border ${theme.goingBadge}`}>
            <Check size={12} strokeWidth={3} className="text-brand-gold-600" />
            You&apos;re going
          </span>
        )}

        {variant === 'admin' && (post.attendance != null || post.revenue != null) && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            {post.attendance != null && (
              <p>
                Attendance: <span className="font-semibold text-gray-800 dark:text-gray-100">{post.attendance}</span>
              </p>
            )}
            {post.revenue != null && (
              <p>
                Revenue: <span className="font-semibold text-brand-gold-700 dark:text-brand-gold-400">₱{Number(post.revenue).toLocaleString()}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
