import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import Navbar from './components/Navbar'
import AdminNavbar from './components/AdminNavbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Home from './pages/Home'
import OpenPlay from './pages/OpenPlay'
import Notifications from './pages/Notifications'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import Book from './pages/Book'
import MyBookings from './pages/MyBookings'
import AdminDashboard from './pages/admin/Dashboard'
import BookChoose from './pages/BookChoose'
import ManageBookings from './pages/admin/ManageBookings'
import ManageKtv from './pages/admin/ManageKtv'
import ManageSlots from './pages/admin/ManageSlots'
import ManageUsers from './pages/admin/ManageUsers'
import ManageOpenPlay from './pages/admin/ManageOpenPlay'
import AdminGuide from './pages/admin/AdminGuide'
import Guide from './pages/Guide'
import BookKtv from './pages/BookKtv'
import AuthCallback from './pages/AuthCallback'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading…</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false, userOnly = false, skipOnboarding = false }) {
  const location = useLocation()
  const { user, profile, loading, isAdmin, needsOnboarding } = useAuth()
  if (loading || (user && !profile)) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ redirectTo: location.pathname, mode: 'login' }} />
  if (!skipOnboarding && needsOnboarding) return <Navigate to="/onboarding" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/home" replace />
  if (userOnly && isAdmin) return <Navigate to="/admin" replace />
  return children
}

function GuestRoute({ children }) {
  const location = useLocation()
  const { user, profile, loading, needsOnboarding, isAdmin } = useAuth()
  if (loading || (user && !profile)) return <Spinner />
  if (user) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace state={location.state} />
    const redirectTo = location.state?.redirectTo
    if (redirectTo && !isAdmin) return <Navigate to={redirectTo} replace />
    return <Navigate to={isAdmin ? '/admin' : '/home'} replace />
  }
  return children
}

import { useEffect } from 'react'

function AppShell() {
  const location = useLocation()
  const { theme } = useTheme()
  const hideChrome = location.pathname === '/onboarding' || location.pathname === '/auth/callback'
  const isAdminArea = location.pathname.startsWith('/admin')
  const isLandingPage = location.pathname === '/'

  // Landing keeps its own fixed light palette; every other page follows the toggle.
  const activeTheme = isLandingPage ? 'light' : theme

  useEffect(() => {
    const root = document.documentElement
    if (activeTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [activeTheme])

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isAdminArea ? 'admin-shell admin-page' : ''}`}
      style={isAdminArea ? undefined : { 
        background: activeTheme === 'dark' 
          ? 'linear-gradient(160deg, #0a1220 0%, #152238 40%, #1c2f4d 100%)' 
          : 'linear-gradient(160deg, #faf8f3 0%, #ffffff 40%, #f3ead4 100%)' 
      }}
    >
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: activeTheme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            color: activeTheme === 'dark' ? '#f8fafc' : '#1f2937',
            borderRadius: '1rem',
            boxShadow: activeTheme === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.08)',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: activeTheme === 'dark' ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid rgba(243, 244, 246, 0.8)'
          },
          success: {
            iconTheme: {
              primary: '#c9a227',
              secondary: activeTheme === 'dark' ? '#0f172a' : '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: activeTheme === 'dark' ? '#0f172a' : '#fff',
            },
          },
        }}
      />
      {!hideChrome && (isAdminArea ? <AdminNavbar /> : <Navbar />)}
      <main className={`flex-1 w-full min-w-0 ${isAdminArea ? 'overflow-x-clip' : ''}`}>
        <Outlet />
      </main>
      {!hideChrome && !isAdminArea && <Footer />}
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <GuestRoute><Landing /></GuestRoute> },
      { path: '/ktv', element: <ProtectedRoute userOnly><BookKtv /></ProtectedRoute> },
      { path: '/home', element: <ProtectedRoute userOnly><Home /></ProtectedRoute> },
      { path: '/open-play', element: <ProtectedRoute userOnly><OpenPlay /></ProtectedRoute> },
      { path: '/notifications', element: <ProtectedRoute userOnly><Notifications /></ProtectedRoute> },
      { path: '/login', element: <GuestRoute><Login /></GuestRoute> },
      { path: '/auth/callback', element: <AuthCallback /> },
      { path: '/onboarding', element: <ProtectedRoute skipOnboarding userOnly><Onboarding /></ProtectedRoute> },
      { path: '/profile', element: <ProtectedRoute userOnly><Profile /></ProtectedRoute> },
      { path: '/book', element: <ProtectedRoute userOnly><BookChoose /></ProtectedRoute> },
      { path: '/book/court', element: <ProtectedRoute userOnly><Book /></ProtectedRoute> },
      { path: '/my-bookings', element: <ProtectedRoute userOnly><MyBookings /></ProtectedRoute> },
      { path: '/guide', element: <ProtectedRoute userOnly><Guide /></ProtectedRoute> },
      { path: '/admin', element: <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute> },
      { path: '/admin/bookings', element: <ProtectedRoute adminOnly><ManageBookings /></ProtectedRoute> },
      { path: '/admin/ktv', element: <ProtectedRoute adminOnly><ManageKtv /></ProtectedRoute> },
      { path: '/admin/slots', element: <ProtectedRoute adminOnly><ManageSlots /></ProtectedRoute> },
      { path: '/admin/users', element: <ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute> },
      { path: '/admin/open-play', element: <ProtectedRoute adminOnly><ManageOpenPlay /></ProtectedRoute> },
      { path: '/admin/guide', element: <ProtectedRoute adminOnly><AdminGuide /></ProtectedRoute> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
