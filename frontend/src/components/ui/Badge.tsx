import type { ReactNode } from "react"

interface Props {
  variant: "success" | "warning" | "danger" | "info" | "neutral"
  children: ReactNode
  dot?: boolean
}

const variantStyles: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: "var(--primary-light)",   text: "var(--primary-dark)", dot: "var(--primary)" },
  warning: { bg: "var(--warning-light)",   text: "#92400e",              dot: "var(--warning)" },
  danger:  { bg: "var(--danger-light)",    text: "var(--danger)",        dot: "var(--danger)" },
  info:    { bg: "var(--info-light)",      text: "var(--info)",          dot: "var(--info)" },
  neutral: { bg: "#f1f5f9",               text: "var(--text-secondary)", dot: "#94a3b8" },
}

export default function Badge({ variant, children, dot = false }: Props) {
  const cfg = variantStyles[variant] ?? variantStyles.neutral
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: dot ? 5 : 0,
      padding: "3px 10px",
      borderRadius: 50,
      fontSize: 12,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.text,
      whiteSpace: "nowrap",
    }}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: cfg.dot, flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )
}
