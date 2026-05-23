import { forwardRef } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

export type ProgressColor = "primary" | "warning" | "danger" | "info" | "neutral"

interface ProgressBarProps {
  value: number
  color?: ProgressColor
  height?: number
  animated?: boolean
  showLabel?: boolean
  className?: string
}

const fillCls: Record<ProgressColor, string> = {
  primary: "bg-state-green",
  warning: "bg-state-amber",
  danger:  "bg-state-red",
  info:    "bg-state-blue",
  neutral: "bg-ink-3",
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, color = "primary", height = 3, animated = true, showLabel = false, className }, ref) => {
    const pct = Math.min(100, Math.max(0, value))

    return (
      <div ref={ref} className={clsx("w-full", className)}>
        {showLabel && (
          <div className="flex justify-end mb-1">
            <span className="text-[11px] font-semibold text-ink-2 tabular-nums">{pct}%</span>
          </div>
        )}
        <div
          className="w-full rounded-full overflow-hidden bg-canvas-2"
          style={{ height }}
        >
          <motion.div
            className={clsx("h-full rounded-full", fillCls[color])}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={
              animated
                ? { duration: 0.7, ease: "easeOut", delay: 0.05 }
                : { duration: 0 }
            }
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"
export default ProgressBar
