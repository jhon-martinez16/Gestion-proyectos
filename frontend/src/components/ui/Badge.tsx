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
  bg: string
  fg: string
}

const CONFIG: Record<BadgeVariant, BadgeCfg> = {
  EN_CURSO:    { defaultLabel: "En curso",    dotStatus: "active",  pulse: true,  bg: "bg-state-green-bg",  fg: "text-state-green" },
  ADVERTENCIA: { defaultLabel: "Advertencia", dotStatus: "warning", pulse: false, bg: "bg-state-amber-bg",  fg: "text-state-amber" },
  EN_RIESGO:   { defaultLabel: "En riesgo",   dotStatus: "danger",  pulse: true,  bg: "bg-state-red-bg",    fg: "text-state-red" },
  FINALIZADO:  { defaultLabel: "Finalizado",  dotStatus: "paused",  pulse: false, bg: "bg-state-zinc-bg",   fg: "text-state-zinc" },
  PROPUESTA:   { defaultLabel: "Propuesta",   dotStatus: "violet",  pulse: false, bg: "bg-state-violet-bg", fg: "text-state-violet" },
  success:     { defaultLabel: "Activo",      dotStatus: "active",  pulse: false, bg: "bg-state-green-bg",  fg: "text-state-green" },
  warning:     { defaultLabel: "Advertencia", dotStatus: "warning", pulse: false, bg: "bg-state-amber-bg",  fg: "text-state-amber" },
  danger:      { defaultLabel: "Error",       dotStatus: "danger",  pulse: false, bg: "bg-state-red-bg",    fg: "text-state-red" },
  info:        { defaultLabel: "Info",        dotStatus: "info",    pulse: false, bg: "bg-state-blue-bg",   fg: "text-state-blue" },
  neutral:     { defaultLabel: "Neutral",     dotStatus: "neutral", pulse: false, bg: "bg-state-zinc-bg",   fg: "text-state-zinc" },
  purple:      { defaultLabel: "Propuesta",   dotStatus: "violet",  pulse: false, bg: "bg-state-violet-bg", fg: "text-state-violet" },
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
          "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          cfg.bg,
          cfg.fg,
          className,
        )}
      >
        <StatusDot status={cfg.dotStatus} size="xs" pulse={doPulse} />
        {text}
      </span>
    )
  }
)
Badge.displayName = "Badge"
export default Badge
