import { useState } from "react"
import Modal from "../ui/Modal"
import { api } from "../../services/api"

interface Props {
  onClose: () => void
}

export default function CategoryModal({ onClose }: Props) {
  const [nombre, setNombre] = useState("")
  const [color, setColor] = useState("#F58220")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!nombre.trim()) return

    try {
      setLoading(true)

      await api.post("/categorias", {
        nombre,
        color,
        orden: 1,
      })

      onClose()
    } catch (error) {
      console.error("Error creando categoría", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        <h2 className="text-2xl font-bold text-[#0B355A]">
          Nueva Categoría
        </h2>

        <div className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Ambiental"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Color
            </label>
            <input
              type="color"
              className="w-full h-12 rounded-xl border border-gray-200 mt-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#F58220] hover:bg-[#d96f18] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Categoría"}
        </button>

      </div>
    </Modal>
  )
}