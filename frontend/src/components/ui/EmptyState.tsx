import { forwardRef } from "react"
import clsx from "clsx"
import type { ElementType, ReactNode } from "react"

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: "primary" | "primary-green" | "secondary"
}

interface EmptyStateProps {
  icon?: ElementType
  title: string
  description?: string
  action?: EmptyStateAction
  children?: ReactNode
  className?: string
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon: Icon, title, description, action, children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "flex flex-col items-center justify-center gap-4 py-16 px-8 text-center",
          className,
        )}
      >
        {Icon && (
          <div className="w-11 h-11 rounded-full bg-canvas-2 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-ink-3" />
          </div>
        )}

        <div className="space-y-1.5 max-w-[260px]">
          <p className="text-sm font-semibold text-ink-2 leading-snug">{title}</p>
          {description && (
            <p className="text-xs text-ink-3 leading-relaxed">{description}</p>
          )}
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className={clsx(
              "h-8 px-4 text-xs",
              action.variant === "primary"
                ? "btn-primary"
                : action.variant === "primary-green"
                  ? "btn-primary-green"
                  : "btn-secondary",
            )}
          >
            {action.label}
          </button>
        )}

        {children}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"
export default EmptyState
