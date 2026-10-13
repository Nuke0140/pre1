import React from 'react'

export interface AuthHeaderProps {
  title: string
  description?: string
  greeting?: string | null
  className?: string
}

export function AuthHeader({ title, description, greeting, className = '' }: AuthHeaderProps) {
  return (
    <div className={`auth-header auth-stagger-3 text-center mb-4 sm:mb-7 relative z-10 ${className}`}>
      {greeting ? (
        <p className="text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400 mb-1.5 uppercase opacity-90 select-none">
          {greeting}
        </p>
      ) : null}
      <h1 className="font-display text-[var(--font-size-h1)] font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.2]">
        {title}
      </h1>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
