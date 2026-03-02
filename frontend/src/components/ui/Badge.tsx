import clsx from "clsx"
import type { ReactNode } from "react"

interface Props {
  variant: "success" | "warning" | "danger" | "info"
  children: ReactNode
}

const badgeStyles = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-[#F58220]/20 text-[#F58220]",
}

export default function Badge({ variant, children }: Props) {
  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition",
        badgeStyles[variant]
      )}
    >
      {children}
    </span>
  )
}