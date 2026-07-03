import { useState } from 'react'
import { getPaymentMethodLogo } from '../lib/paymentMethods'

export default function PaymentQrImage({ method, qrSrc, onRetryLoad }) {
  const [loadError, setLoadError] = useState(false)
  const [imgKey, setImgKey] = useState(0)
  const src = qrSrc ?? method?.qr_image_url
  const brandLogo = getPaymentMethodLogo(method?.name)

  if (!src) {
    return (
      <div className="w-[220px] min-h-[220px] rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-3 p-4 text-center">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="h-8 w-auto opacity-80" aria-hidden />
        ) : (
          <span className="text-4xl">📵</span>
        )}
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          QR not yet available for {method?.name ?? 'QR PH'}
        </p>
        <p className="text-xs text-gray-400 leading-snug">
          Add your merchant QR in Supabase (<code className="text-[10px]">payment_methods.qr_image_url</code>)
          or set <code className="text-[10px]">VITE_PAYMENT_QR_URL</code> in <code className="text-[10px]">.env.local</code>.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-[220px] min-h-[220px] rounded-xl border-2 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">Couldn&apos;t load the QR image</p>
        <p className="text-xs text-amber-800 dark:text-amber-400 leading-snug">
          The link may have expired. Tap retry to refresh payment options.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false)
            setImgKey(k => k + 1)
            onRetryLoad?.()
          }}
          className="text-xs font-semibold text-amber-900 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-200"
        >
          Retry QR
        </button>
      </div>
    )
  }

  return (
    <img
      key={imgKey}
      src={src}
      alt={`${method?.name ?? 'QR PH'} payment QR code`}
      width={220}
      height={220}
      className="rounded-xl border border-white bg-white dark:bg-slate-800 p-2 shadow-sm"
      onError={() => setLoadError(true)}
    />
  )
}
