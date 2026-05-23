import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Calendar, User, Edit2, Trash2 } from "lucide-react"
import clsx from "clsx"
import Badge, { type ProjectStatus } from "../ui/Badge"
import AvatarGroup from "../ui/AvatarGroup"
import { formatShortDate, formatRelativeDuration } from "../../utils/dateFormat"
import { getCategoryStyle } from "../../utils/categoryStyle"

interface Usuario { id: string; nombre: string }
interface Proyecto {
  id: string
  nombre: string
  descripcion: string
  lider: Usuario
  socio2?: Usuario
  categoria: { id: string; nombre: string }
  fechaInicio: string
  fechaFin: string
  estado: string
  etapa?: string
}

interface Props {
  proyecto: Proyecto
  onEdit: () => void
  onDelete?: () => void
}

const STATE_BAR: Record<string, string> = {
  EN_CURSO:    "bg-state-green",
  ADVERTENCIA: "bg-state-amber",
  EN_RIESGO:   "bg-state-red",
  FINALIZADO:  "bg-state-zinc",
  PROPUESTA:   "bg-state-violet",
}

const STATE_HOVER_BORDER: Record<string, string> = {
  EN_CURSO:    "rgba(21,128,61,0.30)",
  ADVERTENCIA: "rgba(217,119,6,0.30)",
  EN_RIESGO:   "rgba(220,38,38,0.30)",
  FINALIZADO:  "rgba(82,82,91,0.20)",
  PROPUESTA:   "rgba(124,58,237,0.30)",
}

export default function ProjectCard({ proyecto, onEdit, onDelete }: Props) {
  const navigate  = useNavigate()
  const catStyle  = getCategoryStyle(proyecto.categoria?.nombre ?? "")
  const CatIcon   = catStyle.icon
  const startDate = new Date(proyecto.fechaInicio)
  const endDate   = new Date(proyecto.fechaFin)
  const teamNames = [proyecto.lider, proyecto.socio2]
    .filter((u): u is Usuario => Boolean(u))
    .map(u => u.nombre)

  return (
    <motion.div
      role="link"
      tabIndex={0}
      initial={{ borderColor: "#E7E5E4" }}
      whileHover={{
        y: -3,
        borderColor: STATE_HOVER_BORDER[proyecto.estado] ?? "rgba(0,0,0,0.10)",
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="group card-surface card-surface-hover overflow-hidden cursor-pointer flex flex-col min-h-[240px]"
      onClick={() => navigate(`/projects/${proyecto.id}`)}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && navigate(`/projects/${proyecto.id}`)}
    >
      {/* Vertical state bar */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-1 rounded-r-full",
          "transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-1.5",
          STATE_BAR[proyecto.estado] ?? "bg-state-zinc",
        )}
      />

      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-6">

        {/* Row 1: Category icon (left) + Actions + Badge (right) */}
        <div className="flex items-start justify-between mb-4">

          {/* Category icon — rounded square, color sólido */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: 12, background: catStyle.bg }}
          >
            <CatIcon size={22} strokeWidth={1.8} style={{ color: catStyle.fg }} />
          </div>

          {/* Top-right: action buttons (hover) + badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                aria-label="Editar"
                className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-ink hover:bg-canvas-2 transition-colors duration-100"
                onClick={onEdit}
              >
                <Edit2 size={13} />
              </button>
              {onDelete && (
                <button
                  aria-label="Eliminar"
                  className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-state-red hover:bg-state-red-bg transition-colors duration-100"
                  onClick={onDelete}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <Badge variant={proyecto.estado as ProjectStatus} size="sm" />
          </div>
        </div>

        {/* Project title */}
        <h3
          className="font-semibold text-ink leading-snug line-clamp-2 mb-1"
          style={{ fontSize: 20, letterSpacing: "-0.02em" }}
        >
          {proyecto.nombre}
        </h3>

        {/* Category subtitle — mismo color que el icono */}
        <p className="text-[13px] font-medium mb-4" style={{ color: catStyle.fg }}>
          {proyecto.categoria?.nombre}
        </p>

        {/* Divider */}
        <div className="h-px bg-ui-border mb-4" />

        {/* Metadata */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-start gap-2.5">
            <Calendar size={14} className="text-ink-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] text-ink-2 font-medium leading-none">
                {formatShortDate(startDate)} → {formatShortDate(endDate)}
              </p>
              <p className="text-[12px] text-ink-3 mt-1 leading-none">
                {formatRelativeDuration(startDate, endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <User size={14} className="text-ink-4 flex-shrink-0" />
            <p className="text-[13px] text-ink-2 font-medium truncate">
              {proyecto.lider.nombre}
              <span className="text-ink-3 font-normal"> · líder</span>
            </p>
          </div>
        </div>

        {/* Team avatars */}
        <AvatarGroup names={teamNames} size="md" max={4} />
      </div>
    </motion.div>
  )
}
