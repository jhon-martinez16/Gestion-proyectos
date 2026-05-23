import { forwardRef } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

interface AvatarProps {
  name: string
  src?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  ring?: boolean
  className?: string
}

function nameToHsl(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h},48%,38%)`
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
}

const sizeCls: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-6 h-6 text-[9px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-10 h-10 text-xs",
  xl: "w-12 h-12 text-sm",
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = "md", ring = false, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.05 }}
        title={name}
        className={clsx(
          "rounded-full flex items-center justify-center flex-shrink-0",
          "font-semibold text-white select-none overflow-hidden",
          sizeCls[size],
          ring && "ring-2 ring-white",
          className,
        )}
        style={{ backgroundColor: src ? undefined : nameToHsl(name) }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials(name)
        )}
      </motion.div>
    )
  }
)
Avatar.displayName = "Avatar"
export default Avatar
