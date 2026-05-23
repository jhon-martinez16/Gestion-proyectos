import { forwardRef } from "react"
import clsx from "clsx"
import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  count?: number
  action?: ReactNode
  className?: string
}

const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, count, action, className }, ref) => {
    return (
      <div ref={ref} className={clsx("flex items-center gap-2.5 mb-4", className)}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 whitespace-nowrap">
          {title}
        </span>

        {count !== undefined && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-canvas-2 text-ink-2 text-[10px] font-semibold tabular-nums flex-shrink-0">
            {count}
          </span>
        )}

        <div className="flex-1 h-px bg-ui-border min-w-0" />

        {action && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </div>
    )
  }
)
SectionHeader.displayName = "SectionHeader"
export default SectionHeader
