import qrPhLogo from '../assets/QR_Ph_Logo.svg'
import { getPaymentQrSrc } from './paymentQr'

/** Brand logos for payment method picker (key = normalized method name). */
export const PAYMENT_METHOD_LOGOS = {
  qrph: qrPhLogo,
}

export function normalizePaymentBrandKey(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function getPaymentMethodLogo(name) {
  return PAYMENT_METHOD_LOGOS[normalizePaymentBrandKey(name)] ?? null
}

/**
 * Merchant QR image: DB url → VITE_PAYMENT_QR_URL → demo payload QR.
 */
export function resolvePaymentQrImageUrl(method, context = {}) {
  if (method?.qr_image_url?.trim()) return method.qr_image_url.trim()

  const envUrl = import.meta.env.VITE_PAYMENT_QR_URL
  if (envUrl && String(envUrl).trim()) return String(envUrl).trim()

  if (context.totalPrice != null) {
    return getPaymentQrSrc(context)
  }

  return null
}
