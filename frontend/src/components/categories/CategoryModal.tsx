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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
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
    <Modal onClose={onClose} accentColor={editando ? "var(--accent)" : "var(--navy, #1e3a6e)"}>
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.3,
          }}>
            {editando ? "Editar Categoría" : "Nueva Categoría"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            {editando ? "Modifica los datos de la categoría" : "Agrega una nueva categoría de proyectos"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nombre */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6 }}>
              Nombre <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Ambiental"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--card-border)")}
            />
          </div>

          {/* Color + preview */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6 }}>
              Color de identificación
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: 48, height: 40, borderRadius: 10,
                  border: "1.5px solid var(--card-border)",
                  background: "var(--content-bg)", cursor: "pointer",
                  padding: 4,
                }}
              />
              <div style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                background: color + "18",
                border: `1.5px solid ${color}40`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  {nombre || "Vista previa"}
                </span>
              </div>
            </div>
          </div>

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
            {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Categoría"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
