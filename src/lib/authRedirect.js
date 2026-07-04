import { SITE } from '../config/site'

const STORAGE_KEY = `${SITE.storagePrefix}:auth-redirect`

const ALLOWED_PREFIXES = ['/book', '/ktv', '/home', '/my-bookings', '/profile', '/guide', '/notifications']

function isSafeRedirect(path) {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path === '/login' || path === '/auth/callback' || path === '/onboarding') return false
  return ALLOWED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

/** Remember where to send the user after OAuth + onboarding. */
export function saveAuthRedirect(path) {
  if (isSafeRedirect(path)) {
    sessionStorage.setItem(STORAGE_KEY, path)
  }
}

export function peekAuthRedirect() {
  const path = sessionStorage.getItem(STORAGE_KEY)
  return isSafeRedirect(path) ? path : null
}

export function consumeAuthRedirect() {
  const path = peekAuthRedirect()
  sessionStorage.removeItem(STORAGE_KEY)
  return path
}

export function getOAuthCallbackUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  const siteUrl = import.meta.env.VITE_SITE_URL?.trim()
  if (siteUrl) return `${siteUrl.replace(/\/$/, '')}/auth/callback`
  return '/auth/callback'
}
