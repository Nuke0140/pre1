import React from 'react'
import { Card } from '@/components/ui/card'

export interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <Card
      variant="auth"
      className={`auth-card auth-card-enter relative w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.12),0_8px_24px_-8px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-4 sm:p-8 xs:p-6 transition-all relative overflow-hidden ${className}`}
    >
      {/* Subtle Top Highlight Accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />
      {/* Decorative Subtle Corner Glow Accent — smoothly masked with no hard edges */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-purple-200/30 via-indigo-100/10 to-transparent dark:from-purple-900/20 dark:via-purple-950/5 dark:to-transparent blur-2xl pointer-events-none" />
      {children}
    </Card>
  )
}
