import { useEffect, useState } from "react"
import { api } from "../services/api"
import UserModal from "../components/users/UserModal"

interface User {
  id: number
  nombre: string
  email: string
  activo: boolean
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)

  const loadData = async () => {
    const res = await api.get("/usuarios")
    setUsers(res.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#DDF7E6] px-6 py-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">
            Usuarios
          </h1>
          <p className="text-sm text-green-900/70 mt-1">
            Administración de usuarios del sistema
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* LISTADO */}
      <div className="grid gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white border border-green-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {u.nombre}
              </p>
              <p className="text-sm text-gray-500">
                {u.email}
              </p>
            </div>

            <span
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                u.activo
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {u.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <UserModal
          onClose={() => {
            setShowModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}