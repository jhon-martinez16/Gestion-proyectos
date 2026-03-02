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
  advertencias?: Advertencia[]
}

interface Props {
  proyecto: Proyecto
}

export default function ProjectCard({ proyecto }: Props) {
  const navigate = useNavigate()

  const advertenciasCriticas =
    proyecto.advertencias?.filter(a => a.nivel === "CRITICA").length || 0

  const advertenciasMedias =
    proyecto.advertencias?.filter(a => a.nivel === "MEDIA").length || 0

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/projects/${proyecto.id}`)}
      className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer
      ${
        advertenciasCriticas > 0
          ? "border-red-400"
          : advertenciasMedias > 0
          ? "border-yellow-400"
          : "border-green-100"
      }`}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        {proyecto.nombre}
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        {proyecto.descripcion}
      </p>

      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Líder: {proyecto.lider?.nombre}</span>
        {proyecto.socio2 && <span>Socio2: {proyecto.socio2.nombre}</span>}
      </div>

      <div className="text-xs text-gray-500">
        Inicio: {new Date(proyecto.fechaInicio).toLocaleDateString()} | Fin:{" "}
        {new Date(proyecto.fechaFin).toLocaleDateString()}
      </div>

      <div className="mt-4 text-xs font-semibold text-[#16A34A]">
        {proyecto.categoria?.nombre}
      </div>

      {/* Indicador de advertencias */}
      {(advertenciasCriticas > 0 || advertenciasMedias > 0) && (
        <div className="mt-4 flex gap-2 text-xs font-semibold">
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
    </motion.div>
  )
}