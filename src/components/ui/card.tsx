import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-white/96 dark:bg-slate-900/96 border border-border/60 dark:border-border/40 rounded-2xl [box-shadow:var(--shadow-1)] transition-all",
        interactive:
          "bg-white/96 dark:bg-slate-900/96 border border-border/60 dark:border-border/40 rounded-2xl [box-shadow:var(--shadow-1)] cursor-pointer hover:border-border/80 dark:hover:border-border/60 hover:[box-shadow:var(--shadow-2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all",
        elevated:
          "bg-white/98 dark:bg-slate-900/98 border border-border/60 dark:border-border/40 rounded-2xl [box-shadow:var(--shadow-2)]",
        flat:
          "bg-slate-50/60 dark:bg-slate-900/40 border border-border/40 dark:border-border/40 rounded-2xl",
        premium:
          "premium-card p-5 sm:p-6",
        auth:
          "w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-border/60 dark:border-border/40 [box-shadow:var(--shadow-3)] p-7 sm:p-9 relative overflow-hidden",
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
      className={cn("card-title font-heading font-semibold text-foreground leading-snug tracking-tight text-base", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn("body-copy-sm font-sans font-normal text-muted-foreground text-sm leading-normal", className)}
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
