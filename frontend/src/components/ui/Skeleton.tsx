import { forwardRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import clsx from "clsx"

export type SkeletonVariant = "text" | "card" | "row" | "avatar"

interface SkeletonProps {
  variant?: SkeletonVariant
  lines?: number
  width?: string
  visible?: boolean
  className?: string
}

function Line({ w = "100%" }: { w?: string }) {
  return <div className="skeleton h-3 rounded" style={{ width: w }} />
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", lines = 3, width, visible = true, className }, ref) => {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className={clsx("w-full", className)}
          >
            {variant === "text" && (
              <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                  <Line key={i} w={i === lines - 1 ? "58%" : (width ?? "100%")} />
                ))}
              </div>
            )}

            {variant === "card" && (
              <div className="skeleton rounded-xl h-32 w-full" />
            )}

            {variant === "row" && (
              <div className="flex items-center gap-3 py-2">
                <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Line w="52%" />
                  <Line w="35%" />
                </div>
              </div>
            )}

            {variant === "avatar" && (
              <div
                className="skeleton rounded-full"
                style={{ width: width ?? "2rem", height: width ?? "2rem" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
Skeleton.displayName = "Skeleton"
export default Skeleton
