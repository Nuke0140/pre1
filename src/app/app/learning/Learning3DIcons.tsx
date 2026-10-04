import React from 'react'

/**
 * PreOne — High-Fidelity 3D Preschool Learning Icons
 *
 * Designed with volumetric multi-stop gradients, ambient occlusion shadows,
 * specular highlights, and soft pastel depth.
 * Zero external font or 3D library dependencies, hardware-accelerated SVG.
 */

export function Courses3DIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Courses 3D Icon"
    >
      <defs>
        {/* Ambient base shadow */}
        <radialGradient id="course-base-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Book 1 (Bottom - Royal Indigo) */}
        <linearGradient id="book1-top" x1="40" y1="120" x2="200" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="book1-spine" x1="40" y1="125" x2="40" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3730a3" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Book 2 (Middle - Mint & Teal) */}
        <linearGradient id="book2-top" x1="50" y1="95" x2="190" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="book2-spine" x1="50" y1="100" x2="50" y2="122" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#134e4a" />
        </linearGradient>

        {/* Book 3 (Top - Warm Coral / Peach) */}
        <linearGradient id="book3-top" x1="60" y1="72" x2="180" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="60%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#fda4af" />
        </linearGradient>
        <linearGradient id="book3-spine" x1="60" y1="76" x2="60" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Graduation Cap (Deep Sapphire with Gold Tassel) */}
        <linearGradient id="grad-cap-top" x1="120" y1="20" x2="120" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="gold-tassel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Ground drop shadow */}
      <ellipse cx="120" cy="158" rx="80" ry="14" fill="url(#course-base-shadow)" />

      {/* === Book 1 (Bottom) === */}
      {/* Spine / Front */}
      <rect x="42" y="132" width="156" height="20" rx="4" fill="url(#book1-spine)" />
      {/* Pages edge */}
      <path d="M48 136 H194 V148 H48 Z" fill="#f8fafc" />
      <path d="M48 139 H194 M48 142 H194 M48 145 H194" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
      {/* Top Cover */}
      <rect x="38" y="124" width="164" height="12" rx="4" fill="url(#book1-top)" />

      {/* === Book 2 (Middle) === */}
      <rect x="52" y="106" width="136" height="18" rx="4" fill="url(#book2-spine)" />
      <path d="M58 110 H184 V120 H58 Z" fill="#f8fafc" />
      <path d="M58 113 H184 M58 116 H184" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
      <rect x="48" y="98" width="144" height="11" rx="4" fill="url(#book2-top)" />

      {/* === Book 3 (Top) === */}
      <rect x="62" y="80" width="116" height="18" rx="4" fill="url(#book3-spine)" />
      <path d="M68 84 H174 V94 H68 Z" fill="#fff1f2" />
      <rect x="58" y="72" width="124" height="11" rx="4" fill="url(#book3-top)" />

      {/* Ribbon Bookmark */}
      <path
        d="M148 78 V108 L154 104 L160 108 V78 Z"
        fill="url(#gold-tassel)"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
      />

      {/* === Graduation Cap === */}
      {/* Cap Skull Base */}
      <path
        d="M96 52 C96 50 144 50 144 52 L140 68 C140 73 100 73 100 68 Z"
        fill="#1e3a8a"
        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
      />
      {/* Cap Diamond Top */}
      <path
        d="M120 22 L178 40 L120 58 L62 40 Z"
        fill="url(#grad-cap-top)"
        stroke="#93c5fd"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Top Button */}
      <circle cx="120" cy="40" r="4.5" fill="url(#gold-tassel)" />
      {/* Golden Tassel String */}
      <path
        d="M120 40 Q152 44 156 64"
        fill="none"
        stroke="url(#gold-tassel)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Tassel Fringe */}
      <rect x="153" y="64" width="6" height="14" rx="2" fill="url(#gold-tassel)" />

      {/* Floating Magic Stars */}
      <path
        d="M48 50 L50 43 L57 45 L52 50 L54 57 L48 53 L42 57 L44 50 L39 45 L46 43 Z"
        fill="#facc15"
        opacity="0.9"
        transform="scale(0.8) translate(10, 10)"
      />
      <circle cx="196" cy="48" r="3.5" fill="#38bdf8" opacity="0.85" />
      <circle cx="188" cy="120" r="2.5" fill="#f43f5e" opacity="0.7" />
    </svg>
  )
}

