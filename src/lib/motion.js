/** Shared Framer Motion presets — snappy hovers, smooth entrances */

export const EASE_OUT = [0.22, 1, 0.36, 1]
export const EASE_IN_OUT = [0.4, 0, 0.2, 1]

export const transition = {
  slow: { duration: 0.35, ease: EASE_OUT },
  medium: { duration: 0.22, ease: EASE_OUT },
  fast: { duration: 0.12, ease: EASE_OUT },
  hover: { duration: 0.12, ease: EASE_OUT },
  /** Route changes — short enough to feel responsive, long enough to read as intentional. */
  page: { duration: 0.28, ease: EASE_OUT },
  pageExit: { duration: 0.18, ease: EASE_IN_OUT },
}

export const viewport = {
  once: true,
  amount: 0.18,
  margin: '-48px 0px -32px 0px',
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
}

export const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0 },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
}

/** Soft route enter/exit used by PageTransition (user + admin). */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition.page,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: transition.pageExit,
  },
}

export const pageTransitionReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transition.fast },
  exit: { opacity: 0, transition: transition.fast },
}

export const stagger = (staggerChildren = 0.06, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
})

export function withDelay(delayMs, base = transition.medium) {
  return { ...base, delay: delayMs / 1000 }
}
