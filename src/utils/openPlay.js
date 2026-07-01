import { parseISO, isPast } from 'date-fns'

export const SKILL_LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

/** Vibrant card themes per skill level — matches the popped Open Play promo style. */
export const OPEN_PLAY_SKILL_THEMES = {
  'All Levels': {
    id: 'all-levels',
    cardGradient: 'linear-gradient(145deg, #fffbeb 0%, #fef08a 35%, #fde047 65%, #facc15 100%)',
    border: 'border-amber-300/90',
    borderHover: 'hover:border-amber-400',
    shadow: 'shadow-lg shadow-amber-200/60',
    shadowHover: 'hover:shadow-xl hover:shadow-amber-300/50',
    orbPrimary: 'radial-gradient(circle, #fff 0%, transparent 70%)',
    orbSecondary: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
    topBar: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500',
    accentBar: 'bg-gradient-to-b from-amber-500 to-yellow-400',
    labelBadge: 'text-amber-950/70 bg-white/50 border-amber-200/80',
    skillBadge: 'text-amber-950 bg-white/60 border-amber-200/90',
    title: 'text-amber-950',
    meta: 'text-amber-900/85',
    body: 'text-amber-950/80',
    countdownGradient: 'linear-gradient(135deg, #78350f 0%, #92400e 55%, #b45309 100%)',
    countdownBorder: 'border-amber-900/25',
    countdownText: 'text-amber-50',
    countdownPing: 'bg-yellow-300',
    rsvpGradient: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
    rsvpText: '#fef9c3',
    rsvpPanelBorder: 'border-amber-300/80',
    rsvpPanelBg: 'bg-white/55 border-amber-300/80',
    rsvpDashedBorder: 'border-amber-400/70',
    rsvpDashedBg: 'bg-white/45',
    goingBadge: 'text-amber-950 bg-white/60 border-amber-300',
  },
  Beginner: {
    id: 'beginner',
    cardGradient: 'linear-gradient(145deg, #faf6eb 0%, #f3ead4 35%, #e8d5a3 65%, #d4bc6a 100%)',
    border: 'border-brand-gold-300/90',
    borderHover: 'hover:border-brand-gold-400',
    shadow: 'shadow-lg shadow-brand-gold-200/60',
    shadowHover: 'hover:shadow-xl hover:shadow-brand-gold-300/50',
    orbPrimary: 'radial-gradient(circle, #fff 0%, transparent 70%)',
    orbSecondary: 'radial-gradient(circle, #d4bc6a 0%, transparent 70%)',
    topBar: 'bg-gradient-to-r from-brand-gold-400 via-brand-gold-300 to-brand-navy-600',
    accentBar: 'bg-gradient-to-b from-brand-gold-500 to-brand-navy-600',
    labelBadge: 'text-brand-navy-950/70 bg-white/50 border-brand-gold-200/80',
    skillBadge: 'text-brand-navy-950 bg-white/60 border-brand-gold-200/90',
    title: 'text-brand-navy-950',
    meta: 'text-brand-navy-900/85',
    body: 'text-brand-navy-950/80',
    countdownGradient: 'linear-gradient(135deg, #0f1a2e 0%, #1c2f4d 55%, #243a5c 100%)',
    countdownBorder: 'border-brand-navy-900/20',
    countdownText: 'text-brand-gold-50',
    countdownPing: 'bg-brand-gold-300',
    rsvpGradient: 'linear-gradient(135deg, #0f1a2e 0%, #1c2f4d 50%, #243a5c 100%)',
    rsvpText: '#faf6eb',
    rsvpPanelBorder: 'border-brand-gold-300/80',
    rsvpPanelBg: 'bg-white/55 border-brand-gold-300/80',
    rsvpDashedBorder: 'border-brand-gold-400/70',
    rsvpDashedBg: 'bg-white/45',
    goingBadge: 'text-brand-navy-950 bg-white/60 border-brand-gold-300',
  },
  Intermediate: {
    id: 'intermediate',
    cardGradient: 'linear-gradient(145deg, #eff6ff 0%, #93c5fd 35%, #60a5fa 65%, #3b82f6 100%)',
    border: 'border-blue-300/90',
    borderHover: 'hover:border-blue-400',
    shadow: 'shadow-lg shadow-blue-200/60',
    shadowHover: 'hover:shadow-xl hover:shadow-blue-300/50',
    orbPrimary: 'radial-gradient(circle, #fff 0%, transparent 70%)',
    orbSecondary: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)',
    topBar: 'bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400',
    accentBar: 'bg-gradient-to-b from-blue-500 to-indigo-400',
    labelBadge: 'text-blue-950/70 bg-white/50 border-blue-200/80',
    skillBadge: 'text-blue-950 bg-white/60 border-blue-200/90',
    title: 'text-blue-950',
    meta: 'text-blue-900/85',
    body: 'text-blue-950/80',
    countdownGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
    countdownBorder: 'border-blue-900/20',
    countdownText: 'text-blue-50',
    countdownPing: 'bg-sky-300',
    rsvpGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
    rsvpText: '#eff6ff',
    rsvpPanelBorder: 'border-blue-300/80',
    rsvpPanelBg: 'bg-white/55 border-blue-300/80',
    rsvpDashedBorder: 'border-blue-400/70',
    rsvpDashedBg: 'bg-white/45',
    goingBadge: 'text-blue-950 bg-white/60 border-blue-300',
  },
  Advanced: {
    id: 'advanced',
    cardGradient: 'linear-gradient(145deg, #fff1f2 0%, #fecdd3 35%, #fb7185 65%, #f43f5e 100%)',
    border: 'border-rose-400/90',
    borderHover: 'hover:border-rose-500',
    shadow: 'shadow-lg shadow-rose-200/70',
    shadowHover: 'hover:shadow-xl hover:shadow-rose-300/55',
    orbPrimary: 'radial-gradient(circle, #fff 0%, transparent 70%)',
    orbSecondary: 'radial-gradient(circle, #fb7185 0%, transparent 70%)',
    topBar: 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-600',
    accentBar: 'bg-gradient-to-b from-rose-600 to-red-500',
    labelBadge: 'text-rose-950/70 bg-white/50 border-rose-200/80',
    skillBadge: 'text-rose-950 bg-white/70 border-rose-300/90',
    title: 'text-rose-950',
    meta: 'text-rose-900/85',
    body: 'text-rose-950/80',
    countdownGradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 55%, #dc2626 100%)',
    countdownBorder: 'border-red-900/25',
    countdownText: 'text-red-50',
    countdownPing: 'bg-orange-200',
    rsvpGradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%)',
    rsvpText: '#fff1f2',
    rsvpPanelBorder: 'border-rose-300/80',
    rsvpPanelBg: 'bg-white/55 border-rose-300/80',
    rsvpDashedBorder: 'border-rose-400/70',
    rsvpDashedBg: 'bg-white/45',
    goingBadge: 'text-rose-950 bg-white/60 border-rose-300',
  },
}

