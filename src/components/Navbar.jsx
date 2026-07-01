import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabaseClient'
import Avatar from './Avatar'
import NotificationBell from './NotificationBell'
import { SITE } from '../config/site'
import { IconBadge, Home, User, LogOut, ClipboardList, Menu, X, ChevronDown, BookOpen } from './ui/Icon'
import { Moon, Sun } from 'lucide-react'
import AppEmoji from './ui/AppEmoji'

const PUBLIC_LINKS = [
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

const AUTH_LINKS = [
  { label: 'Home', to: '/home', icon: Home, iconVariant: 'green' },
  ...(SITE.features.openPlay ? [{ label: 'Open Play', to: '/open-play', emoji: 'paddle' }] : []),
  { label: 'Book', to: '/book', emoji: 'court' },
  { label: 'KTV', to: '/ktv', emoji: 'microphone' },
  { label: 'Bookings', to: '/my-bookings', icon: ClipboardList, iconVariant: 'blue' },
  { label: 'Guide', to: '/guide', icon: BookOpen, iconVariant: 'purple' },
]

function NavLink({ to, label, isActive, onClick, className = '', darkNav = false }) {
  const base = darkNav
    ? isActive
      ? 'text-brand-gold-200 bg-white/10'
      : 'text-white/75 hover:text-white hover:bg-white/10'
    : isActive
      ? 'text-brand-navy-900 bg-brand-gold-50'
      : 'text-gray-600 dark:text-gray-300 hover:text-brand-gold-600 hover:bg-brand-gold-50/60'

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${base} ${className}`}
    >
      {label}
      {isActive && (
        <span
          className={`absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full ${darkNav ? 'bg-brand-gold-400' : 'bg-brand-gold-500'}`}
          aria-hidden
        />
      )}
    </Link>
  )
}

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isLanding = location.pathname === '/'
  const isLoginPage = location.pathname === '/login'
  const isPublicPage = isLanding || isLoginPage
  const darkNav = (isLanding || isLoginPage) && !user
  const activeTheme = isPublicPage && !isLanding && !isLoginPage ? 'light' : theme

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setMenuOpen(false)
    navigate('/')
  }

  function isActive(path) {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.slice(1)
    }
    return location.pathname === path
  }

  function openRates() {
    setMenuOpen(false)
    if (location.pathname === '/') {
      window.dispatchEvent(new CustomEvent(`${SITE.storagePrefix}:open-pricing`))
    } else {
      navigate('/', { state: { openPricing: true } })
    }
  }

  if (loading) return null

  function handleLogoClick(e) {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setMenuOpen(false)
    }
  }

  const navSurface = darkNav
    ? {
        background: '#0f1a2e',
        borderBottom: '1px solid rgba(212, 188, 106, 0.18)',
        boxShadow: '0 1px 0 rgba(0, 0, 0, 0.25)',
      }
    : {
        background: activeTheme === 'dark' ? '#0f1a2e' : '#ffffff',
        borderBottom: activeTheme === 'dark' ? '1px solid #243a5c' : '1px solid #e8d5a3',
        boxShadow: activeTheme === 'dark' ? '0 1px 0 rgba(0, 0, 0, 0.2)' : '0 1px 0 rgba(201, 162, 39, 0.12)',
      }

  const ratesButtonClass = darkNav
    ? 'relative px-3 py-2 rounded-lg text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors'
    : 'relative px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-gold-600 hover:bg-brand-gold-50/60 transition-colors'

  const signInClass = darkNav
    ? isLoginPage
      ? 'text-sm font-semibold text-brand-gold-200 px-3 py-2 rounded-lg bg-white/10'
      : 'text-sm font-semibold text-white/85 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors'
    : isLoginPage
      ? 'text-sm font-semibold text-brand-navy-900 px-3 py-2 rounded-lg bg-brand-gold-50'
      : 'text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-gold-600 px-3 py-2 rounded-lg hover:bg-brand-gold-50/60 transition-colors'

  const menuIconClass = darkNav
    ? 'p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors'
    : 'p-2 text-gray-500 dark:text-gray-400 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 rounded-lg hover:bg-brand-gold-50 dark:hover:bg-slate-800 transition-colors'

  return (
    <nav className="sticky top-0 z-50" style={navSurface}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="font-bold text-lg tracking-tight transition-colors flex-shrink-0 text-brand-gold-400 hover:text-brand-gold-300 dark:text-brand-gold-300 dark:hover:text-brand-gold-200"
        >
          {SITE.name}
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-center gap-0.5">
          {user ? (
            AUTH_LINKS.map(link => (
              <NavLink key={link.to} to={link.to} label={link.label} isActive={isActive(link.to)} darkNav={darkNav} />
            ))
          ) : (
            <>
              {PUBLIC_LINKS.map(link => (
                <NavLink key={link.to} to={link.to} label={link.label} isActive={isActive(link.to)} darkNav={darkNav} />
              ))}
              <button type="button" onClick={openRates} className={ratesButtonClass}>
                Rates
              </button>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              {!isPublicPage && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-gold-600 hover:bg-brand-gold-50 dark:text-gray-400 dark:hover:text-brand-gold-400 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {activeTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
              <Link to="/book" className="btn-primary text-sm py-2 px-4">
                Book Court
              </Link>
              <NotificationBell onNavigate={() => setDropdownOpen(false)} />
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full pl-1.5 pr-2.5 py-1 hover:bg-brand-gold-50 transition-colors border border-transparent hover:border-brand-gold-200"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                >
                  <Avatar user={user} profile={profile} size="sm" />
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-800 border border-brand-gold-200 dark:border-slate-700">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{profile?.full_name || 'Player'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50 dark:hover:bg-slate-700/50 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors"
                      >
                        <IconBadge icon={User} />
                        Profile
                      </Link>
                      <Link
                        to="/guide"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50 dark:hover:bg-slate-700/50 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors"
                      >
                        <IconBadge icon={BookOpen} variant="purple" />
                        Player guide
                      </Link>
                    </div>
                    <div className="border-t border-gray-50 dark:border-slate-700 py-1.5">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <IconBadge icon={LogOut} variant="red" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={signInClass}>
                Sign In
              </Link>
              <Link to="/book" className="btn-primary text-sm py-2 px-4">
                Book a Court
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2 ml-auto">
          {user && (
            <>
              {!isPublicPage && (
                <button
                  type="button"
                  className={menuIconClass}
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {activeTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              )}
              <NotificationBell onNavigate={() => setMenuOpen(false)} />
              <Link to="/book" className="btn-primary text-xs py-2 px-3">
                Book
              </Link>
            </>
          )}
          <button
            type="button"
            className={menuIconClass}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className={`md:hidden border-t max-h-[calc(100svh-4rem)] overflow-y-auto ${
            darkNav
              ? 'border-white/10 bg-brand-navy-900'
              : 'border-brand-gold-100 dark:border-slate-700 bg-white dark:bg-slate-900'
          }`}
        >
          {user ? (
            <>
              <div className={`px-4 py-3 flex items-center gap-3 border-b ${darkNav ? 'border-white/10' : 'border-gray-50 dark:border-slate-800'}`}>
                <Avatar user={user} profile={profile} size="lg" />
                <div className="min-w-0">
                  <p className={`font-semibold text-sm truncate ${darkNav ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                    {profile?.full_name || 'Player'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="px-3 py-3 flex flex-col gap-0.5">
                {AUTH_LINKS.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'bg-brand-gold-50 dark:bg-brand-navy-900/30 text-brand-navy-900 dark:text-brand-gold-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50/60 dark:hover:bg-slate-800/60 hover:text-brand-gold-600 dark:hover:text-brand-gold-400'
                    }`}
                  >
                    {link.emoji ? (
                      <span className="w-7 h-7 rounded-lg bg-brand-gold-50 dark:bg-brand-navy-900/30 flex items-center justify-center">
                        <AppEmoji name={link.emoji} size={18} />
                      </span>
                    ) : (
                      <IconBadge icon={link.icon} variant={link.iconVariant} />
                    )}
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50/60 dark:hover:bg-slate-800/60 hover:text-brand-gold-600 dark:hover:text-brand-gold-400"
                >
                  <IconBadge icon={User} />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                >
                  <IconBadge icon={LogOut} variant="red" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 py-4 flex flex-col gap-1">
              {PUBLIC_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    darkNav
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50/60 dark:hover:bg-slate-800/60 hover:text-brand-gold-600 dark:hover:text-brand-gold-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openRates}
                className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  darkNav
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50/60 dark:hover:bg-slate-800/60 hover:text-brand-gold-600 dark:hover:text-brand-gold-400'
                }`}
              >
                Rates
              </button>
              <div className="flex flex-col gap-2 mt-3 px-1">
                <Link to="/book" className="btn-primary text-center text-sm" onClick={() => setMenuOpen(false)}>
                  Book a Court
                </Link>
                <Link
                  to="/login"
                  className={`text-center text-sm font-semibold py-2 ${darkNav ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
