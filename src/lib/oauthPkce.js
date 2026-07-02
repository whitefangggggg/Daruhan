import { supabase } from './supabaseClient'

/** In-flight exchanges keyed by OAuth code — survives React StrictMode double-mount. */
const inflightByCode = new Map()

/**
 * Exchange the PKCE auth code exactly once per page load.
 * Supabase stores the code verifier in localStorage when sign-in starts on /login;
 * calling exchange twice (e.g. StrictMode) consumes the verifier and fails.
 */
export async function exchangeOAuthCodeOnce(code) {
  if (!code) {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }

  const existing = inflightByCode.get(code)
  if (existing) return existing

  const promise = (async () => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      window.history.replaceState({}, document.title, '/auth/callback')
    }
    return { session: data?.session ?? null, error }
  })()

  inflightByCode.set(code, promise)
  return promise
}
