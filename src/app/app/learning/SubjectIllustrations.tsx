import React from 'react'

/**
 * PreOne — High-Fidelity Educational Subject SVG Illustrations
 * 
 * Clean, modern preschool vector illustrations matching the reference design:
 * 1. English: Alphabet letter blocks (A, B, C) with pencil / phonics book
 * 2. Mathematics: Numbers (1, 2, 3), ruler, abacus beads & geometric shapes
 * 3. EVS & General Awareness: Globe, green sprout, magnifying glass & sun
 * 4. Creativity & Life Skills: Artist palette, paintbrush, musical note & cheerful heart
 */

export function EnglishSubjectIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="English Language & Phonics">
      <defs>
        <linearGradient id="eng-bg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="eng-block-a" x1="12" y1="24" x2="40" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="eng-block-b" x1="38" y1="36" x2="66" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="pencil-body" x1="26" y1="14" x2="68" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>

      {/* Rounded squircle container background */}
      <rect width="80" height="80" rx="20" fill="url(#eng-bg)" />

      {/* Soft internal gloss */}
      <circle cx="24" cy="20" r="16" fill="white" fillOpacity="0.12" />

      {/* Block A */}
      <rect x="14" y="24" width="28" height="28" rx="8" fill="url(#eng-block-a)" stroke="#93c5fd" strokeWidth="1.5" />
      <text x="28" y="44" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="sans-serif">
        A
      </text>

      {/* Block B */}
      <rect x="38" y="36" width="28" height="28" rx="8" fill="url(#eng-block-b)" stroke="#fde68a" strokeWidth="1.5" />
      <text x="52" y="56" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="sans-serif">
        B
      </text>

      {/* Pencil across top right */}
      <g transform="rotate(-35 56 22)">
        <rect x="42" y="18" width="28" height="7" rx="3" fill="url(#pencil-body)" />
        <polygon points="70,18 78,21.5 70,25" fill="#fde047" />
        <polygon points="75,20.5 78,21.5 75,22.5" fill="#1e293b" />
        <rect x="39" y="18" width="5" height="7" rx="1.5" fill="#cbd5e1" />
      </g>
    </svg>
  )
}

export function MathSubjectIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Mathematics & Early Numeracy">
      <defs>
        <linearGradient id="math-bg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="math-grid" x1="16" y1="16" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Squircle container background */}
      <rect width="80" height="80" rx="20" fill="url(#math-bg)" />

      {/* Subtle abacus wire background */}
      <line x1="16" y1="28" x2="64" y2="28" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="40" x2="64" y2="40" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="52" x2="64" y2="52" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />

      {/* Abacus Beads */}
      <circle cx="28" cy="28" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="42" cy="28" r="5" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="54" cy="40" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="24" cy="52" r="5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="38" cy="52" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

      {/* Math symbols floating badge */}
      <rect x="36" y="44" width="30" height="24" rx="7" fill="#ffffff" />
      <text x="43" y="61" fill="#d97706" fontSize="15" fontWeight="900" fontFamily="sans-serif">
        1
      </text>
      <text x="52" y="61" fill="#2563eb" fontSize="14" fontWeight="900" fontFamily="sans-serif">
        +
      </text>
      <text x="59" y="61" fill="#ec4899" fontSize="15" fontWeight="900" fontFamily="sans-serif">
        2
      </text>
    </svg>
  )
}

export function EVSSubjectIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="EVS & General Awareness">
      <defs>
        <linearGradient id="evs-bg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="globe-water" x1="20" y1="20" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Squircle container background */}
      <rect width="80" height="80" rx="20" fill="url(#evs-bg)" />

      {/* Radiant Sun in top right */}
      <circle cx="62" cy="18" r="9" fill="#fde047" />
      <line x1="62" y1="5" x2="62" y2="7" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
      <line x1="49" y1="18" x2="51" y2="18" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
      <line x1="73" y1="18" x2="75" y2="18" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
      <line x1="53" y1="9" x2="55" y2="11" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />

      {/* Earth Mini-Globe */}
      <circle cx="34" cy="46" r="20" fill="url(#globe-water)" stroke="#ffffff" strokeWidth="2" />
      {/* Continents */}
      <path
        d="M26 38 C30 36, 36 37, 39 42 C41 45, 45 47, 43 53 C39 56, 32 58, 24 55 C20 51, 21 44, 26 38 Z"
        fill="#4ade80"
      />
      <circle cx="44" cy="36" r="4" fill="#4ade80" />

      {/* Growing Green Sprout Leaf */}
      <g transform="translate(42, 38)">
        <path
          d="M6 14 C10 10, 16 9, 20 6 C20 12, 18 18, 11 20 C9 20, 7 18, 6 14 Z"
          fill="#86efac"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <path d="M7 17 C9 15, 12 14, 16 11" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" />
        <path d="M4 22 C5 18, 6 15, 7 13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function CreativitySubjectIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Creativity & Life Skills">
      <defs>
        <linearGradient id="art-bg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="palette-wood" x1="16" y1="20" x2="64" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>
      </defs>

      {/* Squircle container background */}
      <rect width="80" height="80" rx="20" fill="url(#art-bg)" />

      {/* Artist Palette */}
      <path
        d="M22 46 C18 36, 26 24, 40 24 C54 24, 62 33, 60 45 C58 53, 51 58, 44 57 C41 57, 39 53, 37 53 C34 53, 33 58, 27 57 C23 56, 23 50, 22 46 Z"
        fill="url(#palette-wood)"
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* Paint Color Blobs */}
      <circle cx="32" cy="32" r="3.5" fill="#ef4444" />
      <circle cx="43" cy="30" r="3.5" fill="#3b82f6" />
      <circle cx="52" cy="37" r="3.5" fill="#eab308" />
      <circle cx="48" cy="48" r="3.5" fill="#10b981" />

      {/* Palette Thumb Hole */}
      <ellipse cx="28" cy="46" rx="3.5" ry="4" fill="#6d28d9" opacity="0.6" />

      {/* Paintbrush dipping diagonally */}
      <g transform="rotate(35 48 38)">
        <rect x="36" y="22" width="5" height="26" rx="2.5" fill="#b45309" stroke="#ffffff" strokeWidth="1" />
        <rect x="35.5" y="44" width="6" height="6" fill="#cbd5e1" />
        <path d="M35.5 50 C35.5 54, 38.5 57, 38.5 57 C38.5 57, 41.5 54, 41.5 50 Z" fill="#ec4899" />
      </g>
    </svg>
  )
}
