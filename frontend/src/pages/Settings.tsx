import { useEffect, useState } from "react"
import { api } from "../services/api"
import { getUserIdFromToken } from "../utils/auth"

interface Perfil {
  id: string
  nombre: string
  email: string
  rol: "ADMIN" | "SOCIO" | "ADMINISTRATIVO"
}

export default function Settings() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [mensajePerfil, setMensajePerfil] = useState<string | null>(null)
  const [mensajePassword, setMensajePassword] = useState<string | null>(null)

  useEffect(() => {
    const id = getUserIdFromToken()
    if (!id) return
    api.get(`/usuarios/${id}`).then((res) => {
      setPerfil(res.data)
      setNombre(res.data.nombre)
      setEmail(res.data.email)
    })
  }, [])

  const handleGuardarPerfil = async () => {
    if (!perfil || !nombre.trim() || !email.trim()) return
    setSavingPerfil(true)
    setMensajePerfil(null)
    try {
      await api.patch(`/usuarios/${perfil.id}`, { nombre, email })
      setMensajePerfil("Perfil actualizado correctamente.")
    } catch {
      setMensajePerfil("Error al actualizar el perfil.")
    } finally {
      setSavingPerfil(false)
    }
  }

  const handleCambiarPassword = async () => {
    if (!perfil) return
    if (password.length < 6) {
      setMensajePassword("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setMensajePassword("Las contraseñas no coinciden.")
      return
    }
    setSavingPassword(true)
    setMensajePassword(null)
    try {
      await api.patch(`/usuarios/${perfil.id}`, { password })
      setMensajePassword("Contraseña actualizada correctamente.")
      setPassword("")
      setConfirmPassword("")
    } catch {
      setMensajePassword("Error al cambiar la contraseña.")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER */}
      <div className="bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-[#14532D]">Configuración</h1>
        <p className="text-green-900/70 mt-2">Administra tu perfil y credenciales.</p>
      </div>

      {perfil && (
        <>
          {/* DATOS DEL PERFIL */}
          <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Datos del perfil</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                perfil.rol === "ADMIN" ? "bg-orange-100 text-orange-700"
                : perfil.rol === "ADMINISTRATIVO" ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
              }`}>
                {perfil.rol === "ADMIN" ? "Administrador" : perfil.rol === "ADMINISTRATIVO" ? "Administrativo" : "Socio"}
              </span>
            </div>

            <div>
              <label className="text-sm text-gray-600">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {mensajePerfil && (
              <p className={`text-sm font-medium ${mensajePerfil.includes("Error") ? "text-red-500" : "text-green-600"}`}>
                {mensajePerfil}
              </p>
            )}

            <button
              onClick={handleGuardarPerfil}
              disabled={savingPerfil}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
            >
              {savingPerfil ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

          {/* CAMBIAR CONTRASEÑA */}
          <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Cambiar contraseña</h2>

            <div>
              <label className="text-sm text-gray-600">Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {mensajePassword && (
              <p className={`text-sm font-medium ${mensajePassword.includes("Error") || mensajePassword.includes("no coinciden") || mensajePassword.includes("menos") ? "text-red-500" : "text-green-600"}`}>
                {mensajePassword}
              </p>
            )}

            <button
              onClick={handleCambiarPassword}
              disabled={savingPassword}
              className="bg-[#F58220] hover:bg-[#d96f18] text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
            >
              {savingPassword ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
