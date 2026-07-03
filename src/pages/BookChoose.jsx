import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import AppEmoji from '../components/ui/AppEmoji'
import { SITE } from '../config/site'
import { fadeUp, scaleIn, stagger, transition } from '../lib/motion'

const OPTIONS = [
  {
    to: '/book/court',
    emoji: 'court',
    title: 'Book a Court',
    subtitle: 'Pickleball',
    detail: `${SITE.venue.courtCount} courts · auto-assigned · time-of-day rates`,
    hours: SITE.venue.hoursLabel,
    tone: 'court',
  },
  {
    to: '/book/ktv',
    emoji: 'microphone',
    title: 'Book a KTV',
    subtitle: 'Karaoke',
    detail: `${SITE.ktv.roomCount} private rooms · auto-assigned · ₱${SITE.ktv.ratePerHour}/hr flat`,
    hours: SITE.ktv.hoursLabel,
    tone: 'ktv',
  },
]

export default function BookChoose() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        className="mb-8 text-center sm:text-left"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={transition.page}
      >
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          What do you want to <span className="gradient-text">book</span>?
        </h1>
        <p className="text-gray-400 mt-2 text-sm leading-relaxed">
          Two different experiences — pickleball courts or private KTV rooms. Same QR payment either way.
        </p>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={stagger(0.08, 0.06)}
      >
        {OPTIONS.map(option => {
          const isKtv = option.tone === 'ktv'
          return (
            <motion.div key={option.to} variants={scaleIn} transition={transition.page}>
              <Link
                to={option.to}
                className={`group card p-5 sm:p-6 flex flex-col gap-4 h-full transition-all ${
                  isKtv
                    ? 'ktv-party-surface hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md hover:shadow-violet-500/10 border-violet-100 dark:border-violet-900/40'
                    : 'hover:border-brand-gold-300 dark:hover:border-brand-gold-700 hover:shadow-md'
                }`}
              >
                <div className={isKtv ? 'ktv-party-content flex flex-col gap-4 h-full' : 'contents'}>
                <motion.span
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isKtv
                      ? 'bg-white/90 dark:bg-slate-900/80 border-violet-200/80 dark:border-violet-800/50 shadow-sm'
                      : 'bg-brand-gold-50 dark:bg-brand-navy-900/40 border-brand-gold-200/70 dark:border-brand-navy-700/50'
                  }`}
                  whileHover={{ scale: 1.06 }}
                  transition={transition.hover}
                >
                  <AppEmoji name={option.emoji} size={28} />
                </motion.span>
                <div className={`min-w-0 flex-1 ${isKtv ? 'ktv-party-panel rounded-xl px-3 py-2 -mx-1' : ''}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${
                    isKtv
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-brand-gold-600 dark:text-brand-gold-400'
                  }`}>
                    {option.subtitle}
                  </p>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-tight">
                    {option.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-snug">
                    {option.detail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{option.hours}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all ${
                  isKtv
                    ? 'text-violet-700 dark:text-violet-300'
                    : 'text-brand-gold-600 dark:text-brand-gold-400'
                }`}>
                  Continue
                  <ArrowRight size={16} strokeWidth={2.5} />
                </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
