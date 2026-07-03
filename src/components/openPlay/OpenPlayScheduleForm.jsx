import { useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CalendarDays, Check, Link2, Sparkles } from 'lucide-react'
import { StatusMessage, X } from '../ui/Icon'
import OpenPlayTimeRangePicker from './OpenPlayTimeRangePicker'
import { useOpenPlaySchedule } from '../../hooks/useOpenPlaySchedule'
import {
  SKILL_LEVELS,
  getOpenPlaySkillTheme,
  isValidOpenPlayTimeRange,
} from '../../utils/openPlay'
import {
  formatOpenPlayWindow,
  openPlayRangeFitsCourt,
  pickFirstAvailableCourt,
} from '../../utils/openPlaySchedule'

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon ? <Icon size={14} className="text-brand-gold-600" /> : null}
      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-700">{children}</p>
    </div>
  )
}

function SkillLevelPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SKILL_LEVELS.map(level => {
        const theme = getOpenPlaySkillTheme(level)
        const active = value === level
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`py-2.5 px-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
              active
                ? 'border-brand-gold-500 bg-brand-gold-500 text-white shadow-sm'
                : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:border-brand-gold-300'
            }`}
            style={active ? undefined : { backgroundImage: theme.cardGradient }}
          >
            {level}
          </button>
        )
      })}
    </div>
  )
}