export function getOpenPlaySkillTheme(skillLevel) {
  if (!skillLevel) return OPEN_PLAY_SKILL_THEMES['All Levels']
  const normalized = SKILL_LEVELS.find(
    level => level.toLowerCase() === String(skillLevel).trim().toLowerCase(),
  )
  return OPEN_PLAY_SKILL_THEMES[normalized ?? 'All Levels']
}

/** Live display status — respects cancelled, completed, then RSVP deadline. */
export function getOpenPlayDisplayStatus(post, now = new Date()) {
  if (post.status === 'cancelled') return 'cancelled'
  if (post.status === 'completed') return 'completed'
  const deadline = parseISO(post.rsvp_deadline)
  if (isPast(deadline)) return 'ended'
  return 'upcoming'
}

export function isOpenPlayPast(post) {
  const s = getOpenPlayDisplayStatus(post)
  return s === 'ended' || s === 'completed'
}

export function getOpenPlayDurationHours(post) {
  return post.end_hour - post.start_hour
}

/** Sort: upcoming first (soonest RSVP deadline), then ended (most recent session). */
export function sortOpenPlayPosts(posts, now = new Date()) {
  return [...posts].sort((a, b) => {
    const sa = getOpenPlayDisplayStatus(a, now)
    const sb = getOpenPlayDisplayStatus(b, now)
    if (sa !== sb) {
      if (sa === 'upcoming') return -1
      if (sb === 'upcoming') return 1
    }
    if (sa === 'upcoming') {
      return new Date(a.rsvp_deadline) - new Date(b.rsvp_deadline)
    }
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return b.start_hour - a.start_hour
  })
}

/** Milliseconds until RSVP deadline (0 if past). */
export function getRsvpCountdownMs(rsvpDeadline, now = new Date()) {
  const end = new Date(rsvpDeadline).getTime()
  return Math.max(0, end - now.getTime())
}

export function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatCountdownLabel(ms) {
  const text = formatCountdown(ms)
  return text ? `RSVPs close in ${text}` : 'RSVPs closed'
}

export function formatOpenPlayHour(h) {
  if (h === 0 || h === 24) return '12MN'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

export function formatOpenPlayTimeRange(startHour, endHour) {
  return `${formatOpenPlayHour(startHour)} – ${formatOpenPlayHour(endHour)}`
}

export function isValidOpenPlayTimeRange(startHour, endHour) {
  return (
    startHour >= 0 && startHour <= 23
    && endHour > startHour && endHour <= 24
    && startHour + (endHour - startHour) <= 24
  )
}
