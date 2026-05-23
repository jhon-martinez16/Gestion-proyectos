import { forwardRef } from "react"
import clsx from "clsx"

interface BrandDotProps {
  size?: "xs" | "sm" | "md"
  color?: "accent" | "primary" | "danger" | "info" | "violet" | "amber"
  pulse?: boolean
  className?: string
}

const SIZE = {
  xs: "w-1 h-1",
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
}
const COLOR = {
  accent:  "bg-accent",
  primary: "bg-primary",
  danger:  "bg-state-red",
  info:    "bg-state-blue",
  violet:  "bg-state-violet",
  amber:   "bg-state-amber",
}

const BrandDot = forwardRef<HTMLSpanElement, BrandDotProps>(
  ({ size = "sm", color = "accent", pulse = false, className }, ref) => (
    <span
      ref={ref}
      className={clsx(
        "inline-block rounded-full flex-shrink-0",
        SIZE[size], COLOR[color],
        pulse && "animate-pulse-dot",
        className,
      )}
    />
  ),
)
BrandDot.displayName = "BrandDot"
export default BrandDot
