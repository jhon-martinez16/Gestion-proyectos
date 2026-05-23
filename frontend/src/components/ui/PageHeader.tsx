import { forwardRef } from "react"
import BrandDot from "./BrandDot"
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
        <div className="flex items-center gap-2 mb-2">
          <BrandDot />
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-3">
            {eyebrow}
          </span>
        </div>
        <h1 className="font-serif text-[36px] font-normal text-ink leading-[1.05] mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-ink-2 max-w-xl mb-4">{subtitle}</p>
        )}
        {stats && (
          <div className="flex items-center gap-4 text-[13px] text-ink-3 flex-wrap">
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
