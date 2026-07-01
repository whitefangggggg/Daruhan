import { useEffect, useRef, useState } from 'react'

export default function AnimateIn({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  once = true,
  threshold = 0.12,
  style: userStyle,
  ...rest
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once, threshold])

  const mergedStyle = {
    ...userStyle,
    animationDelay: `${delay}ms`,
  }

  return (
    <Tag
      ref={ref}
      className={`${visible ? 'animate-in-view' : 'animate-in-hidden'} ${className}`}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Tag>
  )
}
