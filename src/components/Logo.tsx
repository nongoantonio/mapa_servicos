/** Logótipo KUBIKA: pin verde com a silhueta da cidade e uma folha */
export default function Logo({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="kb-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path
        d="M32 2C17 2 6 13 6 27c0 17 20 36 24.5 40.5a2.4 2.4 0 0 0 3 0C38 63 58 44 58 27 58 13 47 2 32 2Z"
        fill="url(#kb-pin)"
      />
      <circle cx="32" cy="27" r="19" fill="#052e1a" />
      <g fill="#bbf7d0">
        <rect x="20" y="25" width="5" height="15" rx="1" />
        <rect x="26.500" y="16" width="6" height="24" rx="1" />
        <rect x="34" y="22" width="5" height="18" rx="1" />
        <rect x="40" y="29" width="4" height="11" rx="1" />
      </g>
      <path d="M47 47c-10 1-17-3-18-12 10-1 17 3 18 12Z" fill="#4ade80" />
      <path d="M46 46 36 38" stroke="#052e1a" strokeWidth="1.500" fill="none" strokeLinecap="round" />
    </svg>
  )
}