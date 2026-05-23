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

// Hues restricted to: red/pink, blue, violet/purple, teal — no browns, olives, yellows
const HUES = [345, 355, 5, 15, 210, 225, 240, 250, 275, 290, 310, 325, 165, 175, 185, 195]

function nameToHsl(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = HUES[Math.abs(hash) % HUES.length]
  return `hsl(${h}, 65%, 50%)`
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
