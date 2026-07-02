import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useMobileMenu } from '../hooks/useMobileMenu'
import { supabase } from '../lib/supabaseClient'
import Avatar from './Avatar'
import BrandLogo from './BrandLogo'
import { SITE } from '../config/site'
import { IconBadge, LogOut, ClipboardList, Menu, X, ChevronDown } from './ui/Icon'
import { Ban, BookOpen, LayoutDashboard, Users, UsersRound, Moon, Sun } from 'lucide-react'
import { transition } from '../lib/motion'

const ADMIN_LINKS = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Open Play', to: '/admin/open-play', icon: UsersRound },
  { label: 'Block Hours', to: '/admin/slots', icon: Ban },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Guide', to: '/admin/guide', icon: BookOpen },
]

const ADMIN_MOBILE_MENU_ID = 'admin-mobile-nav'

function AdminNavLink({ to, label, isActive, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300 hover:text-brand-gold-600'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="admin-nav-pill"
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #1c2f4d, #c9a227)',
            boxShadow: '0 4px 14px rgba(201, 162, 39, 0.32)',
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </Link>
  )
}

export default function AdminNavbar() {
  const { user, profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const menuButtonRef = useRef(null)

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false)
    requestAnimationFrame(() => menuButtonRef.current?.focus())
  }, [])

  const { menuRef, close: closeMenu } = useMobileMenu(menuOpen, handleCloseMenu)

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
    setDropdownOpen(false)
  }, [location.pathname])

  async function handleSignOut() {
    setDropdownOpen(false)
    setMenuOpen(false)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  function linkIsActive(link) {
    if (link.exact) return location.pathname === link.to
    return location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)
  }

  function toggleMobileMenu() {
    setMenuOpen(open => !open)
  }

  return (
    <nav
      className="sticky top-0 z-50 nav-safe-top border-b border-brand-gold-200/60 dark:border-brand-navy-700/60"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(180deg, rgba(15,26,46,0.92) 0%, rgba(10,18,32,0.85) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(250,246,235,0.85) 100%)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      }}
    >
      <div className="max-w-6xl mx-auto nav-safe-x h-14 flex items-center gap-2 sm:gap-3">
        <Link to="/admin" className="flex items-center gap-2 group flex-shrink-0 min-h-[2.75rem]">
          <BrandLogo alt={SITE.name} size="xs" variant="light" />
          <span className="admin-display text-gray-900 dark:text-white text-[15px] hidden sm:inline">
            {SITE.name}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-widest text-white px-1.5 py-0.5 rounded-md hidden sm:inline"
            style={{ background: 'linear-gradient(135deg, #1c2f4d, #c9a227)' }}
          >
            Admin
          </span>
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-center gap-0.5 bg-white/60 dark:bg-slate-800/60 border border-brand-gold-200/60 dark:border-brand-navy-700/60 rounded-2xl p-1">
          {ADMIN_LINKS.map(link => (
            <AdminNavLink
              key={link.to}
              to={link.to}
              label={link.label}
              isActive={linkIsActive(link)}
            />
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-auto">
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-icon-btn rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-gold-600 hover:bg-gray-100/80 dark:hover:bg-slate-800 dark:hover:text-brand-gold-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-gray-100/80 dark:hover:bg-slate-800 transition-colors"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              <Avatar user={user} profile={profile} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate hidden lg:inline">
                {profile?.full_name || 'Admin'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={transition.fast}
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{profile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <IconBadge icon={LogOut} variant="red" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="md:hidden nav-icon-btn text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-slate-800 ml-auto"
          onClick={toggleMobileMenu}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls={ADMIN_MOBILE_MENU_ID}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="nav-mobile-backdrop md:hidden"
          aria-label="Close menu"
          onClick={closeMenu}
          tabIndex={-1}
        />
      )}

      {menuOpen && (
        <motion.div
          ref={menuRef}
          id={ADMIN_MOBILE_MENU_ID}
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={transition.fast}
          className="md:hidden relative z-50 border-t border-gray-100 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md nav-mobile-drawer nav-mobile-drawer--compact"
        >
          <div className="px-3 py-3 flex flex-col gap-0.5">
            {ADMIN_LINKS.map(link => {
              const IconComponent = link.icon
              const active = linkIsActive(link)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`nav-mobile-link gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-brand-navy-900 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <IconBadge icon={IconComponent} variant={active ? 'default' : 'green'} />
                  {link.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={toggleTheme}
              className="nav-mobile-link gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-brand-gold-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="nav-icon-btn hover:bg-brand-gold-50 dark:hover:bg-slate-800/50 text-gray-600 dark:text-gray-300">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </span>
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="nav-mobile-link gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
            >
              <IconBadge icon={LogOut} variant="red" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
