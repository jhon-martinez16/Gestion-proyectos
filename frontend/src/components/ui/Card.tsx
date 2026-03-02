import { motion } from "framer-motion"
import type { ReactNode } from "react"

export default function Card({ children }: { children: ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
    >
      {children}
    </motion.div>
  )
}