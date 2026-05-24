import { forwardRef } from "react"
import clsx from "clsx"
import StatusDot, { type DotStatus } from "./StatusDot"

// Project-domain statuses
export type ProjectStatus =
  | "EN_CURSO"
  | "ADVERTENCIA"
  | "EN_RIESGO"
  | "FINALIZADO"
  | "PROPUESTA"

// Generic semantic statuses
export type GenericStatus =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple"

export type BadgeVariant = ProjectStatus | GenericStatus

interface BadgeCfg {
  defaultLabel: string
  dotStatus: DotStatus
  pulse: boolean
  borderColor: string
  textColor: string
}

/* Outline-only badges — transparent bg, border + text del color de estado */
const CONFIG: Record<BadgeVariant, BadgeCfg> = {
  EN_CURSO:    { defaultLabel: "En curso",    dotStatus: "active",  pulse: true,  borderColor: "var(--state-green)", textColor: "var(--state-green)" },
  ADVERTENCIA: { defaultLabel: "Advertencia", dotStatus: "warning", pulse: false, borderColor: "var(--state-amber)", textColor: "var(--state-amber)" },
  EN_RIESGO:   { defaultLabel: "En riesgo",   dotStatus: "danger",  pulse: true,  borderColor: "var(--state-red)",   textColor: "var(--state-red)" },
  FINALIZADO:  { defaultLabel: "Finalizado",  dotStatus: "paused",  pulse: false, borderColor: "var(--state-zinc)",  textColor: "var(--state-zinc)" },
  PROPUESTA:   { defaultLabel: "Propuesta",   dotStatus: "violet",  pulse: false, borderColor: "var(--state-violet)",textColor: "var(--state-violet)" },
  success:     { defaultLabel: "Activo",      dotStatus: "active",  pulse: false, borderColor: "var(--state-green)", textColor: "var(--state-green)" },
  warning:     { defaultLabel: "Advertencia", dotStatus: "warning", pulse: false, borderColor: "var(--state-amber)", textColor: "var(--state-amber)" },
  danger:      { defaultLabel: "Error",       dotStatus: "danger",  pulse: false, borderColor: "var(--state-red)",   textColor: "var(--state-red)" },
  info:        { defaultLabel: "Info",        dotStatus: "info",    pulse: false, borderColor: "var(--state-blue)",  textColor: "var(--state-blue)" },
  neutral:     { defaultLabel: "Neutral",     dotStatus: "neutral", pulse: false, borderColor: "var(--state-zinc)",  textColor: "var(--state-zinc)" },
  purple:      { defaultLabel: "Propuesta",   dotStatus: "violet",  pulse: false, borderColor: "var(--state-violet)",textColor: "var(--state-violet)" },
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  size?: "sm" | "md"
  pulse?: boolean
  className?: string
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, label, size = "sm", pulse, className }, ref) => {
    const cfg  = CONFIG[variant] ?? CONFIG.neutral
    const text = label ?? cfg.defaultLabel
    const doPulse = pulse !== undefined ? pulse : cfg.pulse

    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded font-medium uppercase tracking-wider whitespace-nowrap",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
          className,
        )}
        style={{
          background: "transparent",
          border: `1px solid ${cfg.borderColor}`,
          color: cfg.textColor,
          fontFamily: "var(--font-ui)",
          letterSpacing: "0.06em",
        }}
      >
        <StatusDot status={cfg.dotStatus} size="xs" pulse={doPulse} />
        {text}
      </span>
    )
  }
)
Badge.displayName = "Badge"
export default Badge
