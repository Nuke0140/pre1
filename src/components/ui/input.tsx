import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  leadingIcon?: React.ReactNode
  trailingAction?: React.ReactNode
  hasError?: boolean
  inputSize?: "default" | "sm" | "lg" | "xl" | "auth"
}

export interface InputWrapperProps {
  children: React.ReactNode
  className?: string
}

export function InputWrapper({ children, className }: InputWrapperProps) {
  return (
    <div className={cn("relative group w-full", className)}>
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
        className={cn(
          "w-full transition-all font-sans outline-none appearance-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Sizing & Radius
          isAuthOrXl
            ? "h-12 text-[15px] rounded-xl"
            : inputSize === "sm"
            ? "h-8 text-sm rounded-md px-2.5 py-1"
            : inputSize === "lg"
            ? "h-10 text-[15px] rounded-lg px-3.5 py-1.5"
            : "h-9 text-[15px] rounded-md px-3 py-1",
          // Paddings for Icons
          isAuthOrXl
            ? cn(leadingIcon ? "pl-11" : "pl-4", trailingAction ? "pr-11" : "pr-4")
            : cn(leadingIcon ? "pl-9" : "", trailingAction ? "pr-9" : ""),
          // Surface Colors & Borders
          isAuthOrXl
            ? cn(
                "auth-input bg-slate-50/80 dark:bg-slate-950/60 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium shadow-2xs",
                hasError
                  ? "border-destructive focus-visible:border-destructive [box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)]"
                  : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:border-primary [box-shadow:none] focus-visible:[box-shadow:var(--focus-ring)]"
              )
            : cn(
                "border border-border/60 dark:border-border/40 bg-transparent dark:bg-input/30 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground shadow-2xs hover:border-border/80 dark:hover:border-border/60",
                "focus-visible:border-[var(--focus-ring-color)] focus-visible:[box-shadow:var(--focus-ring)]",
                hasError
                  ? "!border-destructive focus-visible:!border-destructive focus-visible:![box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)]"
                  : "aria-invalid:!border-destructive aria-invalid:focus-visible:!border-destructive aria-invalid:focus-visible:![box-shadow:0_0_0_var(--focus-ring-inner-width,1px)_var(--danger),0_0_0_var(--focus-ring-outer-width,4px)_color-mix(in_srgb,var(--danger)_20%,transparent)]"
              ),
          className
        )}
        {...props}
      />
    )

    if (leadingIcon || trailingAction) {
      return (
        <div className="relative group w-full">
          {leadingIcon && (
            <div
              className={cn(
                "absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors",
                isAuthOrXl ? "pl-3.5" : "pl-3"
              )}
            >
              {leadingIcon}
            </div>
          )}
          {baseInput}
          {trailingAction && (
            <div
              className={cn(
                "absolute inset-y-0 right-0 flex items-center",
                isAuthOrXl ? "pr-3" : "pr-2.5"
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
