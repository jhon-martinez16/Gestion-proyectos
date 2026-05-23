import { forwardRef } from "react"
import clsx from "clsx"

export type DotStatus = "active" | "warning" | "danger" | "paused" | "neutral" | "info" | "violet"

interface StatusDotProps {
  status: DotStatus
  size?: "xs" | "sm" | "md"
  pulse?: boolean
  className?: string
}

const dotBg: Record<DotStatus, string> = {
  active:  "bg-state-green",
  warning: "bg-state-amber",
  danger:  "bg-state-red",
  paused:  "bg-state-zinc",
  neutral: "bg-ink-4",
  info:    "bg-state-blue",
  violet:  "bg-state-violet",
}

const sizeCls: Record<NonNullable<StatusDotProps["size"]>, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
}

const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ status, size = "sm", pulse = false, className }, ref) => {
    const color = dotBg[status] ?? dotBg.neutral
    const sz    = sizeCls[size]

    if (!pulse) {
      return (
        <span
          ref={ref}
          className={clsx("rounded-full flex-shrink-0 inline-block", color, sz, className)}
        />
      )
    }

    return (
      <span
        ref={ref}
        className={clsx("relative inline-flex flex-shrink-0", sz, className)}
      >
        <span className={clsx("animate-ping absolute inset-0 rounded-full opacity-60", color)} />
        <span className={clsx("relative rounded-full w-full h-full", color)} />
      </span>
    )
  }
)
StatusDot.displayName = "StatusDot"
export default StatusDot
