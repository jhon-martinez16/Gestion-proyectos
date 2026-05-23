import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Calendar, MoreVertical, Edit2, Trash2 } from "lucide-react"
import clsx from "clsx"
import Badge, { type ProjectStatus } from "../ui/Badge"
import Avatar from "../ui/Avatar"
import AvatarGroup from "../ui/AvatarGroup"
import ProgressBar, { type ProgressColor } from "../ui/ProgressBar"
import { formatDateRange } from "../../utils/dateFormat"

interface Usuario { id: string; nombre: string }
interface Advertencia { tipo: string; nivel: "CRITICA" | "MEDIA" | "BAJA"; mensaje: string }
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
  advertencias?: Advertencia[]
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

const STATE_PROGRESS: Record<string, ProgressColor> = {
  EN_CURSO:    "primary",
  ADVERTENCIA: "warning",
  EN_RIESGO:   "danger",
  FINALIZADO:  "neutral",
  PROPUESTA:   "info",
}

export default function ProjectCard({ proyecto, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  const now = Date.now()
  const start = new Date(proyecto.fechaInicio).getTime()
  const end   = new Date(proyecto.fechaFin).getTime()
  const progressPct =
    proyecto.estado === "FINALIZADO" ? 100 :
    end <= start ? 0 :
    Math.min(100, Math.max(0, Math.round((now - start) / (end - start) * 100)))

  const teamNames = [proyecto.lider, proyecto.socio2]
    .filter((u): u is Usuario => Boolean(u))
    .map(u => u.nombre)

  return (
    <motion.div
      role="link"
      tabIndex={0}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group relative card-surface card-surface-hover overflow-hidden cursor-pointer"
      onClick={() => navigate(`/projects/${proyecto.id}`)}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && navigate(`/projects/${proyecto.id}`)}
    >
      {/* Vertical state bar */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-200 group-hover:w-1",
          STATE_BAR[proyecto.estado] ?? "bg-state-zinc",
        )}
      />

      {/* Main content */}
      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* Row 1: name + badge + ⋯ */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <h3 className="text-sm font-semibold text-ink leading-snug flex-1 min-w-0 line-clamp-2">
            {proyecto.nombre}
          </h3>
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <Badge variant={proyecto.estado as ProjectStatus} size="sm" />
            <div ref={menuRef} className="relative">
              <button
                aria-label="Opciones"
                className={clsx(
                  "flex items-center justify-center w-6 h-6 rounded",
                  "text-ink-3 hover:text-ink hover:bg-canvas-2",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                )}
                onClick={() => setMenuOpen(v => !v)}
              >
                <MoreVertical size={13} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-canvas border border-ui-border rounded-lg shadow-elevated py-1 min-w-[120px]">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ink-2 hover:bg-canvas-2 hover:text-ink text-left"
                    onClick={() => { setMenuOpen(false); onEdit() }}
                  >
                    <Edit2 size={11} /> Editar
                  </button>
                  {onDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-state-red hover:bg-state-red-bg text-left"
                      onClick={() => { setMenuOpen(false); onDelete() }}
                    >
                      <Trash2 size={11} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Avatar xs + category · leader */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Avatar name={proyecto.lider.nombre} size="xs" />
          <span className="text-[11px] text-ink-3 truncate">
            {proyecto.categoria?.nombre} · {proyecto.lider.nombre}
          </span>
        </div>

        {/* Row 3: Date range */}
        <div className="flex items-center gap-1.5 mb-3">
          <Calendar size={11} className="text-ink-4 flex-shrink-0" />
          <span className="font-mono text-[10px] text-ink-3 leading-none tracking-tight">
            {formatDateRange(new Date(proyecto.fechaInicio), new Date(proyecto.fechaFin))}
          </span>
        </div>

        {/* Row 4: Team avatars */}
        <AvatarGroup names={teamNames} size="sm" max={4} />
      </div>

      {/* Progress bar — absolute bottom */}
      <ProgressBar
        value={progressPct}
        color={STATE_PROGRESS[proyecto.estado] ?? "neutral"}
        height={3}
        animated={false}
        className="absolute bottom-0 left-0 right-0"
      />
    </motion.div>
  )
}
