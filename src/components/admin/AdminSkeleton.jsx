import { motion } from 'framer-motion'

const shimmer = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
  transition: {
    repeat: Infinity,
    ease: "linear",
    duration: 1.5,
  }
}

export function SkeletonBox({ className = '', style = {} }) {
  return (
    <div
      className={`relative overflow-hidden bg-brand-gold-50/50 rounded-xl ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold-100/40 to-transparent"
        initial="initial"
        animate="animate"
        variants={shimmer}
      />
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:py-10 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <SkeletonBox className="w-48 h-4 mb-3" />
          <SkeletonBox className="w-72 h-10 mb-2" />
          <SkeletonBox className="w-40 h-4" />
        </div>
        <SkeletonBox className="w-40 h-10 rounded-lg" />
      </div>

      {/* Hero */}
      <div className="admin-hero p-7 lg:p-9 relative overflow-hidden">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end relative z-10">
          <div>
            <SkeletonBox className="w-32 h-4 bg-white/20 mb-4" />
            <SkeletonBox className="w-64 h-14 bg-white/20 mb-5" />
            <div className="flex gap-3">
              <SkeletonBox className="w-16 h-5 rounded-full bg-white/20" />
              <SkeletonBox className="w-48 h-5 bg-white/20" />
            </div>
          </div>
          <div className="md:text-right">
            <SkeletonBox className="w-24 h-4 bg-white/20 mb-2 md:ml-auto" />
            <SkeletonBox className="w-32 h-8 bg-white/20 md:ml-auto" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="admin-card-flat p-5 h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <SkeletonBox className="w-9 h-9 rounded-xl" />
              <SkeletonBox className="w-12 h-5 rounded-full" />
            </div>
            <div>
              <SkeletonBox className="w-20 h-8 mb-2" />
              <SkeletonBox className="w-16 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart/Today skeleton */}
      <div className="admin-card-flat p-6 h-[300px]">
        <SkeletonBox className="w-40 h-6 mb-6" />
        <SkeletonBox className="w-full h-full" />
      </div>
    </div>
  )
}

export function AdminBookingsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 lg:py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <SkeletonBox className="w-48 h-4 mb-3" />
          <SkeletonBox className="w-72 h-10 mb-3" />
          <div className="flex gap-2">
            <SkeletonBox className="w-24 h-6 rounded-full" />
            <SkeletonBox className="w-24 h-6 rounded-full" />
            <SkeletonBox className="w-32 h-6 rounded-full" />
          </div>
        </div>
        <SkeletonBox className="w-40 h-10 rounded-lg" />
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Calendar Side */}
        <div className="admin-card p-5 h-[400px]">
          <SkeletonBox className="w-full h-8 mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <SkeletonBox key={i} className="w-full h-10 rounded-xl" />
            ))}
          </div>
        </div>

        {/* List Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <SkeletonBox className="w-40 h-7 mb-2" />
              <SkeletonBox className="w-24 h-4" />
            </div>
            <SkeletonBox className="w-32 h-10 rounded-xl" />
          </div>

          {[1, 2, 3].map(i => (
            <div key={i} className="admin-card-flat p-4 flex justify-between">
              <div className="flex gap-4">
                <SkeletonBox className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <SkeletonBox className="w-32 h-5" />
                  <SkeletonBox className="w-48 h-4" />
                  <SkeletonBox className="w-24 h-4" />
                </div>
              </div>
              <SkeletonBox className="w-20 h-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
