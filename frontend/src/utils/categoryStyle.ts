import {
  AlertTriangle,
  Cpu,
  Target,
  DollarSign,
  Settings,
  FolderOpen,
  type LucideIcon,
} from "lucide-react"

export interface CategoryStyle {
  icon: LucideIcon
  bg: string
  fg: string
}

const STYLES: Record<string, CategoryStyle> = {
  "Riesgos":      { icon: AlertTriangle, bg: "#FEE2E2", fg: "#DC2626" },
  "Tecnología":   { icon: Cpu,           bg: "#DBEAFE", fg: "#2563EB" },
  "Tecnologia":   { icon: Cpu,           bg: "#DBEAFE", fg: "#2563EB" },
  "Estrategia":   { icon: Target,        bg: "#F3E8FF", fg: "#7C3AED" },
  "Financiero":   { icon: DollarSign,    bg: "#FEF3C7", fg: "#D97706" },
  "Operaciones":  { icon: Settings,      bg: "#D1FAE5", fg: "#15803D" },
}

const DEFAULT_STYLE: CategoryStyle = { icon: FolderOpen, bg: "#F4F4F5", fg: "#52525B" }

export function getCategoryStyle(name: string): CategoryStyle {
  return STYLES[name] ?? DEFAULT_STYLE
}
