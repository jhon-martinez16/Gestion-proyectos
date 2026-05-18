import { useState } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"

interface ReunionEditar {
  id: string
  fecha: string
  objetivos: string
  proximospasos?: string
  proximaReunion?: string
}

interface Props {
  proyectoId: string
  onClose: () => void
  reunion?: ReunionEditar
}

export default function CrearReunionModal({ proyectoId, onClose, reunion }: Props) {
  const editando = !!reunion
  const [fecha, setFecha] = useState(reunion ? new Date(reunion.fecha).toISOString().split("T")[0] : "")
  const [objetivos, setObjetivos] = useState(reunion?.objetivos ?? "")
  const [proximospasos, setProximospasos] = useState(reunion?.proximospasos ?? "")
  const [proximaReunion, setProximaReunion] = useState(
    reunion?.proximaReunion ? new Date(reunion.proximaReunion).toISOString().split("T")[0] : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!fecha) { setError("La fecha es obligatoria"); return }
    if (!objetivos.trim()) { setError("Los objetivos son obligatorios"); return }

    try {
      setLoading(true)
      if (editando) {
        await api.patch(`/reuniones/${reunion!.id}`, {
          fecha,
          objetivos,
          proximospasos: proximospasos.trim() || undefined,
          proximaReunion: proximaReunion || undefined,
        })
      } else {
        await api.post("/reuniones", {
          fecha,
          objetivos,
          proximospasos: proximospasos.trim() || undefined,
          proximaReunion: proximaReunion || undefined,
          proyectoId,
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${editando ? "editar" : "crear"} la reunión`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1F2937] p-6 rounded-3xl w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-gray-100">
          {editando ? "Editar Reunión de Seguimiento" : "Nueva Reunión de Seguimiento"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">Fecha de la reunión *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Objetivos *</label>
            <textarea
              rows={3}
              placeholder="¿Qué se trató en la reunión?"
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Próximos pasos <span className="text-gray-500">(opcional)</span></label>
            <textarea
              rows={2}
              placeholder="Acciones acordadas..."
              value={proximospasos}
              onChange={(e) => setProximospasos(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Próxima reunión <span className="text-gray-500">(opcional)</span></label>
            <input
              type="date"
              value={proximaReunion}
              onChange={(e) => setProximaReunion(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-orange-400 hover:bg-orange-500 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Reunión"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
