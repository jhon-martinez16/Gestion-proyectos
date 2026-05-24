import React, { useEffect, useState } from "react"
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

  const ROL_BADGE: Record<string, React.CSSProperties> = {
    ADMIN:          { background: "transparent", color: "var(--accent-gold)", border: "1px solid var(--accent-gold)" },
    ADMINISTRATIVO: { background: "transparent", color: "var(--accent-forest)", border: "1px solid var(--accent-forest)" },
    SOCIO:          { background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)" },
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {perfil && (
        <>
          {/* DATOS DEL PERFIL */}
          <div className="card-surface" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>Datos del perfil</h2>
              <span style={{ ...ROL_BADGE[perfil.rol], padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {perfil.rol === "ADMIN" ? "Administrador" : perfil.rol === "ADMINISTRATIVO" ? "Administrativo" : "Socio"}
              </span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="form-input w-full"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input w-full"
              />
            </div>

            {mensajePerfil && (
              <p style={{ fontSize: 13, fontWeight: 500, color: mensajePerfil.includes("Error") ? "var(--state-red)" : "var(--state-green)" }}>
                {mensajePerfil}
              </p>
            )}

            <div>
              <button
                onClick={handleGuardarPerfil}
                disabled={savingPerfil}
                className="btn-primary"
                style={{ height: 38, padding: "0 20px", fontSize: 14, opacity: savingPerfil ? 0.6 : 1 }}
              >
                {savingPerfil ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>

          {/* CAMBIAR CONTRASEÑA */}
          <div className="card-surface" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>Cambiar contraseña</h2>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input w-full"
              />
            </div>

            {mensajePassword && (
              <p style={{ fontSize: 13, fontWeight: 500, color: mensajePassword.includes("Error") || mensajePassword.includes("no coinciden") || mensajePassword.includes("menos") ? "var(--state-red)" : "var(--state-green)" }}>
                {mensajePassword}
              </p>
            )}

            <div>
              <button
                onClick={handleCambiarPassword}
                disabled={savingPassword}
                className="btn-primary"
                style={{ height: 38, padding: "0 20px", fontSize: 14, opacity: savingPassword ? 0.6 : 1 }}
              >
                {savingPassword ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
