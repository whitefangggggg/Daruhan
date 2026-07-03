import { motion, useReducedMotion } from 'framer-motion'
import { pageTransition, pageTransitionReduced } from '../lib/motion'

/**
 * Wraps route content for enter/exit animation.
 * Key must be set by the parent (usually location.pathname).
 */
export default function PageTransition({ children, className = '' }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`w-full min-w-0 ${className}`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={reduceMotion ? pageTransitionReduced : pageTransition}
    >
      {children}
    </motion.div>
  )
}
