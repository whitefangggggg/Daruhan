import { SITE } from '../config/site'

const KEY_PREFIX = `${SITE.storagePrefix}:booking-draft:`

export function getBookingDraftKey(userId) {
  return `${KEY_PREFIX}${userId}`
}

export function saveBookingDraft(userId, draft) {
  if (!userId || !draft) return
  try {
    sessionStorage.setItem(
      getBookingDraftKey(userId),
      JSON.stringify({ ...draft, savedAt: Date.now() }),
    )
  } catch {
    // sessionStorage full or unavailable
  }
}

export function loadBookingDraft(userId) {
  if (!userId) return null
  try {
    const raw = sessionStorage.getItem(getBookingDraftKey(userId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearBookingDraft(userId) {
  if (!userId) return
  try {
    sessionStorage.removeItem(getBookingDraftKey(userId))
  } catch {
    // ignore
  }
}

/** Step-1 edits beyond the default profile name / today's date. */
export function hasStep1DraftProgress(draft, { profileName = '', today = '' } = {}) {
  if (!draft) return false
  const trimmedName = (draft.bookingName ?? '').trim()
  const profile = (profileName ?? '').trim()
  const nameEdited = Boolean(trimmedName) && trimmedName !== profile
  const dateEdited = Boolean(draft.selectedDate && today && draft.selectedDate !== today)
  return nameEdited || dateEdited
}

/** True when the user has meaningful booking progress worth saving. */
export function draftHasProgress(draft, context = {}) {
  if (!draft) return false
  return (
    draft.step > 1
    || draft.startHour != null
    || (draft.paddles ?? 0) > 0
    || (draft.balls ?? 0) > 0
    || (draft.trainerHours ?? 0) > 0
    || (draft.trainerHeads ?? 0) > 0
    || Boolean(draft.notes?.trim())
    || Boolean(draft.pendingBookingId)
    || hasStep1DraftProgress(draft, context)
  )
}
