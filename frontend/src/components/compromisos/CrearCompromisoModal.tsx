import { useState, useEffect } from "react"
import { api } from "../../services/api"
import Modal from "../ui/Modal"

interface Props {
  proyectoId: string
  onClose: () => void
  compromiso?: any
  reunionId?: string
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14,  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  display: "block", marginBottom: 6,
}

type Prioridad = "BAJA" | "MEDIA" | "ALTA"

const PRIORIDAD_CFG: Record<Prioridad, { label: string; color: string; bg: string; border: string }> = {
  BAJA:  { label: "Baja",  color: "#16a34a", bg: "#f0fdf4", border: "#16a34a" },
  MEDIA: { label: "Media", color: "#b45309", bg: "#fffbeb", border: "#d97706" },
  ALTA:  { label: "Alta",  color: "#dc2626", bg: "#fef2f2", border: "#ef4444" },
}

export default function CompromisoModal({ proyectoId, onClose, compromiso, reunionId }: Props) {
  const editando = !!compromiso
  const [descripcion, setDescripcion] = useState(compromiso?.descripcion || "")
  const [fecha, setFecha] = useState(compromiso ? compromiso.fechaActual.split("T")[0] : "")
  const [responsables, setResponsables] = useState<any[]>([])
  const [responsableId, setResponsableId] = useState<string | null>(compromiso?.responsableId || null)
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA")
  const [error, setError] = useState("")

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const res = await api.get("/usuarios/asignables")
        setResponsables(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadUsuarios()
  }, [])

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "var(--card-border)")

  const handleSubmit = async () => {
    setError("")
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return }
    if (!fecha) { setError("La fecha es obligatoria"); return }

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    if (new Date(fecha) < hoy) { setError("La fecha no puede ser pasada"); return }

    try {
      if (compromiso) {
        await api.patch(`/compromisos/${compromiso.id}/resolver`, {
          decision: "REPROGRAMAR",
          nuevaFecha: fecha,
        })
      } else {
        await api.post("/compromisos", {
          descripcion,
          fecha,
          proyectoId,
          responsableId,
          ...(reunionId ? { reunionId } : {}),
        })
      }
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Error al guardar")
    }
  }

  return (
    <Modal onClose={onClose} accentColor={editando ? "var(--accent)" : "var(--navy, #1e3a6e)"}>
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            margin: 0, lineHeight: 1.3,
          }}>
            {editando ? "Reprogramar Compromiso" : "Nuevo Compromiso"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {editando
              ? "Establece una nueva fecha límite para este compromiso"
              : "Define un compromiso y asígnalo a un responsable"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Descripción */}
          {!editando && (
            <div>
              <label style={labelStyle}>
                Descripción <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="¿Qué compromiso se adquirió?"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.5 } as React.CSSProperties}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          )}

          {editando && (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: "var(--content-bg)", border: "1px solid var(--card-border)",
            }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Compromiso a reprogramar
              </p>
              <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
                {compromiso.descripcion}
              </p>
            </div>
          )}

          {/* Prioridad (solo para nuevos compromisos) */}
          {!editando && (
            <div>
              <label style={labelStyle}>Prioridad</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {(["BAJA", "MEDIA", "ALTA"] as Prioridad[]).map(p => {
                  const cfg = PRIORIDAD_CFG[p]
                  const active = prioridad === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridad(p)}
                      style={{
                        padding: "8px 6px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${active ? cfg.border : "var(--card-border)"}`,
                        background: active ? cfg.bg : "var(--content-bg)",
                        color: active ? cfg.color : "var(--text-muted)",
                        fontSize: 12, fontWeight: active ? 700 : 500,
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}
                    >
                      <span style={{ fontSize: 10 }}>{p === "BAJA" ? "▼" : p === "MEDIA" ? "▶" : "▲"}</span>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label style={labelStyle}>
              Fecha límite <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="date"
              value={fecha}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFecha(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Responsable */}
          {!editando && (
            <div>
              <label style={labelStyle}>
                Responsable
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
              </label>
              <select
                value={responsableId ?? ""}
                onChange={(e) => setResponsableId(e.target.value || null)}
                style={{ ...inputStyle, appearance: "none" } as React.CSSProperties}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="">Sin asignar</option>
                {responsables.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)" }}>
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
              transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: editando ? "var(--accent)" : "var(--navy, #1e3a6e)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: "pointer",              transition: "opacity 0.15s",
            }}
          >
            {editando ? "Reprogramar" : "Crear Compromiso"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
