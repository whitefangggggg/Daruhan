import { CONTACT, SITE } from '../lib/constants'
import { MapPin, MessageCircle, Navigation, Search } from './ui/Icon'

export default function FindUsCard({ variant = 'dark', className = '' }) {
  const isDark = variant === 'dark'

  const shell = isDark
    ? 'bg-[#0f1a2e]/80 backdrop-blur-xl border-white/10 text-white'
    : 'bg-white dark:bg-slate-800 border-brand-gold-200/80 dark:border-slate-700 shadow-lg shadow-brand-gold-100/40 dark:shadow-none'

  const labelClass = isDark
    ? 'text-brand-gold-300'
    : 'text-brand-gold-600 dark:text-brand-gold-400'

  const addressSub = isDark ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'

  const linkClass = isDark
    ? 'text-brand-gold-100 hover:text-brand-gold-200'
    : 'text-gray-700 dark:text-gray-200 hover:text-brand-gold-600 dark:hover:text-brand-gold-400'

  const iconShell = isDark
    ? 'border-white/10 bg-white/5 text-brand-gold-300'
    : 'border-brand-gold-200/60 bg-brand-gold-50 dark:bg-slate-700/50 text-brand-gold-600 dark:text-brand-gold-400'

  const divider = isDark ? 'border-white/10' : 'border-brand-gold-100 dark:border-slate-700'

  const mapBtn = isDark
    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
    : 'border-brand-gold-200/70 bg-brand-gold-50/50 hover:bg-brand-gold-50 text-brand-navy-900 dark:text-white dark:border-slate-600 dark:bg-slate-700/40'

  return (
    <div
      className={`rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8 text-left border ${shell} ${className}`}
      style={isDark ? { boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } : undefined}
    >
      <p className={`text-[11px] font-extrabold uppercase tracking-[0.2em] mb-6 ${labelClass}`}>
        Find Us
      </p>

      <div className="space-y-5">
        <div className="flex gap-3 items-start">
          <MapPin size={18} className={`flex-shrink-0 mt-0.5 ${labelClass}`} />
          <div className="min-w-0 text-[14px] leading-relaxed">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {CONTACT.address}
            </p>
            {CONTACT.addressNote ? (
              <p className={`mt-1 ${addressSub}`}>{CONTACT.addressNote}</p>
            ) : null}
            <p className={`mt-2 text-[13px] ${addressSub}`}>
              {SITE.venue.hoursLabel}
              {SITE.venue.hoursDetail ? ` · ${SITE.venue.hoursDetail}` : ''}
            </p>
            {SITE.venue.parkingLabel ? (
              <p className={`mt-1 text-[13px] ${addressSub}`}>{SITE.venue.parkingLabel}</p>
            ) : null}
            <p className={`mt-1 text-[13px] ${addressSub}`}>
              {SITE.venue.courtCount} pickleball courts
            </p>
          </div>
        </div>

        {(CONTACT.phone || CONTACT.email || CONTACT.messenger) && (
          <div className={`space-y-2.5 border-t pt-4 ${divider}`}>
            {CONTACT.phone && (
              <a href={`tel:${CONTACT.phone}`} className={`flex items-center gap-3 text-[14px] transition-colors ${linkClass}`}>
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-sm ${iconShell}`} aria-hidden>
                  ☎
                </span>
                <span className="font-medium">{CONTACT.phoneDisplay || CONTACT.phone}</span>
              </a>
            )}
            {CONTACT.email && (
              <a href={`mailto:${CONTACT.email}`} className={`flex items-center gap-3 text-[14px] transition-colors ${linkClass}`}>
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-sm ${iconShell}`} aria-hidden>
                  ✉
                </span>
                <span className="font-medium break-all">{CONTACT.email}</span>
              </a>
            )}
            {CONTACT.messenger && (
              <a
                href={CONTACT.messenger}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 text-[14px] transition-colors ${linkClass}`}
              >
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${iconShell}`}>
                  <MessageCircle size={16} />
                </span>
                <span className="font-medium">{CONTACT.messengerLabel || 'Message on Messenger'}</span>
              </a>
            )}
          </div>
        )}

        {(CONTACT.waze || CONTACT.maps) && (
          <div className={`flex flex-col sm:flex-row gap-2.5 border-t pt-4 ${divider}`}>
            {CONTACT.waze && (
              <a
                href={CONTACT.waze}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-1 items-center justify-between text-[11px] font-bold tracking-wide uppercase px-4 py-3 rounded-full border transition-all ${mapBtn}`}
              >
                <span className="flex items-center gap-2"><Navigation size={12} /> Waze</span>
                <span className="text-[14px] font-light">→</span>
              </a>
            )}
            {CONTACT.maps && (
              <a
                href={CONTACT.maps}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-1 items-center justify-between text-[11px] font-bold tracking-wide uppercase px-4 py-3 rounded-full border transition-all ${mapBtn}`}
              >
                <span className="flex items-center gap-2"><Search size={12} /> Google Maps</span>
                <span className="text-[14px] font-light">→</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
