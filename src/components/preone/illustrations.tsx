import React from 'react'

export interface IllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  size?: number | string
}

/**
 * Friendly preschool staff / educator illustration
 * Renders the 3D staff team artwork with smooth scaling and hardware acceleration
 */
export function StaffUsersIllustration({
  className = '',
  size = 140,
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 415 415"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
      role="img"
      {...props}
    >
      <image
        href="/animations/staff_users.webp"
        xlinkHref="/animations/staff_users.webp"
        width="415"
        height="415"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  )
}

/**
 * Friendly preschool family illustration
 * Renders the 3D family artwork with smooth scaling and hardware acceleration
 */
export function FamilyUsersIllustration({
  className = '',
  size = 140,
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 379 379"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
      role="img"
      {...props}
    >
      <image
        href="/animations/family_users.webp"
        xlinkHref="/animations/family_users.webp"
        width="379"
        height="379"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  )
}

/**
 * Empty search / no records preschool illustration
 * Features friendly magnifying glass, learning sparkles, and soft card glow
 */
export function EmptyUsersIllustration({
  className = '',
  size = 140,
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="empty-glow" x1="30" y1="20" x2="130" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--preone-primary-soft, #F3EEFF)" stopOpacity="0.8" />
          <stop stopColor="#F0FDF4" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="folder-grad" x1="40" y1="50" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EDE9FE" />
          <stop stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient id="glass-lens" x1="75" y1="45" x2="115" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" stopOpacity="0.5" />
          <stop stopColor="#60A5FA" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx="80" cy="70" r="54" fill="url(#empty-glow)" />

      {/* Floating Sparkles & Confetti */}
      <path d="M125 32L127 36.5L131.5 38.5L127 40.5L125 45L123 40.5L118.5 38.5L123 36.5L125 32Z" fill="#F59E0B" />
      <path d="M35 75L36.5 78.5L40 80L36.5 81.5L35 85L33.5 81.5L30 80L33.5 78.5L35 75Z" fill="#A855F7" />
      <circle cx="128" cy="85" r="3" fill="#3B82F6" opacity="0.6" />
      <circle cx="48" cy="38" r="3" fill="#10B981" opacity="0.5" />

      {/* Preschool Clipboard / Folder Base */}
      <rect x="42" y="48" width="76" height="64" rx="12" fill="url(#folder-grad)" stroke="#C4B5FD" strokeWidth="2" />
      {/* Clipboard Clip */}
      <rect x="66" y="42" width="28" height="12" rx="4" fill="#8B5CF6" />
      <circle cx="80" cy="48" r="2.5" fill="#FFFFFF" />

      {/* Empty lines */}
      <rect x="54" y="66" width="52" height="4" rx="2" fill="#C4B5FD" opacity="0.8" />
      <rect x="54" y="76" width="38" height="4" rx="2" fill="#C4B5FD" opacity="0.6" />
      <rect x="54" y="86" width="44" height="4" rx="2" fill="#C4B5FD" opacity="0.4" />

      {/* Cute Magnifying Glass */}
      <circle cx="95" cy="65" r="24" fill="url(#glass-lens)" stroke="#7C3AED" strokeWidth="3.5" />
      <ellipse cx="88" cy="56" rx="4" ry="7" transform="rotate(-30 88 56)" fill="#FFFFFF" opacity="0.6" />
      {/* Glass Handle */}
      <path d="M112 82L126 96" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" />
      <path d="M112 82L126 96" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />

      {/* Cheerful Smiley in Lens */}
      <circle cx="90" cy="64" r="2" fill="#6D28D9" />
      <circle cx="100" cy="64" r="2" fill="#6D28D9" />
      <path d="M92 70C93.5 72.5 96.5 72.5 98 70" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * CSV Bulk Import & Upload preschool illustration
 * Features friendly spreadsheet, cloud arrow, and upload sparkle elements
 */
export function CsvUploadIllustration({
  className = '',
  size = 140,
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="csv-glow" x1="30" y1="20" x2="130" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ECFDF5" stopOpacity="0.9" />
          <stop stopColor="var(--preone-primary-soft, #F3EEFF)" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="sheet-grad" x1="40" y1="40" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop stopColor="#F8FAFC" />
        </linearGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx="80" cy="70" r="54" fill="url(#csv-glow)" />

      {/* Sparkles */}
      <path d="M125 36L127 40L131 42L127 44L125 48L123 44L119 42L123 40L125 36Z" fill="#10B981" />
      <circle cx="38" cy="80" r="3" fill="#F59E0B" opacity="0.6" />
      <circle cx="126" cy="88" r="2.5" fill="#6366F1" opacity="0.6" />

      {/* Spreadsheet Document */}
      <rect x="44" y="38" width="72" height="74" rx="10" fill="url(#sheet-grad)" stroke="#10B981" strokeWidth="2" />

      {/* Green Header Banner */}
      <path d="M44 48C44 42.4772 48.4772 38 54 38H106C111.523 38 116 42.4772 116 48V54H44V48Z" fill="#10B981" />
      <rect x="52" y="44" width="16" height="4" rx="2" fill="#FFFFFF" opacity="0.9" />
      <rect x="72" y="44" width="20" height="4" rx="2" fill="#FFFFFF" opacity="0.7" />

      {/* Spreadsheet Grid Lines */}
      <line x1="44" y1="68" x2="116" y2="68" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="44" y1="82" x2="116" y2="82" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="44" y1="96" x2="116" y2="96" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="74" y1="54" x2="74" y2="110" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Grid sample data blocks */}
      <rect x="50" y="59" width="18" height="4" rx="1.5" fill="#3B82F6" opacity="0.7" />
      <rect x="80" y="59" width="26" height="4" rx="1.5" fill="#94A3B8" opacity="0.5" />
      <rect x="50" y="73" width="15" height="4" rx="1.5" fill="#10B981" opacity="0.7" />
      <rect x="80" y="73" width="22" height="4" rx="1.5" fill="#94A3B8" opacity="0.5" />
      <rect x="50" y="87" width="18" height="4" rx="1.5" fill="#8B5CF6" opacity="0.7" />
      <rect x="80" y="87" width="20" height="4" rx="1.5" fill="#94A3B8" opacity="0.5" />

      {/* Upload Cloud Pill Badge */}
      <g transform="translate(86, 76)">
        <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
        <path d="M20 12L15 17H18V24H22V17H25L20 12Z" fill="#FFFFFF" />
        <path d="M14 26H26" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/**
 * Roles & RBAC Security illustration
 * Features friendly security shield, golden key, and permission checkmarks
 */
export function SecurityShieldIllustration({
  className = '',
  size = 140,
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="shield-glow" x1="30" y1="20" x2="130" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--preone-primary-soft, #F3EEFF)" stopOpacity="0.85" />
          <stop stopColor="#EFF6FF" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="shield-grad" x1="50" y1="36" x2="110" y2="115" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop stopColor="#6D28D9" />
        </linearGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx="80" cy="70" r="54" fill="url(#shield-glow)" />

      {/* Floating Sparkles */}
      <path d="M125 36L127 40L131 42L127 44L125 48L123 44L119 42L123 40L125 36Z" fill="#F59E0B" />
      <circle cx="36" cy="60" r="2.5" fill="#3B82F6" opacity="0.6" />

      {/* Main Shield */}
      <path
        d="M80 34L112 46V72C112 94 98 110 80 118C62 110 48 94 48 72V46L80 34Z"
        fill="url(#shield-grad)"
        stroke="#FFFFFF"
        strokeWidth="3"
      />

      {/* Inner Shield Accent */}
      <path
        d="M80 42L104 51V71C104 88 93 101 80 108C67 101 56 88 56 71V51L80 42Z"
        fill="#7C3AED"
        opacity="0.85"
      />

      {/* Golden Key in Shield */}
      <circle cx="80" cy="64" r="8" fill="none" stroke="#FDE047" strokeWidth="3.5" />
      <path d="M80 72V88" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M80 78H86" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
      <path d="M80 84H85" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />

      {/* Permission Checkmark Badge */}
      <circle cx="112" cy="88" r="14" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M107 88L110.5 91.5L117 85" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Cheerful preschool learning banner illustration
 * Features young children exploring, learning blocks, paper airplane, books, gentle sunshine,
 * and the visual phrase "Small Steps, Big Futures"
 */
export function PreschoolLearningBannerIllustration({
  className = '',
  size,
  ...props
}: IllustrationProps) {
  return (
    <svg
      width={size ?? 320}
      height={size ? undefined : 96}
      viewBox="0 0 340 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="banner-sun" x1="280" y1="10" x2="330" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" stopOpacity="0.9" />
          <stop stopColor="#F59E0B" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="banner-glow" x1="40" y1="20" x2="300" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary-light, #F3EEFF)" stopOpacity="0.75" />
          <stop stopColor="#EFF6FF" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="book-spine" x1="130" y1="65" x2="165" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="kid-shirt" x1="70" y1="60" x2="105" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary, #7C3AED)" />
          <stop stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id="plane-grad" x1="240" y1="18" x2="270" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Ambient background soft cloud / aura */}
      <path
        d="M30 65C30 45 48 30 70 30C82 30 92 35 98 42C106 32 120 25 138 25C162 25 180 40 185 58C194 50 208 45 224 45C248 45 268 62 270 82H30V65Z"
        fill="url(#banner-glow)"
        opacity="0.7"
      />

      {/* Gentle Rising Sunshine in top right */}
      <circle cx="295" cy="32" r="22" fill="url(#banner-sun)" />
      {/* Sun rays */}
      <line x1="295" y1="4" x2="295" y2="8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="316" y1="11" x2="313" y2="14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="324" y1="32" x2="320" y2="32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="274" y1="11" x2="277" y2="14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Floating Paper Airplane with curved trail */}
      <path
        d="M170 55C195 52 215 35 242 28"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeDasharray="2 3"
        strokeLinecap="round"
      />
      <g transform="translate(242, 22) rotate(-15)">
        <polygon points="0,6 18,0 8,14" fill="url(#plane-grad)" />
        <polygon points="18,0 8,14 8,8" fill="#BAE6FD" />
      </g>

      {/* Cheerful Preschool Learner (Left) */}
      {/* Torso / Clothes */}
      <path d="M72 96C72 78 79 66 90 66C101 66 108 78 108 96H72Z" fill="url(#kid-shirt)" />
      {/* Collar */}
      <path d="M86 66L90 73L94 66H86Z" fill="#FFFFFF" />
      {/* Neck & Head */}
      <rect x="87" y="58" width="6" height="8" rx="2" fill="#FCD34D" />
      <circle cx="90" cy="46" r="14" fill="#FDE68A" />
      {/* Hair */}
      <path d="M76 43C76 33 83 27 92 27C101 27 106 33 105 40C102 38 98 35 91 35C85 35 80 39 77 43Z" fill="#334155" />
      {/* Eyes & Smile */}
      <circle cx="86" cy="45" r="1.5" fill="#1E293B" />
      <circle cx="94" cy="45" r="1.5" fill="#1E293B" />
      <path d="M88 51C89.5 53 91.5 53 93 51" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" />
      {/* Blush */}
      <circle cx="83" cy="49" r="2" fill="#F87171" opacity="0.45" />
      <circle cx="97" cy="49" r="2" fill="#F87171" opacity="0.45" />

      {/* Stacked Learning Blocks (A & B) */}
      <rect x="36" y="74" width="22" height="22" rx="5" fill="#3B82F6" />
      <rect x="38" y="76" width="18" height="18" rx="3.5" fill="#60A5FA" opacity="0.25" />
      <text x="47" y="89" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="var(--font-sans, sans-serif)" textAnchor="middle">A</text>

      <rect x="48" y="56" width="18" height="18" rx="4" fill="#F59E0B" />
      <rect x="50" y="58" width="14" height="14" rx="3" fill="#FDE68A" opacity="0.3" />
      <text x="57" y="70" fill="#FFFFFF" fontSize="10" fontWeight="800" fontFamily="var(--font-sans, sans-serif)" textAnchor="middle">B</text>

      {/* Open Storybook in center */}
      <path d="M125 78C132 75 140 76 146 80V96C140 92 132 91 125 94V78Z" fill="#38BDF8" />
      <path d="M167 78C160 75 152 76 146 80V96C152 92 160 91 167 94V78Z" fill="#0284C7" />
      <path d="M126 79C132 76 139 77 145 81V94C139 91 132 90 126 93V79Z" fill="#FFFFFF" />
      <path d="M166 79C160 76 153 77 147 81V94C153 91 160 90 166 93V79Z" fill="#F8FAFC" />
      <line x1="131" y1="84" x2="141" y2="84" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
      <line x1="131" y1="88" x2="139" y2="88" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
      <line x1="151" y1="84" x2="161" y2="84" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
      <line x1="151" y1="88" x2="159" y2="88" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />

      {/* Sparkles / Stars */}
      <path d="M210 24L211.5 27.5L215 29L211.5 30.5L210 34L208.5 30.5L205 29L208.5 27.5L210 24Z" fill="#F59E0B" />
      <path d="M116 28L117 30L119 31L117 32L116 34L115 32L113 31L115 30L116 28Z" fill="#A855F7" />
      <circle cx="280" cy="65" r="2" fill="#10B981" />
      <circle cx="188" cy="72" r="2.5" fill="#EC4899" opacity="0.6" />

      {/* Visual Motto Badge: "Small Steps, Big Futures" */}
      <g transform="translate(182, 68)">
        <rect width="146" height="24" rx="12" fill="var(--bg-card, #FFFFFF)" stroke="var(--border-default, #E5E7EB)" strokeWidth="1" />
        <circle cx="14" cy="12" r="4" fill="#F59E0B" />
        <path d="M14 9.5L14.7 11.2L16.5 12L14.7 12.8L14 14.5L13.3 12.8L11.5 12L13.3 11.2L14 9.5Z" fill="#FFFFFF" />
        <text
          x="26"
          y="16"
          fill="var(--text-primary, #0F172A)"
          fontSize="10.5"
          fontWeight="700"
          fontFamily="var(--font-sans, sans-serif)"
          letterSpacing="-0.01em"
        >
          Small Steps, Big Futures
        </text>
      </g>
    </svg>
  )
}

export const StartMenuIllustration = PreschoolLearningBannerIllustration

/**
 * Subtle preschool decorative stars & pastel particles for the PreOne Dock / Global Bottom Navigation
 * Non-interactive, aria-hidden, lightweight SVG using canonical theme variables.
 */
export function DockStarsAccent({
  className = '',
  variant = 'left',
  ...props
}: {
  className?: string
  variant?: 'left' | 'right' | 'sparkle'
} & React.SVGProps<SVGSVGElement>) {
  if (variant === 'sparkle') {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path
          d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z"
          fill="var(--warning, #F59E0B)"
          opacity="0.65"
        />
        <circle cx="16" cy="4" r="1.5" fill="var(--info, #3B82F6)" opacity="0.5" />
      </svg>
    )
  }

  return (
    <svg
      width="72"
      height="32"
      viewBox="0 0 72 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 4-point soft star */}
      <path
        d="M16 6L18 12L24 14L18 16L16 22L14 16L8 14L14 12L16 6Z"
        fill="var(--warning, #F59E0B)"
        opacity="0.7"
      />
      {/* Tiny pastel dots */}
      <circle cx="34" cy="18" r="2.2" fill="var(--primary, #7C3AED)" opacity="0.45" />
      <circle cx="48" cy="11" r="1.8" fill="var(--info, #3B82F6)" opacity="0.5" />
      <circle cx="60" cy="21" r="1.4" fill="var(--danger, #F43F5E)" opacity="0.4" />
      {/* Miniature sparkle */}
      <path
        d="M42 6L43 8.5L45.5 9.5L43 10.5L42 13L41 10.5L38.5 9.5L41 8.5L42 6Z"
        fill="var(--primary, #7C3AED)"
        opacity="0.4"
      />
    </svg>
  )
}

export const PreOneDecorativeAccent = DockStarsAccent
