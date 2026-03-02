import { useState } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"

interface Props {
  proyectoId: string
  onClose: () => void
  entregable?: any // Si viene, estamos editando
}

export default function EntregableModal({ proyectoId, onClose, entregable }: Props) {
  const [nombre, setNombre] = useState(entregable?.nombre || "")
  const [descripcion, setDescripcion] = useState(entregable?.descripcion || "")
  const [fechaEntrega, setFechaEntrega] = useState(entregable ? entregable.fechaEntrega.split("T")[0] : "")
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")

    if (!nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }

    if (!fechaEntrega) {
      setError("La fecha de entrega es obligatoria")
      return
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // establecemos la hora a 00:00 para comparar solo fechas

    if (new Date(fechaEntrega) < hoy) {
    setError("La fecha de entrega no puede ser pasada")
    return
    }

    try {
      if (entregable) {
        // Editar
        await api.patch(`/entregables/${entregable.id}`, {
          nombre,
          descripcion,
          fechaEntrega,
        })
      } else {
        // Crear
        await api.post("/entregables", {
          nombre,
          descripcion,
          fechaEntrega,
          proyectoId,
        })
      }
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Error al guardar")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1F2937] p-6 rounded-3xl w-full max-w-md shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-100">
          {entregable ? "Editar Entregable" : "Nuevo Entregable"}
        </h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400"
          />

          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400"
          />

          <input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 transition text-white font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-orange-400 hover:bg-orange-500 transition text-white font-semibold"
            >
              {entregable ? "Guardar Cambios" : "Crear"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}