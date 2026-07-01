import { SITE } from '../config/site'

/**
 * User-facing copy for Supabase Auth errors (avoid raw GoTrue messages in the UI).
 */
export function formatAuthError(message) {
  if (!message) return 'Something went wrong. Please try again.'

  const lower = message.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many sign-in or sign-up attempts. Please wait about an hour before trying again, or use Continue with Google.'
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password.'
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead, or check your inbox for a confirmation link.'
  }

  if (lower.includes('email not confirmed')) {
    return `Please confirm your email first — check your inbox for the link from ${SITE.name}, then sign in.`
  }

  if (lower.includes('password') && lower.includes('least')) {
    return message
  }

  return message
}
