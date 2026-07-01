import { Link } from 'react-router-dom'
import { CONTACT, SITE } from '../lib/constants'
import BrandLogo from './BrandLogo'
import { MapPin, MessageCircle } from './ui/Icon'

const YEAR = new Date().getFullYear()

const EXPLORE_LINKS = [
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

const BOOKING_LINKS = [
  { label: 'Book a Court', to: '/book' },
  { label: 'Sign In', to: '/login' },
  { label: 'My Bookings', to: '/my-bookings' },
  { label: 'Player Guide', to: '/guide' },
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-gold-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-brand-gold-50 dark:from-slate-900/50 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <BrandLogo alt="" size="w-12 h-12" variant="plain" />
              <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight group-hover:text-brand-gold-600 dark:group-hover:text-brand-gold-400 transition-colors">
                {SITE.name}
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-xs">
              {SITE.copy.footerBlurb}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Explore</p>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Book</p>
            <ul className="space-y-2.5">
              {BOOKING_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Visit</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex items-start gap-2">
              <MapPin size={16} className="text-brand-gold-500 flex-shrink-0 mt-0.5" />
              <span>
                {CONTACT.address}
                <span className="block text-xs text-gray-400 mt-0.5">{CONTACT.addressNote}</span>
              </span>
            </p>
            {CONTACT.phone && (
              <a
                href={`tel:${CONTACT.phone}`}
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-gold-600 dark:hover:text-brand-gold-300 transition-colors"
              >
                <span aria-hidden>📞</span>
                {CONTACT.phoneDisplay || CONTACT.phone}
              </a>
            )}
            {CONTACT.email && (
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-gold-600 dark:hover:text-brand-gold-300 transition-colors break-all"
              >
                <span aria-hidden>✉</span>
                {CONTACT.email}
              </a>
            )}
            <a
              href={CONTACT.messenger || CONTACT.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-gold-600 dark:hover:text-brand-gold-300 transition-colors"
            >
              <MessageCircle size={16} />
              {CONTACT.messengerLabel || 'Message on Facebook'}
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-brand-gold-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-gray-400">
            © {YEAR} {SITE.legalName}. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            {SITE.venue.cityLine} · {SITE.venue.hoursLabel}
          </p>
        </div>
        <p className="text-center text-[10px] text-gray-400/80 mt-4">
          Need a booking platform like this?{' '}
          <a
            href="https://www.facebook.com/whitefangggg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 underline-offset-2 hover:underline transition-colors"
          >
            Hire the developer
          </a>
        </p>
      </div>
    </footer>
  )
}
