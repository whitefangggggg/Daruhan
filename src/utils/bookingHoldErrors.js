/** Map Supabase / Postgres hold-creation errors to user-facing copy. */
export function formatHoldError(error, unitLabel = 'courts') {
  const message = error?.message ?? ''
  const code = error?.code ?? ''

  if (message.includes('SLOT_TAKEN') || code === '23P01') {
    return `No ${unitLabel} are available for that time range anymore. Please pick another slot.`
  }
  if (message.includes('NO_COURTS')) {
    return `No active ${unitLabel} are configured yet. Please contact support.`
  }
  if (message.includes('Not authenticated')) {
    return 'Your session expired. Please sign in again and retry.'
  }
  if (message.includes('CONTACT_PHONE_REQUIRED')) {
    return 'Please enter a contact number so we can reach you about your booking.'
  }
  if (message.includes('INVALID_TRAINER')) {
    return 'Please check your trainer hours and number of players, then try again.'
  }
  if (message.includes('INVALID_BOOKING') || message.includes('INVALID_PRICE')) {
    return 'Could not reserve that slot. Check your date, time, and extras, then try again.'
  }
  if (message.includes('FORBIDDEN')) {
    return 'That change is not allowed. Contact support if you need help.'
  }
  return message || 'Could not reserve your slot. Try again or contact support.'
}
