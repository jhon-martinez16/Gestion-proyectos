import { useState } from "react"
import Modal from "../ui/Modal"
import { api } from "../../services/api"

interface Props {
  onClose: () => void
}

export default function UserModal({ onClose }: Props) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!nombre.trim() || !email.trim()) return

    try {
      setLoading(true)

      await api.post("/usuarios", {
        nombre,
        email,
        activo: true,
      })

      onClose()
    } catch (error) {
      console.error("Error creando usuario", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        <h2 className="text-2xl font-bold text-[#0B355A]">
          Nuevo Usuario
        </h2>

        <div className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Email
            </label>
            <input
              type="email"
              placeholder="ejemplo@empresa.com"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#F58220] hover:bg-[#d96f18] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Usuario"}
        </button>

      </div>
    </Modal>
  )
}