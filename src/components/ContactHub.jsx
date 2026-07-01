import { motion } from 'framer-motion'
import { CONTACT, SITE } from '../lib/constants'
import { transition } from '../lib/motion'
import { MapPin, MessageCircle, Navigation, Search } from './ui/Icon'

export default function ContactHub() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-[2rem] border border-brand-gold-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-brand-gold-100/50 dark:shadow-none overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        <div className="px-8 py-8 sm:px-10 sm:py-10 flex flex-col gap-6">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-gold-500">Find Us</p>

          <div className="flex gap-3 items-start">
            <MapPin size={18} className="flex-shrink-0 mt-0.5 text-brand-gold-500" />
            <div className="text-sm leading-relaxed">
              <p className="font-bold text-gray-900 dark:text-white">{CONTACT.address}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">{CONTACT.addressNote}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{SITE.venue.hoursLabel} · {SITE.venue.hoursDetail}</p>
              {SITE.venue.parkingLabel && <p className="text-gray-500 dark:text-gray-400 mt-1">{SITE.venue.parkingLabel}</p>}
              <p className="text-gray-500 dark:text-gray-400 mt-1">{SITE.venue.courtCount} pickleball courts</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {CONTACT.waze && (
              <a
                href={CONTACT.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] inline-flex items-center justify-between gap-2 text-[11px] font-bold tracking-wide uppercase px-4 py-3 rounded-full border border-brand-gold-200/70 bg-brand-gold-50/50 hover:bg-brand-gold-50 text-brand-navy-900 dark:text-white dark:border-slate-600 dark:bg-slate-700/40 transition-colors"
              >
                <span className="flex items-center gap-2"><Navigation size={12} /> Waze</span>
                <span className="text-sm font-light">→</span>
              </a>
            )}
            {CONTACT.maps && (
              <a
                href={CONTACT.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] inline-flex items-center justify-between gap-2 text-[11px] font-bold tracking-wide uppercase px-4 py-3 rounded-full border border-brand-gold-200/70 bg-brand-gold-50/50 hover:bg-brand-gold-50 text-brand-navy-900 dark:text-white dark:border-slate-600 dark:bg-slate-700/40 transition-colors"
              >
                <span className="flex items-center gap-2"><Search size={12} /> Google Maps</span>
                <span className="text-sm font-light">→</span>
              </a>
            )}
          </div>
        </div>

        <div className="px-8 py-8 sm:px-10 sm:py-10 bg-gradient-to-br from-brand-gold-50 via-brand-cream to-white dark:from-slate-800/80 dark:via-slate-800 dark:to-slate-900 border-t lg:border-t-0 lg:border-l border-brand-gold-200/80 dark:border-slate-700 flex flex-col gap-6 justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-gold-500 mb-5">Get in Touch</p>
            <div className="space-y-3">
              {CONTACT.phone && (
                <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors group">
                  <span className="w-9 h-9 rounded-full border border-brand-gold-200/60 bg-brand-gold-50 dark:bg-slate-700/50 flex items-center justify-center text-brand-gold-600 dark:text-brand-gold-400 flex-shrink-0 text-sm group-hover:border-brand-gold-400 transition-colors">☎</span>
                  <span className="font-semibold">{CONTACT.phoneDisplay || CONTACT.phone}</span>
                </a>
              )}
              {CONTACT.email && (
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors group">
                  <span className="w-9 h-9 rounded-full border border-brand-gold-200/60 bg-brand-gold-50 dark:bg-slate-700/50 flex items-center justify-center text-brand-gold-600 dark:text-brand-gold-400 flex-shrink-0 text-sm group-hover:border-brand-gold-400 transition-colors">✉</span>
                  <span className="font-semibold break-all">{CONTACT.email}</span>
                </a>
              )}
              {CONTACT.messenger && (
                <a href={CONTACT.messenger} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 transition-colors group">
                  <span className="w-9 h-9 rounded-full border border-brand-gold-200/60 bg-brand-gold-50 dark:bg-slate-700/50 flex items-center justify-center text-brand-gold-600 dark:text-brand-gold-400 flex-shrink-0 group-hover:border-brand-gold-400 transition-colors">
                    <MessageCircle size={15} />
                  </span>
                  <span className="font-semibold">{CONTACT.messengerLabel || 'Message on Facebook'}</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Questions about bookings, directions, or the venue? We&apos;re happy to help.
            </p>
            <motion.a
              href={CONTACT.messenger || CONTACT.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2.5 font-bold text-sm py-3.5 rounded-2xl"
              style={{ boxShadow: '0 8px 24px rgba(201,162,39,0.35)' }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              transition={transition.hover}
            >
              <MessageCircle size={18} />
              {CONTACT.messengerLabel}
            </motion.a>
          </div>
        </div>

      </div>
    </div>
  )
}
