import { forwardRef } from "react"
import { Loader2 } from "lucide-react"
import clsx from "clsx"
import type { ComponentPropsWithoutRef, ElementType } from "react"

export type ButtonVariant =
  | "primary"
  | "primary-green"
  | "secondary"
  | "danger"
  | "ghost"
  | "icon"

export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ElementType
  rightIcon?: ElementType
}

const BASE =
  "inline-flex items-center justify-center font-medium rounded-md whitespace-nowrap " +
  "transition-all duration-150 select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 " +
  "disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "active:scale-[0.98]"

const VARIANT: Record<ButtonVariant, string> = {
  "primary":       "bg-ink text-white hover:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.10)] focus-visible:ring-ink/40",
  "primary-green": "bg-primary text-white hover:bg-primary-dark shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_3px_rgba(21,128,61,0.20)] focus-visible:ring-primary/40",
  "secondary":     "bg-transparent text-ink-2 border border-ui-border hover:bg-canvas-2 hover:text-ink focus-visible:ring-ink-4",
  "danger":        "bg-transparent text-state-red border border-state-red/30 hover:bg-state-red hover:text-white focus-visible:ring-state-red/40",
  "ghost":         "bg-transparent text-ink-2 hover:bg-canvas-2 hover:text-ink focus-visible:ring-ink-4",
  "icon":          "bg-transparent text-ink-3 hover:bg-canvas-2 hover:text-ink focus-visible:ring-ink-4 w-8 h-8 rounded-md",
}

const SIZE: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-[13.5px] gap-1.5",
  lg: "h-11 px-5 text-sm gap-2",
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const isIcon = variant === "icon"

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          BASE,
          VARIANT[variant],
          !isIcon && SIZE[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            {LeftIcon && <LeftIcon size={isIcon ? 15 : ICON_SIZE[size]} />}
            {children}
            {RightIcon && <RightIcon size={isIcon ? 15 : ICON_SIZE[size]} />}
          </>
        )}
      </button>
    )
  },
)
Button.displayName = "Button"
export default Button
