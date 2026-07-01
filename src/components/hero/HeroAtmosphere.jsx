/** Hero background — court blueprint + sport glyphs (pickleball, billiards, KTV). */

function HeroCourtBlueprint() {
  return (
    <svg
      className="hero-court-blueprint"
      viewBox="0 0 200 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="4" y="4" width="192" height="432" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="220" x2="196" y2="220" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="150" x2="196" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <line x1="4" y1="290" x2="196" y2="290" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <line x1="100" y1="4" x2="100" y2="436" stroke="currentColor" strokeWidth="1.2" opacity="0.45" strokeDasharray="4 6" />
      <circle cx="4" cy="220" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="196" cy="220" r="2.5" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

function PickleballGlyph() {
  return (
    <svg viewBox="0 0 120 140" fill="none" aria-hidden className="w-full h-full">
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="8" width="38" height="52" rx="11" transform="rotate(-32 33 34)" />
        <rect x="68" y="8" width="38" height="52" rx="11" transform="rotate(32 87 34)" />
        <line x1="33" y1="58" x2="24" y2="122" strokeWidth="2.4" />
        <line x1="87" y1="58" x2="96" y2="122" strokeWidth="2.4" />
        <circle cx="33" cy="34" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="87" cy="34" r="3" fill="currentColor" opacity="0.5" />
      </g>
      <circle cx="60" cy="112" r="24" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.2" />
      {[
        [50, 102], [60, 98], [70, 102], [46, 112], [74, 112],
        [50, 122], [60, 126], [70, 122], [60, 112],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.4" fill="currentColor" opacity="0.75" />
      ))}
    </svg>
  )
}

function BilliardsGlyph() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden className="w-full h-full">
      {/* Table corner rails */}
      <path
        d="M12 88 L12 28 Q12 12 28 12 L88 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <line x1="12" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <line x1="50" y1="12" x2="50" y2="50" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      {/* 8-ball */}
      <circle cx="78" cy="78" r="28" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
      <circle cx="78" cy="78" r="14" fill="currentColor" fillOpacity="0.2" />
      <text
        x="78"
        y="84"
        textAnchor="middle"
        fill="currentColor"
        fontSize="16"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
        8
      </text>
      {/* Cue ball */}
      <circle cx="38" cy="72" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.06" />
    </svg>
  )
}

function KtvMicGlyph() {
  return (
    <svg viewBox="0 0 100 104" fill="none" aria-hidden className="w-full h-full">
      <rect x="36" y="8" width="28" height="44" rx="14" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
      <path d="M22 44 Q22 68 50 68 Q78 68 78 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="68" x2="50" y2="96" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="34" y1="96" x2="66" y2="96" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Sound waves */}
      <path d="M8 36 Q2 50 8 64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <path d="M92 36 Q98 50 92 64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <path d="M0 30 Q-6 50 0 70" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
      <path d="M100 30 Q106 50 100 70" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
    </svg>
  )
}

const SPORT_GLYPHS = [
  { id: 'pickleball', className: 'hero-sport-glyph hero-sport-glyph--pickleball', label: 'Pickleball', children: <PickleballGlyph /> },
  { id: 'billiards', className: 'hero-sport-glyph hero-sport-glyph--billiards', label: 'Billiards', children: <BilliardsGlyph /> },
  { id: 'ktv', className: 'hero-sport-glyph hero-sport-glyph--ktv', label: 'KTV', children: <KtvMicGlyph /> },
]

function SportGlyph({ className, label, children }) {
  return (
    <div className={className}>
      <div className="hero-sport-glyph-art">{children}</div>
      <span className="hero-sport-label">{label}</span>
    </div>
  )
}

export default function HeroAtmosphere() {
  return (
    <div className="hero-atmosphere absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      <div className="hero-mesh-gradient" />
      <div className="hero-mesh-orb hero-mesh-orb--1" />
      <div className="hero-mesh-orb hero-mesh-orb--2" />
      <div className="hero-atmosphere-glow" />
      <div className="hero-light-sweep" />
      <div className="hero-grain" />

      <HeroCourtBlueprint />

      {SPORT_GLYPHS.map(glyph => (
        <SportGlyph key={glyph.id} className={glyph.className} label={glyph.label}>
          {glyph.children}
        </SportGlyph>
      ))}
    </div>
  )
}
