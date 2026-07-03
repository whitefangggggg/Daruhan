import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, fadeIn, transition, viewport as defaultViewport } from '../lib/motion'

export function MotionIn({
  children,
  className = '',
  delay = 0,
  variants = fadeUp,
  transition: userTransition,
  as,
  once = true,
  amount = defaultViewport.amount,
  margin = defaultViewport.margin,
  animateOnMount = false,
  style,
  ...rest
}) {
  const reduceMotion = useReducedMotion()
  const Component = as || motion.div
  const t = userTransition ?? { ...transition.medium, delay: delay / 1000 }
  const resolvedVariants = reduceMotion ? fadeIn : variants

  const viewProps = animateOnMount
    ? { initial: 'hidden', animate: 'visible' }
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once, amount, margin },
      }

  return (
    <Component
      className={className}
      variants={resolvedVariants}
      transition={reduceMotion ? transition.fast : t}
      style={style}
      {...viewProps}
      {...rest}
    >
      {children}
    </Component>
  )
}

export function MotionStagger({
  children,
  className = '',
  staggerChildren = 0.11,
  delayChildren = 0,
  animateOnMount = false,
  once = true,
  amount = defaultViewport.amount,
  margin = defaultViewport.margin,
  as,
  ...rest
}) {
  const Component = as || motion.div

  const viewProps = animateOnMount
    ? { initial: 'hidden', animate: 'visible' }
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once, amount, margin },
      }

  return (
    <Component
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren, delayChildren },
        },
      }}
      {...viewProps}
      {...rest}
    >
      {children}
    </Component>
  )
}

export function MotionItem({
  children,
  className = '',
  variants = fadeUp,
  transition: userTransition,
  as,
  ...rest
}) {
  const Component = as || motion.div

  return (
    <Component
      className={className}
      variants={variants}
      transition={userTransition ?? transition.medium}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default MotionIn
