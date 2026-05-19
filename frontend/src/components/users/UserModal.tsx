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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6,
}

const ROL_OPTIONS = [
  { value: "SOCIO", label: "Socio", desc: "Acceso a sus proyectos asignados" },
  { value: "ADMINISTRATIVO", label: "Administrativo", desc: "Acceso a facturación y reportes" },
  { value: "ADMIN", label: "Administrador", desc: "Acceso completo al sistema" },
]

export default function UserModal({ onClose, usuario }: Props) {
  const editando = !!usuario
  const [nombre, setNombre] = useState(usuario?.nombre ?? "")
  const [email, setEmail] = useState(usuario?.email ?? "")
  const [password, setPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [rol, setRol] = useState<"ADMIN" | "SOCIO" | "ADMINISTRATIVO">(usuario?.rol ?? "SOCIO")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "var(--card-border)")

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
    <Modal onClose={onClose} accentColor={editando ? "var(--accent)" : "var(--navy, #1e3a6e)"}>
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.3,
          }}>
            {editando ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            {editando ? "Actualiza el nombre o email del usuario" : "Crea una nueva cuenta de acceso al sistema"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nombre */}
          <div>
            <label style={labelStyle}>
              Nombre completo <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>
              Email <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="email"
              placeholder="ejemplo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {!editando && (
            <>
              {/* Password */}
              <div>
                <label style={labelStyle}>
                  Contraseña <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Confirm password */}
              <div>
                <label style={labelStyle}>
                  Confirmar contraseña <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Rol cards */}
              <div>
                <label style={labelStyle}>Rol de acceso</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ROL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRol(opt.value as any)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 10,
                        border: `1.5px solid ${rol === opt.value ? "var(--navy, #1e3a6e)" : "var(--card-border)"}`,
                        background: rol === opt.value ? "rgba(30,58,110,0.06)" : "var(--content-bg)",
                        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `2px solid ${rol === opt.value ? "var(--navy, #1e3a6e)" : "#d1d5db"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {rol === opt.value && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--navy, #1e3a6e)" }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid var(--card-border)",
              background: "white", color: "var(--text-secondary)",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: editando ? "var(--accent)" : "var(--navy, #1e3a6e)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Usuario"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
