/* eslint-disable @next/next/no-img-element */

/**
 * PreOne brand assets — the real uploaded logo:
 *   /preone-mark.png  = planet emblem (disc + orbit ring), square, transparent
 *   /preone-logo.png  = full glossy wordmark "PreOne", transparent
 */
export function PLogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/preone-mark.png"
      width={size}
      height={size}
      className={`mark ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}

export function PLogoWordmark({ subtitle = 'Preschool OS' }: { subtitle?: string }) {
  return (
    <span className="wordmark">
      <img src="/preone-logo.png" alt="PreOne" className="wm-img" draggable={false} />
      {subtitle ? <span>{subtitle}</span> : null}
    </span>
  )
}
