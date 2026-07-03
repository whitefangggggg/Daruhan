import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AppEmoji from '../components/ui/AppEmoji'
import { SITE } from '../config/site'

const OPTIONS = [
  {
    to: '/book/court',
    emoji: 'court',
    title: 'Book a Court',
    subtitle: 'Pickleball courts',
    detail: `${SITE.venue.courtCount} courts · auto-assigned · time-of-day rates`,
    hours: SITE.venue.hoursLabel,
  },
  {
    to: '/ktv',
    emoji: 'microphone',
    title: 'Book a KTV',
    subtitle: 'Private karaoke rooms',
    detail: `${SITE.ktv.roomCount} rooms · auto-assigned · ₱${SITE.ktv.ratePerHour}/hr flat`,
    hours: SITE.ktv.hoursLabel,
  },
]

export default function BookChoose() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          What do you want to <span className="gradient-text">book</span>?
        </h1>
        <p className="text-gray-400 mt-2 text-sm leading-relaxed">
          Choose pickleball or KTV — same QR payment, staff confirms after you send your reference.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(option => (
          <Link
            key={option.to}
            to={option.to}
            className="group card p-5 sm:p-6 flex flex-col gap-4 hover:border-brand-gold-300 dark:hover:border-brand-gold-700 hover:shadow-md transition-all"
          >
            <span className="w-12 h-12 rounded-2xl bg-brand-gold-50 dark:bg-brand-navy-900/40 border border-brand-gold-200/70 dark:border-brand-navy-700/50 flex items-center justify-center">
              <AppEmoji name={option.emoji} size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 dark:text-brand-gold-400">
                {option.subtitle}
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-tight">
                {option.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-snug">
                {option.detail}
              </p>
              <p className="text-xs text-gray-400 mt-2">{option.hours}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold-600 dark:text-brand-gold-400 group-hover:gap-2.5 transition-all">
              Continue
              <ArrowRight size={16} strokeWidth={2.5} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
