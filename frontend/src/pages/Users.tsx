import { useEffect, useState } from "react"
import { api } from "../services/api"
import UserModal from "../components/users/UserModal"

interface User {
  id: string
  nombre: string
  email: string
  rol: "ADMIN" | "SOCIO" | "ADMINISTRATIVO"
  activo: boolean
}

const ROL_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SOCIO: "Socio",
  ADMINISTRATIVO: "Administrativo",
}

const ROL_OPTIONS = [
  { value: "todos", label: "Todos los roles" },
  { value: "ADMIN",          label: "Administrador" },
  { value: "SOCIO",          label: "Socio" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
]

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [filtroRol, setFiltroRol] = useState("todos")
  const [showModal, setShowModal] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/usuarios")
      setUsers(res.data)
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDesactivar = async (u: User) => {
    if (!window.confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`)) return
    try {
      await api.patch(`/usuarios/${u.id}/desactivar`)
      loadData()
    } catch {
      setError("Error desactivando usuario.")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setUsuarioEditando(null)
    loadData()
  }

  const filteredUsers = filtroRol === "todos" ? users : users.filter((u) => u.rol === filtroRol)

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={loadData} className="px-5 py-2 bg-[#16A34A] text-white rounded-xl font-medium hover:bg-[#15803D] transition">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#DDF7E6] px-6 py-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">Usuarios</h1>
          <p className="text-sm text-green-900/70 mt-1">Administración de usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* FILTRO POR ROL */}
      <div className="flex gap-3 flex-wrap">
        {ROL_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setFiltroRol(o.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filtroRol === o.value ? "bg-[#16A34A] text-white shadow-sm" : "bg-white border border-green-100 text-gray-600 hover:bg-green-50"}`}
          >
            {o.label}
            {o.value !== "todos" && (
              <span className="ml-1.5 text-xs opacity-70">({users.filter((u) => u.rol === o.value).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* LISTADO */}
      <div className="grid gap-4">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="bg-white border border-green-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-800">{u.nombre}</p>
              <p className="text-sm text-gray-500">{u.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ROL_LABELS[u.rol] ?? u.rol}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {u.activo ? "Activo" : "Inactivo"}
              </span>
              <button
                onClick={() => setUsuarioEditando(u)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              >
                Editar
              </button>
              {u.activo && (
                <button
                  onClick={() => handleDesactivar(u)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-400 py-8">No hay usuarios con el filtro seleccionado.</p>
        )}
      </div>

      {(showModal || usuarioEditando) && (
        <UserModal onClose={handleCloseModal} usuario={usuarioEditando ?? undefined} />
      )}
    </div>
  )
}
