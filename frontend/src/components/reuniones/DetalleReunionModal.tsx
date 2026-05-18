import { useState } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"
import CrearCompromisoModal from "../compromisos/CrearCompromisoModal"

interface Compromiso {
  id: string
  descripcion: string
  estado: string
  fechaActual: string
}

interface Reunion {
  id: string
  fecha: string
  objetivos: string
  proximospasos?: string
  calidadAprobada: boolean
  proximaReunion?: string
  compromisos: Compromiso[]
  proyectoId: string
}

interface Props {
  reunion: Reunion
  onClose: () => void
  onUpdate: () => void
}

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE:    "bg-yellow-100 text-yellow-700",
  CUMPLIDO:     "bg-green-100 text-green-700",
  NO_CUMPLIDO:  "bg-red-100 text-red-700",
  REPROGRAMADO: "bg-blue-100 text-blue-700",
}

export default function DetalleReunionModal({ reunion, onClose, onUpdate }: Props) {
  const [aprobando, setAprobando] = useState(false)
  const [showCrearCompromiso, setShowCrearCompromiso] = useState(false)

  const handleAprobarCalidad = async () => {
    try {
      setAprobando(true)
      await api.patch(`/reuniones/${reunion.id}`, { calidadAprobada: true })
      onUpdate()
    } catch (err) {
      console.error("Error aprobando calidad", err)
    } finally {
      setAprobando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1F2937] p-6 rounded-3xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto space-y-5"
      >
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Reunión de seguimiento</p>
            <h2 className="text-xl font-bold text-gray-100">
              {new Date(reunion.fecha).toLocaleDateString("es-CO", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </h2>
          </div>
          {reunion.calidadAprobada ? (
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
              Calidad aprobada
            </span>
          ) : (
            <button
              onClick={handleAprobarCalidad}
              disabled={aprobando}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition disabled:opacity-50"
            >
              {aprobando ? "Aprobando..." : "Aprobar calidad"}
            </button>
          )}
        </div>

        {/* OBJETIVOS */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Objetivos</p>
          <p className="text-gray-200 text-sm whitespace-pre-wrap">{reunion.objetivos}</p>
        </div>

        {/* PRÓXIMOS PASOS */}
        {reunion.proximospasos && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Próximos pasos</p>
            <p className="text-gray-200 text-sm whitespace-pre-wrap">{reunion.proximospasos}</p>
          </div>
        )}

        {/* PRÓXIMA REUNIÓN */}
        {reunion.proximaReunion && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Próxima reunión</p>
            <p className="text-gray-200 text-sm">
              {new Date(reunion.proximaReunion).toLocaleDateString("es-CO", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* COMPROMISOS ASOCIADOS */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
            Compromisos asociados ({reunion.compromisos.length})
          </p>
          {reunion.compromisos.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin compromisos vinculados a esta reunión.</p>
          ) : (
            <ul className="space-y-2">
              {reunion.compromisos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 bg-gray-800 p-3 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{c.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(c.fechaActual).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLES[c.estado] ?? "bg-gray-700 text-gray-300"}`}>
                    {c.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setShowCrearCompromiso(true)}
            className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 text-sm font-medium transition"
          >
            + Agregar compromiso
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </motion.div>

      {showCrearCompromiso && (
        <CrearCompromisoModal
          proyectoId={reunion.proyectoId}
          reunionId={reunion.id}
          onClose={() => {
            setShowCrearCompromiso(false)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}
