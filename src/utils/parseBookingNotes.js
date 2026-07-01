const PADDLE_RATE = 100
const BALL_RATE = 100
// Current trainer rate (per hour, per head). Reverted to ₱300.
const TRAINER_RATE = 300
// Older bookings embed their own rate in the notes string (e.g. "× ₱500/hr"),
// so historical records keep whatever rate they were charged at.
const LEGACY_TRAINER_RATE = 300

export function trainerExtraTotal(trainerHours, trainerHeads, rate = TRAINER_RATE) {
  if (!trainerHours || !trainerHeads) return 0
  return trainerHours * trainerHeads * rate
}

/**
 * Parses the structured `notes` string stored on a booking back into its parts.
 */
export function parseBookingNotes(notes, { durationHours = 0 } = {}) {
  if (!notes) {
    return {
      bookerName: '',
      paddles: 0,
      balls: 0,
      trainerHours: 0,
      trainerHeads: 0,
      extrasTotal: 0,
      userNotes: '',
    }
  }

  const nameMatch = notes.match(/^Booked under: ([^·]+)/)
  const paddleMatch = notes.match(/(\d+) paddle rental/)
  const ballMatch = notes.match(/(\d+) ball/)
  const trainerMatch = notes.match(/trainer \((\d+)h(?: × (\d+) pax)?(?: × ₱(\d+)\/hr)?/i)

  const bookerName = nameMatch ? nameMatch[1].trim() : ''
  const paddles = paddleMatch ? parseInt(paddleMatch[1], 10) : 0
  const balls = ballMatch ? parseInt(ballMatch[1], 10) : 0
  let trainerHours = trainerMatch ? parseInt(trainerMatch[1], 10) : 0
  let trainerHeads = trainerMatch?.[2] ? parseInt(trainerMatch[2], 10) : 1
  const trainerRateInNote = trainerMatch?.[3]
    ? parseInt(trainerMatch[3], 10)
    : (trainerMatch?.[2] ? TRAINER_RATE : LEGACY_TRAINER_RATE)

  if (!trainerHours && /\d+ trainer/i.test(notes) && durationHours > 0) {
    trainerHours = durationHours
    trainerHeads = 1
  }

  if (!trainerHours) trainerHeads = 0

  const extrasTotal =
    paddles * PADDLE_RATE
    + balls * BALL_RATE
    + trainerExtraTotal(trainerHours, trainerHeads, trainerRateInNote)

  const segments = notes.split(' · ')
  const userNotesParts = segments.filter(
    seg =>
      !seg.startsWith('Booked under:') &&
      !seg.match(/^\d+ paddle rental/) &&
      !seg.match(/^\d+ ball/) &&
      !seg.match(/^trainer \(/i) &&
      !seg.match(/^\d+ trainer/i)
  )

  return {
    bookerName,
    paddles,
    balls,
    trainerHours,
    trainerHeads,
    extrasTotal,
    userNotes: userNotesParts.join(' · ').trim(),
  }
}

export { PADDLE_RATE, BALL_RATE, TRAINER_RATE }
