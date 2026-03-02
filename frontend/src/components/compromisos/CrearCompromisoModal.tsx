import { useState, useEffect } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"

interface Props {
  proyectoId: string
  onClose: () => void
  compromiso?: any
}

export default function CompromisoModal({ proyectoId, onClose, compromiso }: Props) {
  const [descripcion, setDescripcion] = useState(compromiso?.descripcion || "")
  const [fecha, setFecha] = useState(compromiso ? compromiso.fechaActual.split("T")[0] : "")
  const [responsables, setResponsables] = useState<any[]>([])
  const [responsableId, setResponsableId] = useState<string | null>(compromiso?.responsableId || null)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const res = await api.get("/usuarios")
        setResponsables(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadUsuarios()
  }, [])

  const handleSubmit = async () => {
    setError("")

    if (!descripcion.trim()) {
      setError("La descripción es obligatoria")
      return
    }

    if (!fecha) {
      setError("La fecha es obligatoria")
      return
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // ponemos la hora a 00:00

    if (new Date(fecha) < hoy) {
    setError("La fecha no puede ser pasada")
    return
    }

    try {
      if (compromiso) {
        // Editar
        await api.patch(`/compromisos/${compromiso.id}/resolver`, {
          decision: "REPROGRAMAR",
          nuevaFecha: fecha,
        })
      } else {
        // Crear
        await api.post("/compromisos", {
          descripcion,
          fecha,
          proyectoId,
          responsableId,
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
          {compromiso ? "Editar Compromiso" : "Nuevo Compromiso"}
        </h2>

        <div className="space-y-3">
          <textarea
            placeholder="Descripción *"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400"
          />

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400"
          />

          <select
            value={responsableId ?? ""}
            onChange={(e) => setResponsableId(e.target.value || null)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-100"
          >
            <option value="">Sin asignar</option>
            {responsables.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>

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
              {compromiso ? "Guardar Cambios" : "Crear"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}