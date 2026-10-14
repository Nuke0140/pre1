import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  leadingIcon?: React.ReactNode
  trailingAction?: React.ReactNode
  hasError?: boolean
  inputSize?: "default" | "sm" | "md" | "lg" | "xl" | "auth"
  wrapperClassName?: string
  iconClassName?: string
}

export interface InputWrapperProps {
  children: React.ReactNode
  className?: string
  hasLeadingIcon?: boolean
  hasTrailingAction?: boolean
}

export function InputWrapper({
  children,
  className,
  hasLeadingIcon,
  hasTrailingAction,
}: InputWrapperProps) {
  return (
    <div
      className={cn(
        "input-wrapper relative group w-full min-w-0",
        hasLeadingIcon && "input-wrapper--leading",
        hasTrailingAction && "input-wrapper--trailing",
        className
      )}
    >
      {children}
    </div>
  )
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      leadingIcon,
      trailingAction,
      hasError = false,
      inputSize = "default",
      wrapperClassName,
      iconClassName,
      ...props
    },
    ref
  ) => {
    const isAuthOrXl = inputSize === "auth" || inputSize === "xl"

    const baseInput = (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        data-leading-icon={leadingIcon ? "true" : undefined}
        data-trailing-action={trailingAction ? "true" : undefined}
        className={cn(
          "input-wrapper__field w-full transition-all font-sans outline-none appearance-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 box-border min-w-0",
          // Sizing & Radius: Comfortable height of at least 44-48px
          isAuthOrXl
            ? "h-12 min-h-[48px] text-[15px] rounded-xl"
            : inputSize === "sm"
            ? "h-8 min-h-[32px] text-sm rounded-md px-2.5 py-1"
            : inputSize === "lg"
            ? "h-11 min-h-[44px] text-[15px] rounded-lg px-3.5 py-1.5"
            : "h-11 min-h-[44px] text-sm sm:text-[15px] rounded-lg px-3.5 py-2",
          // Reserved Paddings for Icons: 44px ensures >=8px (12px) separation after 14px + 18px icon
          leadingIcon ? "pl-[44px] !pl-[44px]" : "pl-3.5",
          trailingAction ? "pr-[44px] !pr-[44px]" : "pr-3.5",
          // Surface Colors & Borders
          isAuthOrXl
            ? cn(
                "auth-input bg-slate-50/80 dark:bg-slate-950/60 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-2xs",
                hasError
                  ? "border-destructive focus:border-destructive focus:[box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)] focus-visible:border-destructive focus-visible:[box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)]"
                  : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary focus:[box-shadow:var(--focus-ring)] focus:outline-none focus-visible:border-primary focus-visible:[box-shadow:var(--focus-ring)]"
              )
            : cn(
                "border border-border/60 dark:border-border/40 bg-background/50 dark:bg-input/30 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground shadow-2xs hover:border-border/80 dark:hover:border-border/60",
                "focus:border-[var(--focus-ring-color)] focus:[box-shadow:var(--focus-ring)] focus:outline-none focus-visible:border-[var(--focus-ring-color)] focus-visible:[box-shadow:var(--focus-ring)]",
                hasError
                  ? "!border-destructive focus:!border-destructive focus:![box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)] focus-visible:!border-destructive focus-visible:![box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)]"
                  : "aria-invalid:!border-destructive aria-invalid:focus:!border-destructive aria-invalid:focus:![box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)] aria-invalid:focus-visible:!border-destructive aria-invalid:focus-visible:![box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)]"
              ),
          className
        )}
        {...props}
      />
    )

    if (leadingIcon || trailingAction) {
      return (
        <div
          className={cn(
            "input-wrapper relative group w-full min-w-0",
            leadingIcon && "input-wrapper--leading",
            trailingAction && "input-wrapper--trailing",
            wrapperClassName
          )}
        >
          {leadingIcon && (
            <div
              className={cn(
                "input-wrapper__icon pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors flex-shrink-0 z-10 w-[18px] h-[18px]",
                iconClassName
              )}
              aria-hidden="true"
            >
              {leadingIcon}
            </div>
          )}
          {baseInput}
          {trailingAction && (
            <div
              className={cn(
                "input-wrapper__trailing absolute right-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center z-10 text-slate-400 dark:text-slate-500"
              )}
            >
              {trailingAction}
            </div>
          )}
        </div>
      )
    }

    return baseInput
  }
)

Input.displayName = "Input"

export { Input }
