import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon as Iconify } from '@iconify/react'
import BrandLogo from '../components/BrandLogo'
import { SITE } from '../lib/constants'
import { THEME } from '../config/theme'
import AppEmoji from '../components/ui/AppEmoji'
import ContactHub from '../components/ContactHub'
import { Coins, X } from '../components/ui/Icon'
import MotionIn, { MotionStagger, MotionItem } from '../components/MotionIn'
import { fadeUp, transition } from '../lib/motion'
import { RATE_BRACKETS } from '../lib/pricing'
import HeroAtmosphere from '../components/hero/HeroAtmosphere'
import VenueGallery from '../components/VenueGallery'

// ── Pricing modal ─────────────────────────────────────────────────────────────
const LANDING_RATE_STYLES = {
  daytime: { emoji: 'morning', grad: 'from-yellow-400 to-amber-400', border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-900' },
  lateNight: { emoji: 'night', grad: 'from-slate-600 to-slate-800', border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-900' },
}

const RATES = RATE_BRACKETS.map(row => ({
  label: row.label,
  time: row.time.replace('NN', 'N'),
  rate: `₱${row.rate}`,
  ...LANDING_RATE_STYLES[row.themeId],
}))

function PricingModal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.fast}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={transition.medium}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ background: THEME.gradients.navy }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">Court Rates</h2>
              <p className="text-brand-gold-200 text-sm mt-0.5">Per hour · billed by time bracket</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 space-y-3">
          <MotionStagger className="space-y-3" staggerChildren={0.08} delayChildren={0.12} animateOnMount>
            {RATES.map(r => (
              <MotionItem key={r.label}>
                <div className={`flex items-center gap-4 rounded-2xl border p-4 ${r.bg} ${r.border}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${r.grad} shadow-sm flex-shrink-0`}>
                    <AppEmoji name={r.emoji} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${r.text}`}>{r.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.time}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-extrabold text-gray-900 dark:text-white">{r.rate}</p>
                    <p className="text-xs text-gray-400">/hr</p>
                  </div>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
          <motion.p
            className="text-xs text-gray-400 text-center leading-relaxed px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transition.slow, delay: 0.55 }}
          >
            Bookings spanning multiple brackets are billed per hour. Total shown before you confirm.
          </motion.p>
          <motion.button
            onClick={onClose}
            className="btn-primary w-full text-sm"
            style={{ padding: '0.75rem' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition.medium, delay: 0.65 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
          >
            Got it
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-brand-gold-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2 text-center">
      <span className="w-6 h-px bg-brand-gold-300 shrink-0" />
      {children}
      <span className="w-6 h-px bg-brand-gold-300 shrink-0" />
    </p>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const [showPricing, setShowPricing] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (location.state?.openPricing) {
      setShowPricing(true)
      navigate(location.pathname + location.hash, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, location.hash, navigate])

  useEffect(() => {
    function openPricing() {
      setShowPricing(true)
    }
    window.addEventListener(`${SITE.storagePrefix}:open-pricing`, openPricing)
    return () => window.removeEventListener(`${SITE.storagePrefix}:open-pricing`, openPricing)
  }, [])

  return (
    <div className="overflow-x-hidden">
      <AnimatePresence>
        {showPricing && <PricingModal key="pricing-modal" onClose={() => setShowPricing(false)} />}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[calc(100svh-4rem)] flex flex-col justify-center overflow-x-hidden overflow-y-clip"
        style={{ background: THEME.gradients.hero }}
      >
        <HeroAtmosphere />

        <MotionStagger
          className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-28 sm:pb-32 lg:pb-36 flex flex-col items-center justify-center text-center gap-4 lg:gap-5 min-h-0"
          staggerChildren={0.08}
          delayChildren={0.06}
          animateOnMount
        >
          <div className="flex flex-col items-center gap-3 lg:gap-4 w-full max-w-2xl mx-auto min-w-0">
            <MotionItem>
              <div className="mb-1 inline-block">
                <BrandLogo
                  alt={SITE.name}
                  size="lg"
                  variant="dark"
                  className="!w-24 !h-24 sm:!w-28 sm:!h-28 lg:!w-32 lg:!h-32"
                />
              </div>
            </MotionItem>

            <MotionItem>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] text-brand-gold-300 mb-1.5 lg:mb-2">
                {SITE.tagline}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.15rem] font-extrabold tracking-tight leading-[1.05] text-balance">
                <span className="block text-white">{SITE.copy.heroLine1}</span>
                <span className="block mt-1">
                  <span className="text-white">{SITE.copy.heroLine2Prefix}</span>
                  <span
                    className="bg-gradient-to-r from-brand-gold-200 via-brand-gold-400 to-brand-gold-300 bg-clip-text text-transparent"
                    style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {SITE.copy.heroLine2Accent}
                  </span>
                </span>
              </h1>
            </MotionItem>

            <div className="flex flex-col items-center gap-3 w-full mt-0.5">
              <MotionItem className="w-full">
                <p className="text-base sm:text-lg font-semibold leading-snug text-brand-gold-200">
                  {SITE.copy.heroTagline}
                </p>
              </MotionItem>
              <MotionItem className="w-full">
                <p className="text-sm md:text-[0.95rem] font-medium max-w-md leading-relaxed mx-auto text-white/80">
                  {SITE.copy.heroSubtitle}
                </p>
              </MotionItem>
              <MotionItem className="w-full">
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center flex-wrap">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }} transition={transition.hover}>
                    <Link
                      to="/book"
                      className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto font-bold shadow-xl px-6 py-3 sm:px-7 sm:py-3 text-sm sm:text-base"
                      style={{ boxShadow: THEME.shadow.goldLg }}
                    >
                      <Iconify icon="noto:ping-pong" width={20} height={20} />
                      Book now
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }} transition={transition.hover}>
                    <Link
                      to="/ktv"
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto font-bold px-6 py-3 sm:px-7 sm:py-3 text-sm sm:text-base rounded-full text-white"
                      style={{
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Iconify icon="noto:microphone" width={20} height={20} />
                      Book a KTV Room
                    </Link>
                  </motion.div>
                </div>
              </MotionItem>
              <MotionItem className="w-full">
                <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                  <motion.button
                    onClick={() => setShowPricing(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gold-300 hover:text-brand-gold-200 transition-colors"
                    whileTap={{ scale: 0.97 }}
                    transition={transition.hover}
                  >
                    <Coins size={15} /> See court prices
                  </motion.button>
                  <span className="w-px h-4 bg-white/20 hidden sm:block" aria-hidden />
                  <motion.a
                    href="#about"
                    className="relative inline-flex items-center gap-2 text-xs sm:text-sm font-black rounded-full px-5 py-2 overflow-hidden"
                    style={{
                      background: 'linear-gradient(100deg, #c9a227 0%, #f0d060 35%, #e8a020 65%, #c9a227 100%)',
                      backgroundSize: '200% 100%',
                      color: '#0f1a2e',
                      boxShadow: '0 0 18px rgba(201,162,39,0.55), 0 0 40px rgba(201,162,39,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      boxShadow: [
                        '0 0 18px rgba(201,162,39,0.55), 0 0 40px rgba(201,162,39,0.25)',
                        '0 0 28px rgba(240,208,96,0.85), 0 0 60px rgba(201,162,39,0.45)',
                        '0 0 18px rgba(201,162,39,0.55), 0 0 40px rgba(201,162,39,0.25)',
                      ],
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    whileHover={{ scale: 1.07, boxShadow: '0 0 36px rgba(240,208,96,0.9), 0 0 70px rgba(201,162,39,0.5)' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <motion.span
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)' }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
                      aria-hidden
                    />
                    <span className="relative z-10 tracking-wide">But wait, there&apos;s more</span>
                    <motion.span
                      className="relative z-10 text-base"
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                    >↓</motion.span>
                  </motion.a>
                </div>
              </MotionItem>
              <MotionItem className="hidden xl:block w-full mt-2">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white border backdrop-blur-md"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.18)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-brand-gold-300 animate-pulse shadow-[0_0_10px_rgba(212,188,106,0.8)]" aria-hidden />
                  {SITE.venue.openingSoon
                    ? SITE.venue.openingSoonLabel
                    : `${SITE.venue.cityLine} · ${SITE.venue.hoursLabel}`}
                </div>
              </MotionItem>
            </div>
          </div>
        </MotionStagger>

        <MotionIn
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1] leading-[0]"
          variants={fadeUp}
          animateOnMount
          delay={700}
          transition={{ ...transition.slow, duration: 1 }}
        >
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="block w-full h-[4.5rem] sm:h-24 md:h-28" fill="#faf8f3" aria-hidden>
            <path d="M0,55 C360,95 720,15 1080,55 C1260,75 1380,65 1440,58 L1440,80 L0,80 Z" />
          </svg>
        </MotionIn>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────────────── */}
      <section id="about" className="relative z-0 -mt-px bg-brand-cream py-20 px-4 scroll-mt-20">
        <MotionIn className="max-w-3xl mx-auto text-center mb-14" amount={0} once={false}>
          <SectionLabel>{SITE.copy.aboutSectionLabel}</SectionLabel>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-[1.06] tracking-tight">
            {SITE.copy.aboutHeadlineLine1}{' '}
            <span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #c9a227 0%, #e8d5a3 45%, #b8922a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {SITE.copy.aboutHeadlineAccent}
            </span>
          </h2>
          <motion.p
            className="relative inline-flex items-center justify-center gap-2 mt-6 text-lg sm:text-xl font-black tracking-wide"
            animate={{
              textShadow: [
                '0 0 14px rgba(201,162,39,0.45), 0 0 32px rgba(201,162,39,0.2)',
                '0 0 28px rgba(240,208,96,0.85), 0 0 56px rgba(201,162,39,0.45)',
                '0 0 14px rgba(201,162,39,0.45), 0 0 32px rgba(201,162,39,0.2)',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.span
              className="inline-block"
              style={{
                background: 'linear-gradient(100deg, #c9a227 0%, #f0d060 35%, #e8a020 65%, #c9a227 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Scroll down further!
            </motion.span>
            <motion.span
              className="text-brand-gold-400 text-xl"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            >
              ↓
            </motion.span>
          </motion.p>
        </MotionIn>

        <div className="max-w-5xl mx-auto">
          <MotionIn animateOnMount={false} amount={0} once={false}>
            <motion.div
              className="relative rounded-3xl overflow-hidden p-7 md:p-10 min-h-[180px] flex flex-col justify-between"
              style={{ background: THEME.gradients.navy }}
            >
              <span
                className="absolute right-6 top-2 font-extrabold leading-none select-none pointer-events-none"
                style={{ fontSize: '11rem', color: 'rgba(255,255,255,0.04)' }}
                aria-hidden
              >01</span>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-gold-400/20 border border-brand-gold-400/30 px-3 py-1 text-xs font-bold text-brand-gold-300 uppercase tracking-wider mb-4">
                  <Iconify icon="noto:ping-pong" width={14} height={14} /> The main event
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight">Pickleball Courts</h3>
                <p className="text-brand-gold-100/70 text-sm max-w-sm leading-relaxed">
                  Four courts — reserve online and rally with friends, leagues, or your regular squad.
                </p>
              </div>
              <span className="text-brand-gold-400/50 text-xs font-semibold mt-6 block">
                {SITE.venue.courtCount} courts · {SITE.venue.hoursLabel}
              </span>
            </motion.div>
          </MotionIn>
        </div>
      </section>

      {/* ── EXPERIENCE (navy lens band — PaddleHub-style) ─────────────────────── */}
      <div className="about-experience-shell bg-brand-cream">
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <clipPath id="experience-lens-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0,0.07 C 0.24,0 0.76,0 1,0.07 L 1,0.93 C 0.76,1 0.24,1 0,0.93 Z" />
            </clipPath>
          </defs>
        </svg>

        <section className="about-experience scroll-mt-20" aria-labelledby="experience-heading">
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-14 sm:pt-20 pb-16 sm:pb-20">
          <MotionIn delay={80} amount={0} once={false}>
            <div className="text-center mb-8 sm:mb-10">
              <div className="flex items-center gap-4 mb-5">
                <span className="flex-1 h-px bg-brand-gold-400/25" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-gold-300/80">the full experience</span>
                <span className="flex-1 h-px bg-brand-gold-400/25" />
              </div>
              <h3
                id="experience-heading"
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] pb-2 mb-4"
                style={{
                  background: 'linear-gradient(135deg, #f0d060 0%, #e8d5a3 40%, #c9a227 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                While you&apos;re here
              </h3>
              <p className="text-brand-gold-100/75 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Daruhan is more than a court — it&apos;s a full food park and gig hub. Stay a little longer.
              </p>
            </div>
          </MotionIn>

          <MotionStagger
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            staggerChildren={0.08}
            delayChildren={0.05}
            animateOnMount={false}
            amount={0}
            once={false}
          >
            {SITE.aboutVenues.slice(1, 6).map((venue, i) => (
              <MotionItem key={venue.title} variants={fadeUp}>
                <div
                  className="amenity-card h-full"
                  style={{ '--card-glow-delay': `${i * 0.5}s`, '--shine-delay': `${i * 0.8}s` }}
                >
                  <span className="amenity-card__border" aria-hidden />
                  <span className="amenity-card__sheen" aria-hidden />
                  <span className="amenity-card__shine" aria-hidden />
                  <span className="amenity-card__index" aria-hidden>
                    {String(i + 2).padStart(2, '0')}
                  </span>
                  <div className="amenity-card__inner">
                    <div className="amenity-card__icon">
                      <Iconify icon={venue.iconifyId} width={28} height={28} />
                    </div>
                    <div className="flex-1">
                      <p className="amenity-card__hook">{venue.hook}</p>
                      <h3 className="amenity-card__title">{venue.title}</h3>
                      <p className="amenity-card__desc">{venue.desc}</p>
                    </div>
                  </div>
                </div>
              </MotionItem>
            ))}

            <MotionItem variants={fadeUp}>
              <div
                className="amenity-card amenity-card--featured h-full"
                style={{ '--card-glow-delay': '2.5s', '--shine-delay': '1.6s' }}
              >
                <span className="amenity-card__border" aria-hidden />
                <span className="amenity-card__sheen" aria-hidden />
                <span className="amenity-card__shine" aria-hidden />
                <span className="amenity-card__index" aria-hidden>07</span>
                <div className="amenity-card__inner">
                  <div className="amenity-card__icon">
                    <Iconify icon="noto:party-popper" width={28} height={28} />
                  </div>
                  <div className="flex-1">
                    <p className="amenity-card__hook">Night life</p>
                    <h3 className="amenity-card__title">D&apos;SuperClub</h3>
                    <p className="amenity-card__desc">
                      Live DJs, loud beats, and flowing drinks. Where the night comes alive.
                    </p>
                  </div>
                  <div className="amenity-card__footer">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-400 animate-pulse flex-shrink-0" aria-hidden />
                    Open nights
                  </div>
                </div>
              </div>
            </MotionItem>
          </MotionStagger>

          {/* ── Photo gallery ───────────────────────────────────────── */}
          <MotionIn delay={80} amount={0.05} once={false}>
            <VenueGallery />
          </MotionIn>
        </div>
        </section>
      </div>

      {/* ── CONTACT / FIND US ─────────────────────────────────────────────────── */}
      <section id="contact" className="bg-brand-cream dark:bg-brand-navy-950 py-24 px-4 scroll-mt-20">
        <MotionIn className="max-w-3xl mx-auto text-center mb-12" amount={0} once={false}>
          <SectionLabel>Visit Daruhan</SectionLabel>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
            Come find us in{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c9a227 0%, #e8d5a3 45%, #b8922a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >Carcar.</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Book online, then head over — {SITE.venue.courtCount} courts, {SITE.venue.parkingLabel.toLowerCase()}, lounge, and the full food park experience.
          </p>
        </MotionIn>
        <MotionIn delay={80} amount={0} once={false}>
          <ContactHub />
        </MotionIn>
      </section>
    </div>
  )
}
