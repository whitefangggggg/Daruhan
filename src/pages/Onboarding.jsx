import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { consumeAuthRedirect } from '../lib/authRedirect'
import BrandLogo from '../components/BrandLogo'
import { SITE } from '../config/site'
import { Check } from '../components/ui/Icon'
import { fadeIn, fadeUp, scaleIn, transition } from '../lib/motion'

const PHASE_MS = {
  welcome: 2800,
  done: 2600,
}

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, refreshProfile } = useAuth()

  const resolveDestination = useCallback(() => {
    return consumeAuthRedirect() || location.state?.redirectTo || '/home'
  }, [location.state?.redirectTo])

  const [phase, setPhase] = useState('welcome')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const displayName = fullName.trim() || profile?.full_name || user?.email?.split('@')[0] || 'Player'

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true })
      return
    }
    if (profile?.onboarding_completed) {
      navigate(resolveDestination(), { replace: true })
    }
  }, [user, profile, navigate, resolveDestination])

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name || '')
    setPhone(profile.phone || '')
    setAddress(profile.address || '')
  }, [profile])

  useEffect(() => {
    if (phase !== 'welcome' && phase !== 'done') return
    const delay = phase === 'welcome' ? PHASE_MS.welcome : PHASE_MS.done
    const timer = setTimeout(() => {
      if (phase === 'welcome') setPhase('details')
      else navigate(resolveDestination(), { replace: true })
    }, delay)
    return () => clearTimeout(timer)
  }, [phase, navigate, resolveDestination])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!phone.trim()) {
      setError('Please enter a contact number so we can reach you about bookings.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim() || null,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setSaving(false)
    setPhase('done')
  }

  if (!user || (profile && (profile.onboarding_completed || profile.role === 'admin'))) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-cream">
        <div className="w-10 h-10 border-4 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a1220 0%, #0f1a2e 35%, #1c2f4d 60%, #faf8f3 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="blob w-96 h-96 top-[-80px] right-[-60px] opacity-40" style={{ background: 'rgba(201, 162, 39, 0.2)' }} />
        <div className="blob w-80 h-80 bottom-[-60px] left-[-40px] opacity-30" style={{ background: 'rgba(212, 188, 106, 0.15)' }} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            className="relative z-10 text-center max-w-md"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -12 }}
            transition={transition.medium}
          >
            <motion.div
              className="mx-auto mb-6 flex justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition.medium, delay: 0.1 }}
            >
              <BrandLogo alt="" size="lg" variant="dark" className="!w-24 !h-24 sm:!w-28 sm:!h-28" />
            </motion.div>
            <motion.p
              className="text-brand-gold-200 text-sm font-semibold uppercase tracking-[0.2em] mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition.medium, delay: 0.2 }}
            >
              Welcome to {SITE.name}
            </motion.p>
            <motion.h1
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition.medium, delay: 0.35 }}
            >
              Welcome, {displayName}!
            </motion.h1>
            <motion.p
              className="text-brand-gold-100/80 text-sm mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition.medium, delay: 0.55 }}
            >
              Let&apos;s set up your profile…
            </motion.p>
          </motion.div>
        )}

        {phase === 'details' && (
          <motion.div
            key="details"
            className="relative z-10 w-full max-w-md"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16 }}
            transition={transition.medium}
          >
            <div className="card p-6 sm:p-7 shadow-2xl">
              <p className="text-xs font-bold text-brand-gold-600 uppercase tracking-widest mb-1">Almost there</p>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Tell us a bit about you</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We use this to confirm bookings and reach you if anything changes on court day.
              </p>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Full name <span className="text-red-600 normal-case">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Mobile number <span className="text-red-600 normal-case">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="09XX XXX XXXX"
                    required
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">For booking updates and payment follow-ups</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Address / area <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={2}
                    placeholder="e.g. Consolacion, Cebu"
                    className="input-field resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full text-sm py-3 rounded-xl font-semibold disabled:opacity-60"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            className="relative z-10 text-center max-w-md"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.medium}
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-brand-gold-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-gold-400/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              <Check size={40} strokeWidth={2.5} />
            </motion.div>
            <motion.h2
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ ...transition.medium, delay: 0.15 }}
            >
              You&apos;re all set!
            </motion.h2>
            <motion.p
              className="text-brand-gold-100/90 text-sm mt-4"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ ...transition.medium, delay: 0.35 }}
            >
              Time to book your court…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
