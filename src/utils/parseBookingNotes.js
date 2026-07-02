export const PADDLE_RATE = 50
export const BALL_RATE = 50
const TRAINER_RATE = 300
const LEGACY_TRAINER_RATE = 300
const LEGACY_FLAT_PADDLE_RATE = 100
const LEGACY_FLAT_BALL_RATE = 100

export function trainerExtraTotal(trainerHours, trainerHeads, rate = TRAINER_RATE) {
  if (!trainerHours || !trainerHeads) return 0
  return trainerHours * trainerHeads * rate
}

/** Hourly paddle/ball add-ons (₱50/hr each when enabled). */
export function extrasRentalTotal({ paddles = 0, balls = 0, durationHours = 0 }) {
  const dur = Math.max(0, durationHours)
  let total = 0
  if (paddles > 0) total += dur * PADDLE_RATE
  if (balls > 0) total += dur * BALL_RATE
  return total
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
  const paddleHourlyMatch = notes.match(/paddle rental \((\d+)h × ₱(\d+)\/hr\)/i)
  const ballHourlyMatch = notes.match(/ball rental \((\d+)h × ₱(\d+)\/hr\)/i)
  const legacyPaddleMatch = notes.match(/(\d+) paddle rental(?: \(₱(\d+)\))?/i)
  const legacyBallMatch = notes.match(/(\d+) ball(?: \(₱(\d+)\))?/i)
  const trainerMatch = notes.match(/trainer \((\d+)h(?: × (\d+) pax)?(?: × ₱(\d+)\/hr)?/i)

  const bookerName = nameMatch ? nameMatch[1].trim() : ''
  const paddles = paddleHourlyMatch
    ? 1
    : (legacyPaddleMatch ? parseInt(legacyPaddleMatch[1], 10) : 0)
  const balls = ballHourlyMatch
    ? 1
    : (legacyBallMatch ? parseInt(legacyBallMatch[1], 10) : 0)

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

  let paddleCost = 0
  let ballCost = 0

  if (paddleHourlyMatch) {
    paddleCost = parseInt(paddleHourlyMatch[1], 10) * parseInt(paddleHourlyMatch[2], 10)
  } else if (legacyPaddleMatch) {
    const rate = legacyPaddleMatch[2]
      ? parseInt(legacyPaddleMatch[2], 10)
      : LEGACY_FLAT_PADDLE_RATE
    paddleCost = paddles * rate
  }

  if (ballHourlyMatch) {
    ballCost = parseInt(ballHourlyMatch[1], 10) * parseInt(ballHourlyMatch[2], 10)
  } else if (legacyBallMatch) {
    const rate = legacyBallMatch[2]
      ? parseInt(legacyBallMatch[2], 10)
      : LEGACY_FLAT_BALL_RATE
    ballCost = balls * rate
  }

  const extrasTotal = paddleCost + ballCost + trainerExtraTotal(trainerHours, trainerHeads, trainerRateInNote)

  const segments = notes.split(' · ')
  const userNotesParts = segments.filter(
    seg =>
      !seg.startsWith('Booked under:') &&
      !seg.match(/paddle rental \(/i) &&
      !seg.match(/ball rental \(/i) &&
      !seg.match(/^\d+ paddle rental/i) &&
      !seg.match(/^\d+ ball/i) &&
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

export { TRAINER_RATE }
