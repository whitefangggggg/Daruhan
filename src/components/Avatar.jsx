export function getAvatarUrl(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
}

export function getInitials(profile, user) {
  const name = profile?.full_name || user?.email || 'P'
  return name[0].toUpperCase()
}

export default function Avatar({ user, profile, size = 'md', className = '' }) {
  const avatarUrl = getAvatarUrl(user)
  const initials = getInitials(profile, user)

  const sizes = {
    sm: 'w-8 h-8 text-sm rounded-full',
    md: 'w-10 h-10 text-base rounded-full',
    lg: 'w-14 h-14 text-xl rounded-2xl',
    xl: 'w-20 h-20 text-2xl rounded-2xl',
  }

  const dim = sizes[size] || sizes.md

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={profile?.full_name || 'Profile'}
        className={`${dim} object-cover ring-2 ring-brand-gold-200 flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${dim} flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #1c2f4d, #c9a227)' }}
    >
      {initials}
    </div>
  )
}