export function Rhymes3DIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Poems and Rhymes 3D Icon"
    >
      <defs>
        <radialGradient id="rhyme-base-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Note Gradient (Magenta to Lavender) */}
        <linearGradient id="rhyme-note-grad" x1="80" y1="30" x2="160" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Bell Gradient (Golden Brass) */}
        <linearGradient id="rhyme-bell-grad" x1="40" y1="80" x2="90" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        <linearGradient id="bubble-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Ground drop shadow */}
      <ellipse cx="120" cy="158" rx="75" ry="14" fill="url(#rhyme-base-shadow)" />

      {/* Background Soundwave Ring */}
      <circle cx="120" cy="90" r="62" stroke="#e0e7ff" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.6" />
      <circle cx="120" cy="90" r="76" stroke="#fae8ff" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.8" />

      {/* === Left: 3D Golden Melody Bell === */}
      <g transform="translate(18, 30)">
        {/* Bell Body */}
        <path
          d="M60 70 C60 52 74 48 84 48 C94 48 108 52 108 70 C108 84 116 92 118 96 H50 C52 92 60 84 60 70 Z"
          fill="url(#rhyme-bell-grad)"
          filter="drop-shadow(0 4px 8px rgba(234,179,8,0.3))"
        />
        {/* Bell Rim Base */}
        <ellipse cx="84" cy="96" rx="34" ry="7" fill="#ca8a04" />
        <ellipse cx="84" cy="95" rx="33" ry="5.5" fill="#fde047" />
        {/* Bell Clapper */}
        <circle cx="84" cy="103" r="6" fill="#a16207" />
        {/* Top Rivet */}
        <rect x="80" y="42" width="8" height="8" rx="3" fill="#ca8a04" />
      </g>

      {/* === Center & Right: 3D Double Eighth Note === */}
      <g filter="drop-shadow(0 8px 16px rgba(168,85,247,0.35))">
        {/* Left Note Head (Sphere) */}
        <ellipse cx="106" cy="132" rx="16" ry="12" transform="rotate(-20 106 132)" fill="url(#rhyme-note-grad)" />
        <ellipse cx="104" cy="130" rx="7" ry="4" transform="rotate(-20 104 130)" fill="#fbcfe8" opacity="0.7" />

        {/* Right Note Head (Sphere) */}
        <ellipse cx="164" cy="116" rx="16" ry="12" transform="rotate(-20 164 116)" fill="url(#rhyme-note-grad)" />
        <ellipse cx="162" cy="114" rx="7" ry="4" transform="rotate(-20 162 114)" fill="#fbcfe8" opacity="0.7" />

        {/* Stems */}
        <rect x="115" y="52" width="7" height="78" rx="3.5" fill="url(#rhyme-note-grad)" />
        <rect x="173" y="36" width="7" height="78" rx="3.5" fill="url(#rhyme-note-grad)" />

        {/* Top Connecting Beam */}
        <path
          d="M115 52 L180 36 V48 L115 64 Z"
          fill="url(#rhyme-note-grad)"
        />
        {/* Secondary Beam */}
        <path
          d="M115 68 L180 52 V60 L115 76 Z"
          fill="url(#rhyme-note-grad)"
        />
      </g>

      {/* Floating Musical Bubbles & Star Sparkles */}
      <circle cx="70" cy="52" r="7" fill="url(#bubble-cyan)" />
      <circle cx="68" cy="50" r="2" fill="#ffffff" opacity="0.8" />

      <circle cx="192" cy="74" r="9" fill="url(#bubble-cyan)" />
      <circle cx="190" cy="71" r="3" fill="#ffffff" opacity="0.8" />

      <path
        d="M136 24 L138 18 L144 20 L140 25 L142 31 L136 28 L130 31 L132 25 L128 20 L134 18 Z"
        fill="#facc15"
      />
    </svg>
  )
}

export function Stories3DIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Stories 3D Icon"
    >
      <defs>
        <radialGradient id="story-base-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Book Cover (Warm Emerald & Gold) */}
        <linearGradient id="story-cover-left" x1="40" y1="130" x2="120" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="story-cover-right" x1="120" y1="130" x2="200" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Parchment Pages (Cream & Warm Amber) */}
        <linearGradient id="story-page-left" x1="50" y1="70" x2="116" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="story-page-right" x1="124" y1="70" x2="190" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>

        {/* Magic Glowing Star Beam */}
        <linearGradient id="magic-beam" x1="120" y1="30" x2="120" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ground drop shadow */}
      <ellipse cx="120" cy="156" rx="80" ry="14" fill="url(#story-base-shadow)" />

      {/* === Magical Back Glow / Beam === */}
      <path d="M120 28 L152 114 H88 Z" fill="url(#magic-beam)" opacity="0.6" />

      {/* === Open Book Hardcover Base === */}
      {/* Spine hinge */}
      <path d="M116 114 C118 116 122 116 124 114 L126 138 C122 142 118 142 114 138 Z" fill="#065f46" />
      {/* Left Cover */}
      <path d="M38 126 C72 122 112 126 116 136 L116 116 C112 108 72 104 38 108 Z" fill="url(#story-cover-left)" />
      {/* Right Cover */}
      <path d="M202 126 C168 122 128 126 124 136 L124 116 C128 108 168 104 202 108 Z" fill="url(#story-cover-right)" />

      {/* === Left Pages (Curved 3D block) === */}
      <path
        d="M44 118 C78 112 114 116 118 126 V96 C114 86 78 82 44 88 Z"
        fill="url(#story-page-left)"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
      />
      {/* Left page text lines */}
      <path d="M56 96 C72 94 92 95 104 100" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M56 104 C72 102 92 103 104 108" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* === Right Pages (Curved 3D block) === */}
      <path
        d="M196 118 C162 112 126 116 122 126 V96 C126 86 162 82 196 88 Z"
        fill="url(#story-page-right)"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
      />
      {/* Right page illustration silhouette (Tree / Castle) */}
      <path
        d="M152 110 L160 92 L168 110 Z"
        fill="#b45309"
        opacity="0.3"
      />

      {/* === Rising Magic Star / Wonder Lantern === */}
      <g filter="drop-shadow(0 0 12px rgba(250,204,21,0.8))">
        {/* Central Rising Star */}
        <path
          d="M120 22 L124 38 L140 42 L124 46 L120 62 L116 46 L100 42 L116 38 Z"
          fill="#fef08a"
          stroke="#facc15"
          strokeWidth="1.5"
        />
        <circle cx="120" cy="42" r="3.5" fill="#ffffff" />
      </g>

      {/* Floating Fairy Dust / Wonder Orbs */}
      <circle cx="92" cy="44" r="3" fill="#fb923c" />
      <circle cx="148" cy="48" r="3.5" fill="#facc15" />
      <circle cx="166" cy="34" r="2.5" fill="#38bdf8" />
      <circle cx="78" cy="68" r="2" fill="#f43f5e" />
    </svg>
  )
}

