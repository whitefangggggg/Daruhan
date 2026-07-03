import { SITE } from '../config/site'

// Returns the hourly rate for a given hour (0–23, 24-hour format)
export function getRateForHour(hour) {
  if (hour >= 1 && hour <= 5) return 350 // 1AM – 5AM
  if (hour === 0 || (hour >= 7 && hour <= 23)) return 300 // 7AM – 12MN (incl. midnight)
  return 300 // 5AM–7AM closed; default for display only
}

/** Tailwind classes per timeframe — shared by rate guide + slot grid */
export const RATE_BRACKET_THEMES = {
  daytime: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-800/40',
    text: 'text-orange-950 dark:text-orange-100',
    price: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    accent: 'bg-orange-500',
  },
  lateNight: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    border: 'border-fuchsia-300 dark:border-fuchsia-800/40',
    text: 'text-fuchsia-950 dark:text-fuchsia-100',
    price: 'text-fuchsia-700 dark:text-fuchsia-400',
    dot: 'bg-fuchsia-600',
    accent: 'bg-fuchsia-600',
  },
}

/** Display rows for UI (must match getRateForHour) */
export const RATE_BRACKETS = [
  {
    id: 'daytime',
    themeId: 'daytime',
    label: 'Day & evening',
    time: '7AM – 12MN',
    rate: 300,
  },
  {
    id: 'lateNight',
    themeId: 'lateNight',
    label: 'Late night',
    time: '1AM – 5AM',
    rate: 350,
  },
]

export function getBracketForHour(hour) {
  if (hour >= 1 && hour <= 5) return RATE_BRACKETS[1]
  return RATE_BRACKETS[0]
}

export function getThemeForHour(hour) {
  return RATE_BRACKET_THEMES[getBracketForHour(hour).themeId]
}

// Calculates total cost for a booking given a start hour and duration
export function calculateTotal(startHour, durationHours) {
  let total = 0
  for (let i = 0; i < durationHours; i++) {
    const hour = (startHour + i) % 24
    total += getRateForHour(hour)
  }
  return total
}

// ── KTV — flat rate, no day/night brackets (mirrors calculate_ktv_total in SQL) ─

export function getKtvRateForHour() {
  return SITE.ktv.ratePerHour
}

export function calculateKtvTotal(durationHours) {
  return SITE.ktv.ratePerHour * Math.max(0, durationHours)
}

export const KTV_RATE_THEME = {
  bg: 'bg-brand-gold-50 dark:bg-brand-navy-900/20',
  border: 'border-brand-gold-300 dark:border-brand-gold-800/40',
  text: 'text-brand-gold-950 dark:text-brand-gold-100',
  price: 'text-brand-gold-700 dark:text-brand-gold-400',
  dot: 'bg-brand-gold-500',
  accent: 'bg-brand-gold-500',
}

export function getKtvThemeForHour() {
  return KTV_RATE_THEME
}

/** Single "bracket" row so the shared time-grid legend can render KTV's flat rate. */
export const KTV_RATE_BRACKETS = [
  {
    id: 'ktv',
    theme: KTV_RATE_THEME,
    label: 'Any hour',
    time: SITE.ktv.hoursLabel,
    rate: SITE.ktv.ratePerHour,
  },
]
