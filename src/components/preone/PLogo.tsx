/** PreOne logo — mark geometry per brand rules: gradient sphere + cosmic orbit + star */
export function PLogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`mark ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00CCFF" />
          <stop offset=".5" stopColor="#2B5CFF" />
          <stop offset="1" stopColor="#7A28FF" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#pg-grad)" />
      <ellipse
        cx="24" cy="24" rx="20" ry="7.5"
        fill="none" stroke="#FFB800" strokeWidth="2.5"
        transform="rotate(-18 24 24)"
      />
      <circle cx="38" cy="15" r="3" fill="#FFB800" />
    </svg>
  )
}

export function PLogoWordmark({ subtitle = 'Preschool OS' }: { subtitle?: string }) {
  return (
    <span className="wordmark">
      <b>PreOne</b>
      <span>{subtitle}</span>
    </span>
  )
}
