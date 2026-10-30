import React from 'react'

export interface AuthFrameProps {
  children: React.ReactNode
  className?: string
}

export function AuthFrame({ children, className = '' }: AuthFrameProps) {
  return (
    <div className={`auth-frame w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[500px] mx-auto px-1 sm:px-0 transition-all ${className}`}>
      {children}
    </div>
  )
}
