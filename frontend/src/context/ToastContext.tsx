import React, { createContext, useContext, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_CONFIG: Record<ToastType, {
  bg: string; border: string; text: string; iconBg: string; Icon: React.ElementType
}> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#14532d", iconBg: "#16a34a", Icon: CheckCircle2 },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d", iconBg: "#ef4444", Icon: XCircle },
  warning: { bg: "#fffbeb", border: "#fed7aa", text: "#92400e", iconBg: "#f97316", Icon: AlertTriangle },
  info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a8a", iconBg: "#1e3a6e", Icon: Info },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = "success", duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type, duration }])
    if (duration > 0) setTimeout(() => remove(id), duration)
  }, [remove])

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast(m, "success"),
    error:   (m) => addToast(m, "error"),
    warning: (m) => addToast(m, "warning"),
    info:    (m) => addToast(m, "info"),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container */}
      <div style={{
        position: "fixed", bottom: 24, right: 24,
        zIndex: 9999, display: "flex", flexDirection: "column", gap: 10,
        maxWidth: 380,
      }}>
        <AnimatePresence>
          {toasts.map(t => {
            const cfg = TOAST_CONFIG[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.18 } }}
                transition={{ type: "spring", damping: 26, stiffness: 360 }}
                style={{
                  background: cfg.bg,
                  border: `1.5px solid ${cfg.border}`,
                  borderRadius: 12,
                  padding: "13px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  minWidth: 260,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                }}
                onClick={() => remove(t.id)}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: cfg.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <cfg.Icon size={15} color="white" />
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 500, color: cfg.text, flex: 1,
                }}>
                  {t.message}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); remove(t.id) }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: cfg.text, opacity: 0.5, padding: 0, flexShrink: 0,
                    display: "flex", alignItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