function CourtAvailabilityGrid({ courts, courtAnalysis, selectedCourtId, onSelectCourt, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
        <span className="w-5 h-5 border-2 border-brand-gold-200 border-t-brand-gold-500 rounded-full animate-spin" />
        Checking court availability…
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {courts.map(court => {
        const analysis = courtAnalysis.find(c => c.courtId === court.id)
        const selected = selectedCourtId === court.id
        const available = analysis?.available
        const conflict = analysis?.primaryConflict

        let stateClass = 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:border-brand-gold-300 hover:bg-brand-gold-50/50 dark:hover:bg-slate-700/50'
        if (selected && available) {
          stateClass = 'border-brand-gold-500 bg-brand-gold-500 text-white shadow-md shadow-brand-gold-200/70 ring-2 ring-brand-gold-300/50'
        } else if (selected && !available) {
          stateClass = 'border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-950 dark:text-amber-200 ring-2 ring-amber-300/50 dark:ring-amber-800/40'
        } else if (!available) {
          stateClass = 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-400 cursor-not-allowed opacity-80'
        }

        return (
          <button
            key={court.id}
            type="button"
            disabled={!available}
            onClick={() => onSelectCourt(court.id)}
            className={`relative text-left rounded-2xl border-2 p-4 transition-all min-h-[88px] ${stateClass}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-[15px] leading-tight">{court.name}</p>
                <p className={`text-[11px] mt-1.5 font-medium leading-snug ${selected && available ? 'text-brand-gold-50/90' : available ? 'text-brand-gold-700 dark:text-brand-gold-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {available ? 'Available for this window' : conflict ?? 'Not available'}
                </p>
              </div>
              {selected && available && (
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check size={14} />
                </span>
              )}
              {!available && (
                <AlertTriangle size={15} className="flex-shrink-0 opacity-60 mt-0.5" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DayScheduleSummary({ courtAnalysis, date, loading }) {
  const total = courtAnalysis.length
  const free = courtAnalysis.filter(c => c.available).length
  const busy = courtAnalysis.filter(c => !c.available && c.conflicts.some(x => x.type === 'booking')).length
  const blocked = courtAnalysis.filter(c => !c.available && c.conflicts.some(x => x.type !== 'booking' && x.type !== 'past')).length

  return (
    <div className="rounded-xl border border-brand-gold-200 dark:border-brand-navy-700/40 bg-brand-gold-50/40 dark:bg-brand-navy-900/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-800 dark:text-brand-gold-300 mb-1">
        {format(parseISO(date), 'EEEE, MMM d')}
      </p>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading schedule…</p>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-200">
          <span className="font-semibold text-brand-gold-700 dark:text-brand-gold-400">{free} of {total}</span> court{total !== 1 ? 's' : ''} free for your selected window
          {busy > 0 && <> · {busy} with booking{busy !== 1 ? 's' : ''}</>}
          {blocked > 0 && <> · {blocked} blocked</>}
        </p>
      )}
    </div>
  )
}

export default function OpenPlayScheduleForm({
  form,
  setForm,
  courts,
  editingPost = null,
  submitting,
  onSubmit,
  onClose,
}) {
  const excludeBlockedSlotId = editingPost?.blocked_slot_id ?? null

  const {
    courtAnalysis,
    availableCourtCount,
    perCourtOccupied,
    pastHours,
    loading,
    error: scheduleError,
  } = useOpenPlaySchedule({
    courts,
    date: form.date,
    startHour: form.start_hour,
    endHour: form.end_hour,
    excludeBlockedSlotId,
  })

  const selectedCourtAnalysis = courtAnalysis.find(c => c.courtId === form.court_id)
  const validTime = isValidOpenPlayTimeRange(form.start_hour, form.end_hour)
  const selectedCourtAvailable = selectedCourtAnalysis?.available ?? false

  useEffect(() => {
    if (loading || !validTime) return
    const nextCourtId = pickFirstAvailableCourt(courtAnalysis, form.court_id)
    if (nextCourtId && nextCourtId !== form.court_id) {
      setForm(f => ({ ...f, court_id: nextCourtId }))
    }
  }, [form.start_hour, form.end_hour, form.date, courtAnalysis, loading, validTime, form.court_id, setForm])

  const isStartHourDisabled = useMemo(() => {
    return hour => {
      if (pastHours.has(hour)) return true
      return !courts.some(court => {
        const occupied = perCourtOccupied.get(court.id) ?? new Set()
        const minEnd = Math.min(hour + 1, 24)
        return openPlayRangeFitsCourt(occupied, hour, minEnd, pastHours)
      })
    }
  }, [courts, perCourtOccupied, pastHours])

  const isEndHourDisabled = useMemo(() => {
    return hour => {
      if (hour <= form.start_hour) return true
      return !courts.some(court => {
        const occupied = perCourtOccupied.get(court.id) ?? new Set()
        return openPlayRangeFitsCourt(occupied, form.start_hour, hour, pastHours)
      })
    }
  }, [courts, perCourtOccupied, pastHours, form.start_hour])

  const scheduleHint = useMemo(() => {
    if (loading || !validTime) return null
    if (availableCourtCount === 0) {
      return 'No courts are free for this time window. Adjust the session hours or pick another date.'
    }
    if (!selectedCourtAvailable && selectedCourtAnalysis?.primaryConflict) {
      return `${selectedCourtAnalysis.courtName ?? 'This court'}: ${selectedCourtAnalysis.primaryConflict}. Pick another court or change the time.`
    }
    return `${availableCourtCount} court${availableCourtCount !== 1 ? 's' : ''} available · ${formatOpenPlayWindow(form.start_hour, form.end_hour)}`
  }, [loading, validTime, availableCourtCount, selectedCourtAvailable, selectedCourtAnalysis, form.start_hour, form.end_hour])

  const setField = key => e => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm(f => ({ ...f, [key]: val }))
  }

  const canSubmit = Boolean(
    form.court_id
    && selectedCourtAvailable
    && validTime
    && form.rsvp_link.trim()
    && !submitting
    && !loading,
  )

  return (
    <>
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-600 mb-0.5">
            Admin · Open Play
          </p>
          <h2 className="admin-display text-xl text-gray-900 dark:text-white leading-tight">
            {editingPost ? 'Edit session' : 'New session'}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-5 space-y-6">
        {scheduleError && <StatusMessage type="error">{scheduleError}</StatusMessage>}

        <section className="space-y-4">
          <SectionLabel icon={CalendarDays}>When &amp; where</SectionLabel>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Session date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={setField('date')}
              required
              className="input-field"
            />
          </div>

          <DayScheduleSummary
            courtAnalysis={courtAnalysis}
            date={form.date}
            loading={loading}
          />

          <OpenPlayTimeRangePicker
            startHour={form.start_hour}
            endHour={form.end_hour}
            onChange={({ startHour, endHour }) =>
              setForm(f => ({ ...f, start_hour: startHour, end_hour: endHour }))
            }
            isStartHourDisabled={isStartHourDisabled}
            isEndHourDisabled={isEndHourDisabled}
            scheduleHint={scheduleHint}
          />

          <div>
            <SectionLabel icon={Sparkles}>Pick a court</SectionLabel>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Courts with existing bookings or blocks for this window are disabled. Paid bookings always take priority.
            </p>
            <CourtAvailabilityGrid
              courts={courts}
              courtAnalysis={courtAnalysis}
              selectedCourtId={form.court_id}
              onSelectCourt={courtId => setForm(f => ({ ...f, court_id: courtId }))}
              loading={loading}
            />
          </div>

          {selectedCourtAnalysis && !selectedCourtAvailable && selectedCourtAnalysis.conflicts.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">Conflicts on {selectedCourtAnalysis.courtName}</p>
              <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
                {selectedCourtAnalysis.conflicts.map((c, i) => (
                  <li key={`${c.type}-${i}`}>• {c.summary}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-700">
          <SectionLabel icon={Link2}>Session details</SectionLabel>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              RSVP deadline
            </label>
            <input
              type="datetime-local"
              value={form.rsvp_deadline}
              onChange={setField('rsvp_deadline')}
              required
              className="input-field"
            />
            <p className="text-[11px] text-gray-400 mt-1">Countdown runs until this time — can differ from session start.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              RSVP link (Reclub)
            </label>
            <input
              type="url"
              value={form.rsvp_link}
              onChange={setField('rsvp_link')}
              placeholder="https://..."
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Skill level
            </label>
            <SkillLevelPicker
              value={form.skill_level}
              onChange={level => setForm(f => ({ ...f, skill_level: level }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={setField('title')}
              placeholder="Saturday Morning Open Play"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Details
            </label>
            <textarea
              value={form.body}
              onChange={setField('body')}
              rows={3}
              placeholder="Bring extra balls, rain plan…"
              className="input-field resize-none"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 disabled:opacity-40 shadow-sm"
        >
          {submitting ? 'Saving…' : editingPost ? 'Save changes' : 'Publish session'}
        </button>
      </form>
    </>
  )
}
