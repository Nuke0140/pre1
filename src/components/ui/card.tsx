import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-white/96 dark:bg-slate-900/96 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs [box-shadow:var(--shadow-premium-card,inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.035))] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.035),0_4px_14px_rgba(0,0,0,0.16)]",
        interactive:
          "bg-white/96 dark:bg-slate-900/96 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs [box-shadow:var(--shadow-premium-card,inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.035))] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.035),0_4px_14px_rgba(0,0,0,0.16)] cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
        elevated:
          "bg-white/98 dark:bg-slate-900/98 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-md",
        flat:
          "bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl",
        premium:
          "premium-card p-5 sm:p-6",
        auth:
          "w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.12),0_8px_24px_-8px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-7 sm:p-9 relative overflow-hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn("font-bold text-slate-900 dark:text-white leading-tight tracking-tight text-base sm:text-lg", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-5 sm:p-6 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-5 sm:p-6 pt-0", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
