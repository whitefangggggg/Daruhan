import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { format, startOfDay } from 'date-fns'
import { Calendar, ChevronDown } from './ui/Icon'
import 'react-day-picker/src/style.css'

/** Parse yyyy-MM-dd as local midnight (avoids UTC shift from parseISO). */
function parseLocalDate(dateStr) {
  if (!dateStr) return undefined
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function DatePicker({ value, onChange, min, label }) {
  const [open, setOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  const selectedDate = parseLocalDate(value)
  const minDate = min ? parseLocalDate(min) : startOfDay(new Date())

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const width = Math.max(rect.width, 320)
    let left = rect.left
    if (left + width > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - width - 16)
    }
    setPopoverStyle({
      top: rect.bottom + 8,
      left,
      width,
    })
  }, [])

  function handleSelect(date) {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    function handleClick(e) {
      if (triggerRef.current?.contains(e.target)) return
      if (popoverRef.current?.contains(e.target)) return
      setOpen(false)
    }
    function handleReposition() {
      updatePosition()
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, updatePosition])

  const displayDate = selectedDate
    ? format(selectedDate, 'EEEE, MMMM d, yyyy')
    : 'Select a date'

  const calendar = open && popoverStyle && createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[200] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
      style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
    >
      <style>{`
        .rdp {
          --rdp-accent-color: #c9a227;
          --rdp-accent-background-color: #faf6eb;
          --rdp-background-color: #faf6eb;
          margin: 0;
        }
        .rdp-root {
          padding: 12px;
          --rdp-accent-color: #c9a227;
          --rdp-accent-background-color: #f3ead4;
        }
        .rdp-day_button {
          border-radius: 8px;
          font-size: 0.85rem;
        }
        .rdp-selected .rdp-day_button {
          background: linear-gradient(135deg, #d4af37, #b8922a) !important;
          color: #0a1220 !important;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(201, 162, 39, 0.35);
        }
        .rdp-today .rdp-day_button {
          font-weight: 700;
          color: #b8922a;
        }
        .rdp-day_button:hover:not([disabled]) {
          background: #f3ead4 !important;
          color: #7a6115 !important;
        }
        .rdp-disabled .rdp-day_button {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .rdp-caption_label {
          font-weight: 700;
          font-size: 0.9rem;
          color: #1f2937;
        }
        .dark .rdp-caption_label {
          color: #f3f4f6;
        }
        .rdp-nav_button {
          border-radius: 8px;
        }
        .rdp-weekday {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
        }
        .dark .rdp-day_button:not(.rdp-day_selected):not([disabled]) {
          color: #e5e7eb;
        }
        .dark .rdp-day_button:hover:not([disabled]) {
          background: #1c2f4d !important;
          color: #d4bc6a !important;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        disabled={{ before: minDate }}
        showOutsideDays
        fixedWeeks
      />
    </div>,
    document.body,
  )

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 transition-all text-left ${
          open ? 'border-brand-gold-400 shadow-sm' : 'border-gray-200 dark:border-slate-700 hover:border-brand-gold-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-brand-gold-50 dark:bg-brand-navy-900/30 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-brand-gold-500 dark:text-brand-gold-400" strokeWidth={2} />
          </span>
          <div>
            <p className={`text-sm font-semibold ${selectedDate ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
              {displayDate}
            </p>
            {selectedDate && (
              <p className="text-xs text-gray-400">
                {format(selectedDate, 'yyyy-MM-dd')}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {calendar}
    </div>
  )
}
