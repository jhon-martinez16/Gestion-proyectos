import { forwardRef } from "react"
import type { ReactNode } from "react"

interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  stats?: ReactNode
  actions?: ReactNode
}

const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ eyebrow, title, subtitle, stats, actions }, ref) => (
    <div ref={ref} className="flex items-end justify-between mb-8 pb-6 border-b border-ui-border">
      <div className="flex-1 min-w-0">
        <p style={{
          fontFamily: "var(--font-ui)",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "var(--accent-gold)",
          marginBottom: 8,
          lineHeight: 1,
        }}>
          {eyebrow}
        </p>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(36px, 4vw, 48px)",
          fontWeight: 300,
          color: "var(--text-primary)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          marginBottom: subtitle ? 8 : 0,
          overflow: "hidden",
          overflowWrap: "anywhere" as const,
          minWidth: 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: stats ? 12 : 0,
            maxWidth: "48rem",
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
        {stats && (
          <div className="flex items-center gap-4 flex-wrap" style={{
            fontSize: 13,
            color: "var(--text-muted)",
            fontFamily: "var(--font-ui)",
          }}>
            {stats}
          </div>
        )}
      </div>
      {actions && <div className="flex-shrink-0 ml-6">{actions}</div>}
    </div>
  ),
)
PageHeader.displayName = "PageHeader"
export default PageHeader
