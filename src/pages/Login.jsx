import { useRef, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatAuthError } from '../utils/authErrors'
import { getOAuthCallbackUrl, saveAuthRedirect } from '../lib/authRedirect'
import BrandLogo from '../components/BrandLogo'
import { SITE } from '../config/site'
import { Link, useLocation } from 'react-router-dom'
import { StatusMessage, CheckCircle2 } from '../components/ui/Icon'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder, label }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="input-field pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors"
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}

function StrengthBar({ password }) {
  if (!password) return null
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-brand-gold-500']

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-150 ${i <= strength ? colors[strength] : 'bg-gray-100 dark:bg-slate-800'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-500' : strength === 3 ? 'text-blue-500' : 'text-brand-gold-500'}`}>
        {labels[strength]}
      </p>
    </div>
  )
}

export default function Login() {
  const location = useLocation()
  const redirectTo = location.state?.redirectTo
  const [mode, setMode] = useState(() => (location.state?.mode === 'register' ? 'register' : 'login'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (location.state?.oauthError) {
      setError(formatAuthError(location.state.oauthError))
    }
  }, [location.state?.oauthError])

  function switchMode(m) {
    setMode(m)
    setError(null)
    setNotice(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submittingRef.current) return
    setError(null)
    setNotice(null)

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(formatAuthError(signInError.message))
          return
        }
        // GuestRoute redirects once auth + profile are loaded (admins → /admin)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (signUpError) {
        setError(formatAuthError(signUpError.message))
        return
      }

      if (data.session) {
        // Email confirmation off — signed in immediately; profile created on first auth load if needed
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            onboarding_completed: false,
          })
        }
        return
      }

      // Email confirmation on — do not retry sign-up; one email was sent
      setMode('login')
      setPassword('')
      setConfirmPassword('')
      setNotice(
        `We sent a confirmation link to ${email.trim()}. Open it, then sign in here — do not register again or you may hit the email limit.`,
      )
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  async function handleGoogle() {
    if (googleLoading) return
    setGoogleLoading(true)
    setError(null)
    setNotice(null)

    saveAuthRedirect(redirectTo)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthCallbackUrl(),
        queryParams: {
          prompt: 'select_account',
          access_type: 'online',
        },
      },
    })
    if (oauthError) {
      setError(formatAuthError(oauthError.message))
      setGoogleLoading(false)
    }
  }

  const passwordMismatch = mode === 'register' && confirmPassword.length > 0 && password !== confirmPassword

  const loginSubtitle = redirectTo === '/ktv'
    ? 'Sign in to book a KTV room'
    : 'Sign in to book your court'
  const registerSubtitle = redirectTo === '/ktv'
    ? 'Create an account to book a KTV room'
    : 'Create an account and start playing'

  return (
    <div className="relative min-h-[calc(100svh-4rem)] bg-white dark:bg-brand-navy-950">
      <Link
        to="/"
        className="absolute top-6 left-4 md:left-8 z-10 flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-gold-600 transition-colors"
      >
        <span aria-hidden>←</span> Back
      </Link>

      <div className="flex flex-col items-center justify-center min-h-[calc(100svh-4rem)] px-4 py-12 sm:py-14">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <BrandLogo alt={SITE.name} size="auth" variant="plain" className="mx-auto mb-3" />
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {mode === 'login' ? 'Welcome back' : SITE.copy.joinCta}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'login' ? loginSubtitle : registerSubtitle}
            </p>
          </div>

          <div className="card p-7 shadow-sm">
          {notice && <StatusMessage type="success" className="mb-5">{notice}</StatusMessage>}
          {error && <StatusMessage type="error" className="mb-5">{error}</StatusMessage>}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 min-h-[2.75rem] py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60 mb-5"
          >
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              : <GoogleIcon />}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
            <span className="text-xs text-gray-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Juan dela Cruz" required className="input-field" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setNotice(null) }}
                placeholder="you@email.com" required className="input-field" />
            </div>

            <PasswordInput
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {mode === 'register' && <StrengthBar password={password} />}

            {mode === 'register' && (
              <>
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {passwordMismatch && (
                  <p className="text-xs text-red-500 -mt-2 font-medium">Passwords don't match</p>
                )}
                {!passwordMismatch && confirmPassword.length > 0 && (
                  <p className="text-xs text-brand-gold-500 -mt-2 font-medium inline-flex items-center gap-1">
                    <CheckCircle2 size={14} /> Passwords match
                  </p>
                )}
              </>
            )}

            <button type="submit" disabled={loading || passwordMismatch}
              className="btn-primary w-full text-sm" style={{ padding: '0.75rem' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Please wait…
                  </span>
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="font-semibold text-brand-gold-500 hover:text-brand-gold-600 hover:underline transition-colors">
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
