import { motion, AnimatePresence } from "framer-motion"

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  labelOn: string
  labelOff?: string
  description?: string
  disabled?: boolean
}

export default function SmartToggle({ checked, onChange, labelOn, labelOff, description, disabled }: Props) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}>
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 14, fontWeight: 500, color: "var(--text-primary)",
        }}>
          {checked ? labelOn : (labelOff ?? labelOn)}
        </span>
        {description && (
          <p style={{
            fontSize: 12, color: "var(--text-muted)", marginTop: 2,
          }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={checked ? "on" : "off"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            style={{
              fontSize: 12, fontWeight: 600,
              color: checked ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            {checked ? "✓ Sí" : "No"}
          </motion.span>
        </AnimatePresence>

        <motion.div
          onClick={() => onChange(!checked)}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: checked ? "var(--primary)" : "#e2e8f0",
            cursor: "pointer", position: "relative",
            transition: "background 0.2s ease",
          }}
        >
          <motion.div
            animate={{ x: checked ? 22 : 2 }}
            transition={{ type: "spring", damping: 20, stiffness: 400 }}
            style={{
              width: 20, height: 20, borderRadius: 10,
              background: "white", position: "absolute", top: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
