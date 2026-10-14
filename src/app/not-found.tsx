import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-xl p-8 text-center" style={{ backgroundColor: 'var(--card, var(--surface))' }}>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 shadow-sm">
          <FileQuestion className="w-7 h-7" />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
          Error 404
        </span>
        <h1 className="text-xl font-bold text-foreground tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          The preschool workspace or resource you were looking for doesn&apos;t exist or has moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/app"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground !text-white text-sm font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all shadow-sm"
            style={{ color: '#FFFFFF', backgroundColor: 'var(--primary)' }}
          >
            <Home className="w-4 h-4 !text-white stroke-white" />
            <span className="!text-white" style={{ color: '#FFFFFF' }}>Dashboard</span>
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted active:scale-[0.98] transition-all shadow-xs"
            style={{ color: 'var(--foreground)', backgroundColor: 'var(--card, var(--surface))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
