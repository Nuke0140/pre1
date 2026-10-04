import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm active:scale-[0.98]",
        primary:
          "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md shadow-purple-600/25 dark:shadow-purple-950/40 hover:shadow-lg hover:shadow-purple-600/30 active:scale-[0.98] border-transparent font-semibold",
        auth:
          "w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md shadow-purple-600/25 dark:shadow-purple-950/40 hover:shadow-lg hover:shadow-purple-600/30 active:scale-[0.98] border-transparent font-semibold cursor-pointer",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/80 active:scale-[0.98]",
        outline:
          "border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98]",
        secondary:
          "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-[0.98]",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-5 text-sm has-[>svg]:px-4",
        xl: "h-12 rounded-xl px-6 text-sm font-semibold has-[>svg]:px-5",
        auth: "h-12 rounded-xl px-6 text-sm font-semibold",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
