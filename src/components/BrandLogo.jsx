import { logo } from '../lib/brandAssets'

const SIZE = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  nav: 'w-9 h-9 sm:w-10 sm:h-10',
  lg: 'w-20 h-20',
  auth: 'w-14 h-14 sm:w-16 sm:h-16',
  xl: 'w-28 h-28 sm:w-32 sm:h-32 lg:w-32 lg:h-32 xl:w-36 xl:h-36',
}

/**
 * Logo.png ships on a black canvas.
 * - dark: screen blend on dark UI (hero, dark nav)
 * - plain: raw asset on light UI (login) — no pad, no blend
 * - light / nav: navy pad + screen blend so the black box disappears
 */
export default function BrandLogo({
  alt = 'Daruhan',
  size = 'sm',
  variant = 'light',
  className = '',
}) {
  const dim = SIZE[size] ?? size

  if (variant === 'dark') {
    return (
      <img
        src={logo}
        alt={alt}
        className={`${dim} object-contain brand-logo--dark ${className}`}
      />
    )
  }

  if (variant === 'plain') {
    return (
      <img
        src={logo}
        alt={alt}
        className={`${dim} object-contain ${className}`}
      />
    )
  }

  const padSize = size === 'xs' ? 'p-0.5' : size === 'nav' || size === 'md' ? 'p-1' : 'p-1'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand-navy-900 shadow-sm ring-1 ring-brand-gold-400/30 ${padSize} ${className}`}
    >
      <img
        src={logo}
        alt={alt}
        className={`${dim} object-contain brand-logo--on-pad`}
      />
    </span>
  )
}
