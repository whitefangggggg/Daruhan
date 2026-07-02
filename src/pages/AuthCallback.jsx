import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { exchangeOAuthCodeOnce } from '../lib/oauthPkce'
import { peekAuthRedirect, consumeAuthRedirect } from '../lib/authRedirect'

function Spinner({ message = 'Signing you in…' }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100svh-4rem)]">
      <div className="flex flex-col items-center gap-3 max-w-sm px-6 text-center">
        <div className="w-10 h-10 border-4 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{message}</p>
      </div>
    </div>
  )
}

function readOAuthError() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const raw =
    search.get('error_description')
    || search.get('error')
    || hash.get('error_description')
    || hash.get('error')

  if (!raw) return null
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [exchangeState, setExchangeState] = useState('idle')
  const [exchangeError, setExchangeError] = useState(null)
  const profileRetryRef = useRef(false)
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (exchangeState !== 'idle') return

    async function runExchange() {
      const oauthError = readOAuthError()
      if (oauthError) {
        navigate('/login', { replace: true, state: { oauthError } })
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')
      setExchangeState('exchanging')

      const { error } = await exchangeOAuthCodeOnce(code)
      if (error) {
        setExchangeError(error.message)
        setExchangeState('failed')
        return
      }
      setExchangeState('done')
    }

    runExchange()
  }, [exchangeState, navigate])

  useEffect(() => {
    if (exchangeState === 'failed') {
      navigate('/login', { replace: true, state: { oauthError: exchangeError } })
      return
    }

    if (exchangeState === 'exchanging' || exchangeState === 'idle') return
    if (loading) return
    if (navigatedRef.current) return

    async function finish() {
      const { data: { session } } = await supabase.auth.getSession()
      const sessionUser = session?.user ?? null
      const activeUser = user ?? sessionUser

      if (!activeUser) {
        navigatedRef.current = true
        navigate('/login', {
          replace: true,
          state: { oauthError: 'Google sign-in did not complete. Please try again.' },
        })
        return
      }

      let activeProfile = profile
      if (!activeProfile && !profileRetryRef.current) {
        profileRetryRef.current = true
        activeProfile = await refreshProfile()
      }
      if (!activeProfile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUser.id)
          .maybeSingle()
        activeProfile = data
      }

      const pendingRedirect = peekAuthRedirect()
      const needsOnboard =
        !activeProfile
        || (activeProfile.onboarding_completed === false && activeProfile.role !== 'admin')

      navigatedRef.current = true

      if (needsOnboard) {
        navigate('/onboarding', {
          replace: true,
          state: pendingRedirect ? { redirectTo: pendingRedirect } : undefined,
        })
        return
      }

      const redirectTo = consumeAuthRedirect()
      if (redirectTo && activeProfile?.role !== 'admin') {
        navigate(redirectTo, { replace: true })
        return
      }

      navigate(activeProfile?.role === 'admin' ? '/admin' : '/home', { replace: true })
    }

    finish()
  }, [
    exchangeState,
    exchangeError,
    loading,
    user,
    profile,
    navigate,
    refreshProfile,
  ])

  useEffect(() => {
    if (exchangeState !== 'done' || navigatedRef.current) return

    const timer = window.setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true
        navigate('/login', {
          replace: true,
          state: {
            oauthError: 'Sign-in is taking too long. Please try Google sign-in again from the login page.',
          },
        })
      }
    }, 15000)

    return () => window.clearTimeout(timer)
  }, [exchangeState, navigate])

  if (exchangeState === 'exchanging') {
    return <Spinner message="Completing Google sign-in…" />
  }

  return <Spinner />
}
