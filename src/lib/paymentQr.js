import { SITE } from '../config/site'

/**
 * Image URL for the “pay here” QR on the booking flow.
 * Set VITE_PAYMENT_QR_URL in .env to your static merchant QR (recommended for production).
 * Otherwise builds a payload QR via the public qrserver API (demo only).
 */
export function getPaymentQrSrc({ totalPrice, bookingName, courtName, date }) {
  const envUrl = import.meta.env.VITE_PAYMENT_QR_URL
  if (envUrl && String(envUrl).trim()) return String(envUrl).trim()

  const payload = `${SITE.slug}|₱${totalPrice}|${courtName || 'Court'}|${date}|${bookingName}`.slice(0, 280)
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${encodeURIComponent(payload)}`
}
