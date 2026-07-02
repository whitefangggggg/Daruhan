import { useEffect, useRef, useCallback } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function useMobileMenu(isOpen, onClose) {
  const menuRef = useRef(null)

  const close = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        close()
        return
      }

      if (e.key !== 'Tab' || !menuRef.current) return

      const focusables = [...menuRef.current.querySelectorAll(FOCUSABLE)].filter(
        el => el.offsetParent !== null || el === document.activeElement,
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const timer = window.setTimeout(() => {
      menuRef.current?.querySelector(FOCUSABLE)?.focus()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  return { menuRef, close }
}
