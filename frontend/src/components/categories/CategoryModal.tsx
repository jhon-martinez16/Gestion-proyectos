import { useState } from "react"
import Modal from "../ui/Modal"
import { api } from "../../services/api"

interface Categoria {
  id: string
  nombre: string
  color: string
}

interface Props {
  onClose: () => void
  categoria?: Categoria
}

export default function CategoryModal({ onClose, categoria }: Props) {
  const editando = !!categoria
  const [nombre, setNombre] = useState(categoria?.nombre ?? "")
  const [color, setColor] = useState(categoria?.color ?? "#F58220")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return }

    try {
      setLoading(true)

      if (editando) {
        await api.patch(`/categorias/${categoria!.id}`, { nombre, color })
      } else {
        await api.post("/categorias", { nombre, color })
      }

      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar la categoría.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        <h2 className="text-2xl font-bold text-[#0B355A]">
          {editando ? "Editar Categoría" : "Nueva Categoría"}
        </h2>

        <div className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Ambiental"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Color</label>
            <input
              type="color"
              className="w-full h-12 rounded-xl border border-gray-200 mt-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#F58220] hover:bg-[#d96f18] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Categoría"}
        </button>

      </div>
    </Modal>
  )
}
