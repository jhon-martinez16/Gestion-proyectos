import { motion } from "framer-motion"

export default function ProgressBar({
  value,
}: {
  value: number
}) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6 }}
        className="bg-[#F58220] h-4 rounded-full"
      />
    </div>
  )
}