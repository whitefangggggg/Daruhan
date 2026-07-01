import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { StatusMessage } from '../../components/ui/Icon'
import { Shield, User } from 'lucide-react'

const SOFT_EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

const ROLE_CONFIG = {
  admin: {
    badge: 'bg-violet-100/80 text-violet-700 border-violet-200/70',
    dot: 'bg-violet-500',
    label: 'Admin',
    icon: Shield,
  },
  user: {
    badge: 'bg-gray-100/70 text-gray-500 dark:text-gray-400 border-gray-200/70',
    dot: 'bg-gray-400',
    label: 'Player',
    icon: User,
  },
}

export default function ManageUsers() {
  const { user: currentUser } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchProfiles() }, [])

  async function fetchProfiles() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, onboarding_completed, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else setProfiles(data ?? [])
    setLoading(false)
  }

  const adminCount = profiles.filter(p => p.role === 'admin').length
  const onboardingPending = profiles.filter(p => !p.onboarding_completed).length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-gold-200 dark:border-brand-navy-700/40 border-t-brand-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 lg:py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">

        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SOFT_EASE}
          className="mb-6"
        >
          <p className="admin-kicker mb-2">Admin · Directory</p>
          <h1 className="admin-display text-[1.875rem] lg:text-[2.25rem] text-gray-900 dark:text-white leading-tight">
            Registered <span className="gradient-text">Users</span>
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="admin-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-50 dark:bg-brand-navy-900/30" />
              {profiles.length} total
            </span>
            <span className="admin-chip" style={{ color: '#6d28d9' }}>
              <Shield size={11} />
              {adminCount} admin{adminCount !== 1 ? 's' : ''}
            </span>
            {onboardingPending > 0 && (
              <span className="admin-chip" style={{ color: '#b45309' }}>
                {onboardingPending} pending onboarding
              </span>
            )}
          </div>
        </motion.header>

        {error && <StatusMessage type="error" className="mb-4">{error}</StatusMessage>}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT_EASE, delay: 0.05 }}
          className="admin-card overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-brand-gold-200/60 bg-brand-gold-50/40">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span>User</span>
              <span className="hidden sm:block">Joined</span>
              <span>Role</span>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <User size={34} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No users yet</p>
            </div>
          ) : (
            <motion.ul
              className="divide-y divide-brand-gold-200/40"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
            >
              {profiles.map(profile => {
                const isCurrentUser = profile.id === currentUser?.id
                const roleCfg = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.user
                const RoleIcon = roleCfg.icon

                return (
                  <motion.li
                    key={profile.id}
                    variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
                    transition={SOFT_EASE}
                    className="px-5 py-4 grid grid-cols-[1fr_auto_auto] gap-4 items-center hover:bg-brand-gold-50/30 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        profile.role === 'admin' ? 'bg-violet-100/70' : 'bg-brand-gold-100/60'
                      }`}>
                        <RoleIcon
                          size={15}
                          className={profile.role === 'admin' ? 'text-violet-600' : 'text-brand-gold-600'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 dark:text-white text-[13px] truncate">
                            {profile.full_name || <span className="italic text-gray-400">No name</span>}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-gold-500 text-white px-1.5 py-0.5 rounded-md flex-shrink-0">
                              You
                            </span>
                          )}
                          {!profile.onboarding_completed && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Onboarding
                            </span>
                          )}
                        </div>
                        {profile.phone && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{profile.phone}</p>
                        )}
                      </div>
                    </div>

                    <span className="hidden sm:block text-[11px] text-gray-400 font-medium flex-shrink-0 tabular-nums">
                      {profile.created_at ? format(parseISO(profile.created_at), 'MMM d, yyyy') : '—'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${roleCfg.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dot}`} />
                      {roleCfg.label}
                    </span>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </motion.div>

        <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
          View-only directory of registered players. Admin accounts are managed by the developer in Supabase.
        </p>
    </div>
  )
}
