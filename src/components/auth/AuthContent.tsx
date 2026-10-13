import React from 'react'

export interface AuthContentProps {
  children: React.ReactNode
  className?: string
}

export function AuthContent({ children, className = '' }: AuthContentProps) {
  return (
    <div className={`auth-content auth-stagger-4 w-full max-w-full relative z-10 ${className}`}>
      {children}
    </div>
  )
}
