/**
 * VenueGallery — editorial photo grid showcasing Daruhan's venues.
 *
 * Desktop (3-col):
 *   Row 1:  MenuCard FEATURED (1-3, full-width — at the very top)
 *   Row 2:  BallPool (1-2) │ KTV (3, rowspan 2)
 *   Row 3:  Club (1)       │ Bar (2)
 *   Row 4:  RestoTables (1-2) │ EventParty (3, rowspan 2)
 *   Row 5:  Minimart (1-2)
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon as Iconify } from '@iconify/react'
import { MotionStagger, MotionItem } from './MotionIn'
import { fadeUp, transition } from '../lib/motion'
import { X } from './ui/Icon'

/* ── Menu categories (from the actual Daruhan Resto & Griddle menu) ───────── */
const MENU_CATEGORIES = [
  { icon: 'noto:fried-egg',      label: 'Silog Meals',         from: 150 },
  { icon: 'noto:pot-of-food',    label: 'Sizzlers',            from: 170 },
  { icon: 'noto:french-fries',   label: 'Crackers & Starters', from: 50  },
  { icon: 'noto:steaming-bowl',  label: 'Soups',               from: 280 },
  { icon: 'noto:cut-of-meat',    label: 'Main Course',         from: 170 },
  { icon: 'noto:squid',          label: 'Street Foods',        from: 50  },
]

const MENU_SRC = '/gallery/Daruhan_RestoMenu.jpg'

/* ── Gallery photos ─────────────────────────────────────────────────────────── */
const GALLERY = [
  { src: '/gallery/Daruhan_BallPool.jpg',           label: 'Billiards',               hook: "Rack 'em up",     cls: 'vg-ball'         },
  { src: '/gallery/Daruhan_KTV.jpg',                label: 'Daruhan KTV',             hook: '9 private rooms', cls: 'vg-ktv'          },
  { src: '/gallery/Daruhan_Club.jpg',               label: "D'SuperClub",             hook: 'The night scene', cls: 'vg-club'         },
  { src: '/gallery/Daruhan_BarTableWithDrinks.jpg', label: 'Bar',                     hook: 'Flowing drinks',  cls: 'vg-bar'          },
  { src: '/gallery/Daruhan_RestoTablesView.jpg',    label: 'Daruhan Resto & Griddle', hook: 'Hearty meals',    cls: 'vg-restotables'  },
  { src: '/gallery/Daruhan_EventParty.jpg',         label: 'Good Times',              hook: 'With your crew',  cls: 'vg-party'        },
  { src: '/gallery/Daruhan_MiniMart.jpg',           label: 'Daruhan Minimart',        hook: 'Open 24/7',       cls: 'vg-mart'         },
]

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
function MenuLightbox({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(7,13,22,0.93)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.fast}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/28 text-white flex items-center justify-center transition-colors"
        aria-label="Close menu"
      >
        <X size={18} />
      </button>

      <motion.img
        src={MENU_SRC}
        alt="Daruhan Resto & Griddle — Official Menu"
        className="max-h-[92dvh] max-w-full w-auto rounded-2xl shadow-2xl object-contain"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={transition.medium}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  )
}

/* ── Menu featured card ───────────────────────────────────────────────────── */
function MenuCard({ onOpen }) {
  return (
    <motion.div
      className="vg-menu-card vg-menu-featured"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label="View Daruhan Resto & Griddle full menu"
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      whileHover={{ scale: 1.006 }}
      whileTap={{ scale: 0.998 }}
      transition={transition.hover}
    >
      {/* Shimmer sweep */}
      <span className="vg-menu-card__shimmer" aria-hidden />

      {/* Decorative bg text */}
      <span className="vg-menu-card__bg-text" aria-hidden>MENU</span>

      {/* Featured kicker badge */}
      <div className="vg-menu-card__kicker-row">
        <span className="vg-menu-card__featured-badge">
          <span className="vg-menu-card__featured-dot" aria-hidden />
          Featured
        </span>
        <span className="vg-menu-card__kicker">Daruhan Resto &amp; Griddle</span>
      </div>

      {/* Main heading */}
      <div className="vg-menu-card__heading-row">
        <div className="vg-menu-card__icon-wrap">
          <Iconify icon="noto:fork-and-knife-with-plate" width={28} height={28} />
        </div>
        <div>
          <h3 className="vg-menu-card__title">Our Official Menu</h3>
          <p className="vg-menu-card__subtitle">
            Good food, great value — see everything we&apos;re serving
          </p>
        </div>
      </div>

      {/* Category grid */}
      <div className="vg-menu-card__categories">
        {MENU_CATEGORIES.map((cat) => (
          <div key={cat.label} className="vg-menu-card__cat">
            <span className="vg-menu-card__cat-icon">
              <Iconify icon={cat.icon} width={20} height={20} />
            </span>
            <span className="vg-menu-card__cat-label">{cat.label}</span>
            <span className="vg-menu-card__cat-price">from ₱{cat.from}</span>
          </div>
        ))}
      </div>

      {/* Big CTA button */}
      <div className="vg-menu-card__cta-row">
        <motion.button
          className="vg-menu-card__cta-btn"
          aria-hidden
          tabIndex={-1}
          whileHover={{ y: -2, filter: 'brightness(1.08)' }}
          whileTap={{ scale: 0.98 }}
          transition={transition.hover}
        >
          <Iconify icon="noto:magnifying-glass-tilted-right" width={16} height={16} />
          View Full Menu &amp; All Prices
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        </motion.button>
        <p className="vg-menu-card__cta-hint">Tap anywhere on this card to open</p>
      </div>
    </motion.div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function VenueGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div className="mt-10 sm:mt-12">
      {/* Section divider */}
      <div className="flex items-center gap-4 mb-5 sm:mb-6">
        <span className="flex-1 h-px bg-brand-gold-400/25" />
        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.26em] text-brand-gold-300/75 whitespace-nowrap">
          A glimpse inside
        </span>
        <span className="flex-1 h-px bg-brand-gold-400/25" />
      </div>

      <MotionStagger
        className="venue-gallery-grid"
        staggerChildren={0.06}
        delayChildren={0.04}
        animateOnMount={false}
        amount={0.05}
        once={false}
      >
        {/* ── Menu card FIRST in DOM = top on mobile, row-1 on desktop ── */}
        <MotionItem className="vg-menu-featured" variants={fadeUp}>
          <MenuCard onOpen={() => setLightboxOpen(true)} />
        </MotionItem>

        {/* Regular photo cards */}
        {GALLERY.map((item) => (
          <MotionItem
            key={item.cls}
            className={`venue-gallery-item ${item.cls}`}
            variants={fadeUp}
          >
            <img src={item.src} alt={item.label} loading="lazy" />
            <div className="venue-gallery-item__overlay">
              <span className="venue-gallery-item__hook">{item.hook}</span>
              <p className="venue-gallery-item__label">{item.label}</p>
            </div>
          </MotionItem>
        ))}
      </MotionStagger>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <MenuLightbox
            key="menu-lightbox"
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
