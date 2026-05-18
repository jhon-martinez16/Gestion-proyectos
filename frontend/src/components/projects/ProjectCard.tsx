import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

interface Usuario {
  id: string
  nombre: string
}

interface Advertencia {
  tipo: string
  nivel: "CRITICA" | "MEDIA" | "BAJA"
  mensaje: string
}

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

const ETAPA_LABELS: Record<string, string> = {
  PROPUESTA:    "Propuesta",
  KICK_OFF:     "Kick-off",
  EN_EJECUCION: "En ejecución",
  CIERRE:       "Cierre",
}

const ETAPA_BADGES: Record<string, string> = {
  PROPUESTA:    "bg-purple-100 text-purple-700",
  KICK_OFF:     "bg-blue-100 text-blue-700",
  EN_EJECUCION: "bg-green-100 text-green-700",
  CIERRE:       "bg-gray-100 text-gray-600",
}

interface Props {
  proyecto: Proyecto
  onEdit: () => void
  onDelete?: () => void
}

const ESTADO_BADGE: Record<string, string> = {
  EN_CURSO:    "bg-green-100 text-green-700",
  ADVERTENCIA: "bg-yellow-100 text-yellow-700",
  EN_RIESGO:   "bg-red-100 text-red-700",
  FINALIZADO:  "bg-gray-100 text-gray-500",
}

const ESTADO_LABEL: Record<string, string> = {
  EN_CURSO:    "En curso",
  ADVERTENCIA: "Advertencia",
  EN_RIESGO:   "En riesgo",
  FINALIZADO:  "Finalizado",
}

export default function ProjectCard({ proyecto, onEdit, onDelete }: Props) {
  const navigate = useNavigate()

  const advertenciasCriticas =
    proyecto.advertencias?.filter((a) => a.nivel === "CRITICA").length || 0
  const advertenciasMedias =
    proyecto.advertencias?.filter((a) => a.nivel === "MEDIA").length || 0
  const compromisosVencidos =
    proyecto.advertencias?.filter(
      (a) => a.tipo === "COMPROMISO_VENCIDO" || a.tipo === "COMPROMISO_NO_CUMPLIDO"
    ).length ?? 0

  const esFinalizado = proyecto.estado === "FINALIZADO"

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/projects/${proyecto.id}`)}
      className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col gap-3
        ${esFinalizado ? "border-gray-200 opacity-70" : advertenciasCriticas > 0 ? "border-red-400" : advertenciasMedias > 0 ? "border-yellow-400" : "border-green-100"}`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h2 className={`text-lg font-semibold ${esFinalizado ? "text-gray-500" : "text-gray-800"}`}>{proyecto.nombre}</h2>
        <div className="flex gap-1.5 flex-wrap shrink-0">
          {proyecto.estado && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${esFinalizado ? "bg-gray-200 text-gray-600 border border-gray-300" : ESTADO_BADGE[proyecto.estado] ?? "bg-gray-100 text-gray-500"}`}>
              {esFinalizado ? "CERRADO" : (ESTADO_LABEL[proyecto.estado] ?? proyecto.estado)}
            </span>
          )}
          {proyecto.etapa && !esFinalizado && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ETAPA_BADGES[proyecto.etapa] ?? "bg-gray-100 text-gray-500"}`}>
              {ETAPA_LABELS[proyecto.etapa] ?? proyecto.etapa}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">{proyecto.descripcion}</p>

      <div className="flex justify-between text-sm text-gray-600">
        <span>Líder: {proyecto.lider?.nombre}</span>
        {proyecto.socio2 && <span>Socio2: {proyecto.socio2.nombre}</span>}
      </div>

      <div className="text-xs text-gray-500">
        Inicio: {new Date(proyecto.fechaInicio).toLocaleDateString()} | Fin:{" "}
        {new Date(proyecto.fechaFin).toLocaleDateString()}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-[#16A34A]">{proyecto.categoria?.nombre}</span>
        {compromisosVencidos > 0 && (
          <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            {compromisosVencidos} comp. vencidos
          </span>
        )}
      </div>

      {(advertenciasCriticas > 0 || advertenciasMedias > 0) && (
        <div className="flex gap-2 text-xs font-semibold">
          {advertenciasCriticas > 0 && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
              🔴 {advertenciasCriticas} críticas
            </span>
          )}
          {advertenciasMedias > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              🟡 {advertenciasMedias} advertencias
            </span>
          )}
        </div>
      )}

      {/* ACCIONES */}
      <div
        className="flex gap-2 pt-2 border-t border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="flex-1 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
        >
          Editar
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 py-1.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
          >
            Eliminar
          </button>
        )}
      </div>
    </motion.div>
  )
}
