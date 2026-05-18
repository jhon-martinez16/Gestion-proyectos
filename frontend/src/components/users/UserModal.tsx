import { useState } from "react"
import Modal from "../ui/Modal"
import { api } from "../../services/api"

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: "ADMIN" | "SOCIO" | "ADMINISTRATIVO"
}

interface Props {
  onClose: () => void
  usuario?: Usuario
}

export default function UserModal({ onClose, usuario }: Props) {
  const editando = !!usuario
  const [nombre, setNombre] = useState(usuario?.nombre ?? "")
  const [email, setEmail] = useState(usuario?.email ?? "")
  const [password, setPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [rol, setRol] = useState<"ADMIN" | "SOCIO" | "ADMINISTRATIVO">(usuario?.rol ?? "SOCIO")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return }
    if (!email.trim()) { setError("El email es obligatorio."); return }
    if (!editando && !password.trim()) { setError("La contraseña es obligatoria."); return }
    if (!editando && password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return }
    if (!editando && password !== confirmarPassword) { setError("Las contraseñas no coinciden."); return }

    try {
      setLoading(true)

      if (editando) {
        await api.patch(`/usuarios/${usuario!.id}`, { nombre, email })
      } else {
        await api.post("/usuarios", { nombre, email, password, rol })
      }

      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el usuario.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        <h2 className="text-2xl font-bold text-[#0B355A]">
          {editando ? "Editar Usuario" : "Nuevo Usuario"}
        </h2>

        <div className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              placeholder="ejemplo@empresa.com"
              className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!editando && (
            <>
              <div>
                <label className="text-sm text-gray-600">Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Confirmar contraseña</label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Rol</label>
                <select
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#F58220] bg-white"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as "ADMIN" | "SOCIO" | "ADMINISTRATIVO")}
                >
                  <option value="SOCIO">Socio</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                </select>
              </div>
            </>
          )}

        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#F58220] hover:bg-[#d96f18] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Usuario"}
        </button>

      </div>
    </Modal>
  )
}
