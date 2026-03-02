import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
  disabled?: boolean
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: Props) {
  const styles = {
    primary:
      "bg-[#F58220] hover:bg-[#ff9f40] text-white shadow-lg",
    secondary:
      "bg-[#0B355A] hover:bg-[#0F4C81] text-white",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </motion.button>
  )
}