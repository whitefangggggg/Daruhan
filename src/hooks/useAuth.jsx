import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

async function loadOrCreateProfile(user) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (data) return data

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Player'

  const { data: newProfile } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: fullName,
      onboarding_completed: false,
    })
    .select()
    .single()

  return newProfile
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) return null
    const data = await loadOrCreateProfile(user)
    setProfile(data)
    return data
  }, [user])

  useEffect(() => {
    async function applySession(session) {
      const u = session?.user ?? null
      if (!u) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setUser(u)
      setProfile(null)
      const p = await loadOrCreateProfile(u)
      setProfile(p)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Initial session is handled by getSession above
      if (event === 'INITIAL_SESSION') return

      setLoading(true)
      await applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = profile?.role === 'admin'
  const needsOnboarding = Boolean(
    user && profile && profile.onboarding_completed === false && profile.role !== 'admin',
  )
  const isGoogleUser = user?.app_metadata?.provider === 'google' ||
    user?.identities?.some(i => i.provider === 'google')

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, needsOnboarding, isGoogleUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
