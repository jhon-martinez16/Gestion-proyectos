import { useState } from "react"
import Modal from "../ui/Modal"
import { api } from "../../services/api"

interface Props {
  proyectoId: number
  onClose: () => void
}

export default function CommitmentModal({
  proyectoId,
  onClose,
}: Props) {
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!descripcion.trim() || !fecha) return

    try {
      setLoading(true)

      await api.post("/compromisos", {
        descripcion,
        fechaOriginal: fecha,
        fechaActual: fecha,
        proyectoId,
      })

      onClose()
    } catch (error) {
      console.error("Error creando compromiso", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        <h2 className="text-2xl font-bold text-[#0B355A]">
          Nuevo Compromiso
        </h2>

        <div className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">
              Descripción
            </label>
            <input
              type="text"
              placeholder="Ej: Entregar informe ambiental"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Fecha
            </label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#F58220] hover:bg-[#d96f18] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Compromiso"}
        </button>

      </div>
    </Modal>
  )
}