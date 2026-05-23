import { forwardRef } from "react"
import clsx from "clsx"
import Avatar from "./Avatar"

interface AvatarGroupProps {
  names: string[]
  max?: number
  size?: "xs" | "sm" | "md"
  className?: string
}

const overlapCls: Record<NonNullable<AvatarGroupProps["size"]>, string> = {
  xs: "-ml-1.5",
  sm: "-ml-2",
  md: "-ml-2.5",
}

const counterCls: Record<NonNullable<AvatarGroupProps["size"]>, string> = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-6 h-6 text-[9px]",
  md: "w-8 h-8 text-[11px]",
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ names, max = 3, size = "sm", className }, ref) => {
    const visible  = names.slice(0, max)
    const overflow = names.length - max

    return (
      <div ref={ref} className={clsx("flex items-center", className)}>
        {visible.map((name, i) => (
          <div key={`${name}-${i}`} className={clsx(i > 0 && overlapCls[size])}>
            <Avatar name={name} size={size} ring />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className={clsx(
              "-ml-2 rounded-full flex items-center justify-center flex-shrink-0",
              "bg-canvas-2 border-2 border-white text-ink-2 font-semibold tabular-nums",
              counterCls[size],
            )}
          >
            +{overflow}
          </div>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"
export default AvatarGroup
