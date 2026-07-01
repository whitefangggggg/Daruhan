import {
  AlertTriangle,
  Ban,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  Home,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Search,
  Settings,
  User,
  X,
  XCircle,
} from 'lucide-react'

const SIZES = { xs: 14, sm: 16, md: 18, lg: 20, xl: 24, '2xl': 28 }

export function Icon({ icon: IconComponent, size = 'md', className = '', strokeWidth = 2, ...props }) {
  return (
    <IconComponent
      size={SIZES[size] ?? size}
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    />
  )
}

const BADGE_VARIANTS = {
  default: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300',
  green: 'bg-brand-gold-50 text-brand-gold-500',
  red: 'bg-red-50 text-red-500',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function IconBadge({ icon: IconComponent, variant = 'default', size = 'sm', className = '' }) {
  return (
    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${BADGE_VARIANTS[variant]} ${className}`}>
      <Icon icon={IconComponent} size={size} />
    </span>
  )
}

export function StatusMessage({ type = 'error', children, className = '' }) {
  const IconComponent = type === 'error' ? AlertTriangle : CheckCircle2
  const styles = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-600'
    : 'bg-brand-gold-50 border-brand-gold-200 text-brand-gold-600'

  return (
    <div className={`flex items-start gap-2 border rounded-xl p-3 text-sm ${styles} ${className}`}>
      <Icon icon={IconComponent} size="sm" className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}

export {
  AlertTriangle,
  Ban,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  Home,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Search,
  Settings,
  User,
  X,
  XCircle,
}
