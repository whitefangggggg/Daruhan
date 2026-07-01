import { useState } from 'react'

export default function PaymentQrImage({ method, onRetryLoad }) {
  const [loadError, setLoadError] = useState(false)
  const [imgKey, setImgKey] = useState(0)

  if (!method?.qr_image_url) {
    return (
      <div className="w-[220px] h-[220px] rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="text-4xl">📵</span>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">QR not yet available for {method?.name}</p>
        <p className="text-xs text-gray-400">Please contact support to get the payment details.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-[220px] min-h-[220px] rounded-xl border-2 border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-xs font-semibold text-amber-900">Couldn&apos;t load the QR image</p>
        <p className="text-xs text-amber-800 leading-snug">
          The link may have expired. Tap retry to refresh payment options.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false)
            setImgKey(k => k + 1)
            onRetryLoad?.()
          }}
          className="text-xs font-semibold text-amber-900 underline hover:text-amber-950"
        >
          Retry QR
        </button>
      </div>
    )
  }

  return (
    <img
      key={imgKey}
      src={method.qr_image_url}
      alt={`${method.name} QR code`}
      width={220}
      height={220}
      className="rounded-xl border border-white bg-white dark:bg-slate-800 p-2 shadow-sm"
      onError={() => setLoadError(true)}
    />
  )
}