export function Games3DIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Games 3D Icon"
    >
      <defs>
        <radialGradient id="game-base-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Block 1 (Mint) */}
        <linearGradient id="block-mint-top" x1="45" y1="90" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id="block-mint-front" x1="45" y1="105" x2="45" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>

        {/* Block 2 (Coral / Orange) */}
        <linearGradient id="block-coral-top" x1="145" y1="90" x2="185" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient id="block-coral-front" x1="145" y1="105" x2="145" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>

        {/* Block 3 (Sunny Yellow) */}
        <linearGradient id="block-yellow-top" x1="95" y1="45" x2="135" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <linearGradient id="block-yellow-front" x1="95" y1="60" x2="95" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Gamepad Console (Soft Lavender / Sky) */}
        <linearGradient id="gamepad-grad" x1="70" y1="110" x2="170" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Ground drop shadow */}
      <ellipse cx="120" cy="158" rx="80" ry="14" fill="url(#game-base-shadow)" />

      {/* === Block 1 (Bottom Left - Mint "A") === */}
      <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))">
        {/* Top face */}
        <path d="M46 104 L68 92 L90 104 L68 116 Z" fill="url(#block-mint-top)" />
        {/* Front face */}
        <path d="M46 104 L68 116 V142 L46 130 Z" fill="url(#block-mint-front)" />
        {/* Right face */}
        <path d="M68 116 L90 104 V130 L68 142 Z" fill="#0d9488" />
        {/* Embossed Letter 'A' */}
        <text x="54" y="127" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">A</text>
      </g>

      {/* === Block 2 (Bottom Right - Coral "B") === */}
      <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))">
        {/* Top face */}
        <path d="M140 104 L162 92 L184 104 L162 116 Z" fill="url(#block-coral-top)" />
        {/* Front face */}
        <path d="M140 104 L162 116 V142 L140 130 Z" fill="url(#block-coral-front)" />
        {/* Right face */}
        <path d="M162 116 L184 104 V130 L162 142 Z" fill="#9f1239" />
        {/* Embossed Number '1' */}
        <text x="148" y="127" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">1</text>
      </g>

      {/* === Block 3 (Top Center - Yellow Star) === */}
      <g filter="drop-shadow(0 6px 10px rgba(0,0,0,0.15))">
        {/* Top face */}
        <path d="M98 62 L120 50 L142 62 L120 74 Z" fill="url(#block-yellow-top)" />
        {/* Front face */}
        <path d="M98 62 L120 74 V98 L98 86 Z" fill="url(#block-yellow-front)" />
        {/* Right face */}
        <path d="M120 74 L142 62 V86 L120 98 Z" fill="#a16207" />
        {/* Embossed Star */}
        <path
          d="M108 81 L110 76 L113 77 L111 80 L113 83 L109 82 L107 84 L107 81 L105 79 L108 78 Z"
          fill="#ffffff"
        />
      </g>

      {/* === Foreground 3D Tactile Controller === */}
      <g filter="drop-shadow(0 8px 16px rgba(99,102,241,0.35))">
        {/* Controller Pill Body */}
        <rect x="76" y="128" width="88" height="36" rx="18" fill="url(#gamepad-grad)" />
        <rect x="78" y="130" width="84" height="32" rx="16" fill="none" stroke="#818cf8" strokeWidth="1.5" />

        {/* D-Pad (Left) */}
        <path
          d="M94 142 H102 M98 138 V146"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Action Buttons (Right) */}
        <circle cx="138" cy="146" r="3.5" fill="#facc15" />
        <circle cx="148" cy="146" r="3.5" fill="#4ade80" />
        <circle cx="143" cy="138" r="3.5" fill="#f43f5e" />

        {/* Center Guide / Light */}
        <ellipse cx="120" cy="144" rx="4" ry="2" fill="#38bdf8" />
      </g>

      {/* Sparkles */}
      <circle cx="186" cy="42" r="3.5" fill="#facc15" />
      <circle cx="56" cy="48" r="2.5" fill="#38bdf8" />
    </svg>
  )
}
