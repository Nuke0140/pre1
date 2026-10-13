import React from 'react'

export interface AuthLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

/**
 * Reusable inline action / link for secondary authentication actions.
 * Zero browser borders, zero gray background, subtle hover transitions.
 */
export function AuthLink({ children, className = '', ...props }: AuthLinkProps) {
  return (
    <button
      type="button"
      className={`auth-link-animated relative inline-flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer bg-transparent border-0 py-2 px-2.5 outline-none appearance-none focus-visible:ring-2 focus-visible:ring-purple-500/30 rounded-md min-h-[40px] min-h-[38px] before:absolute before:-inset-2 before:content-[''] before:z-0 select-none ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}
