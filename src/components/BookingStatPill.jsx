export default function BookingStatPill({ icon, label, value, accent }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-4 py-3.5 flex items-center gap-3 border shadow-sm ${accent}`}
    >
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(circle_at_80%_20%,#c9a227,transparent_55%)]" />
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-white/80 dark:bg-slate-700/80 border border-white/60 dark:border-slate-600/60 shadow-sm">
        {icon}
      </div>
      <div className="relative min-w-0">
        <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</p>
      </div>
    </div>
  )
}
