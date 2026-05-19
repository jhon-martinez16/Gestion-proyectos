import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  onClose: () => void
  isOpen?: boolean
  title?: string
  size?: "sm" | "md" | "lg"
  accentColor?: string
}

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", damping: 28, stiffness: 380 },
  },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
}

export default function Modal({ children, onClose, isOpen = true, title, size = "md", accentColor }: Props) {
  const widths = { sm: "min(420px, calc(100vw - 32px))", md: "min(560px, calc(100vw - 32px))", lg: "min(720px, calc(100vw - 32px))" }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: widths[size],
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 24px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)",
              overflow: "hidden",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            {/* Accent bar */}
            {accentColor && (
              <div style={{ height: 4, background: accentColor, flexShrink: 0 }} />
            )}

            {title && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 24px",
                borderBottom: "1px solid var(--card-border)",
              }}>
                <h2 style={{
                  fontSize: 17, fontWeight: 700, color: "var(--text-primary)",
                  margin: 0, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: "var(--content-bg)", border: "1px solid var(--card-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--text-muted)", transition: "var(--transition)",
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = "white"); (e.currentTarget.style.color = "var(--text-primary)") }}
                  onMouseLeave={e => { (e.currentTarget.style.background = "var(--content-bg)"); (e.currentTarget.style.color = "var(--text-muted)") }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ padding: title ? "0" : "0", position: "relative" }}>
              {!title && (
                <button
                  onClick={onClose}
                  style={{
                    position: "absolute", top: 16, right: 16, zIndex: 1,
                    width: 30, height: 30, borderRadius: 7,
                    background: "var(--content-bg)", border: "1px solid var(--card-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--text-muted)", transition: "var(--transition)",
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = "white"); (e.currentTarget.style.color = "var(--text-primary)") }}
                  onMouseLeave={e => { (e.currentTarget.style.background = "var(--content-bg)"); (e.currentTarget.style.color = "var(--text-muted)") }}
                >
                  <X size={14} />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
