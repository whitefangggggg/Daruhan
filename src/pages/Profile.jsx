import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import Avatar from '../components/Avatar'
import { StatusMessage } from '../components/ui/Icon'

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

export default function Profile() {
  const { user, profile, isGoogleUser, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setAddress(profile.address || '')
    }
  }, [profile])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordSaving(false)
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Edit <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Profile header card */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        <div className="relative">
          <Avatar user={user} profile={profile} size="xl" />
          {isGoogleUser && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700">
              <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/></svg>
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 dark:text-white truncate">{profile.full_name || 'Player'}</p>
          <p className="text-sm text-gray-400 truncate">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-gold-50 text-brand-gold-600 border border-brand-gold-200">
              {isGoogleUser ? 'Google Account' : 'Email Account'}
            </span>
            {profile.role === 'admin' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                Admin
              </span>
            )}
          </div>
          {profile.created_at && (
            <p className="text-xs text-gray-400 mt-2">
              Member since {format(parseISO(profile.created_at), 'MMMM yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSaveProfile} className="card p-6 space-y-4 mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Info</p>

        {error && <StatusMessage type="error">{error}</StatusMessage>}
        {saved && <StatusMessage type="success">Profile saved</StatusMessage>}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Full Name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            required className="input-field" placeholder="Your full name" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="input-field" placeholder="09XX XXX XXXX" />
          <p className="text-xs text-gray-400 mt-1">Used for booking confirmations and court contact</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Address / area</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={2}
            className="input-field resize-none"
            placeholder="e.g. Consolacion, Cebu"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
          <input type="email" value={user.email} disabled
            className="input-field bg-gray-50 dark:bg-slate-800/50 text-gray-400 cursor-not-allowed" />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full text-sm" style={{ padding: '0.75rem' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Password section — email users only */}
      {!isGoogleUser && (
        <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Change Password</p>

          {passwordMsg && (
            <StatusMessage type={passwordMsg.type === 'error' ? 'error' : 'success'}>
              {passwordMsg.text}
            </StatusMessage>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} minLength={8}
                className="input-field pr-10" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowNew(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300">
                <EyeIcon open={showNew} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field pr-10" placeholder="Re-enter new password" />
              <button type="button" onClick={() => setShowConfirm(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          <button type="submit" disabled={passwordSaving}
            className="w-full text-sm font-semibold py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-slate-800/50 transition-colors disabled:opacity-50">
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}

      {isGoogleUser && (
        <div className="card p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Signed in with Google — password is managed through your Google account.
        </div>
      )}
    </div>
  )
}
