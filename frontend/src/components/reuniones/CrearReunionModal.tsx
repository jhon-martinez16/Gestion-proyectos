import { useState } from "react"
import { api } from "../../services/api"
import Modal from "../ui/Modal"
import { CalendarDays, FileText, ArrowRight, Clock, Sparkles } from "lucide-react"
import GenerarActaModal from "./GenerarActaModal"

interface ReunionEditar {
  id: string
  fecha: string
  objetivos: string
  proximospasos?: string
  proximaReunion?: string
}

interface Props {
  proyectoId: string
  onClose: () => void
  reunion?: ReunionEditar
  proyecto?: { nombre: string; estado: string }
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14,  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "none" as const,
  lineHeight: 1.5,
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  display: "block", marginBottom: 6,
}

export default function CrearReunionModal({ proyectoId, onClose, reunion, proyecto }: Props) {
  const editando = !!reunion
  const [fecha, setFecha] = useState(reunion ? new Date(reunion.fecha).toISOString().split("T")[0] : "")
  const [objetivos, setObjetivos] = useState(reunion?.objetivos ?? "")
  const [proximospasos, setProximospasos] = useState(reunion?.proximospasos ?? "")
  const [proximaReunion, setProximaReunion] = useState(
    reunion?.proximaReunion ? new Date(reunion.proximaReunion).toISOString().split("T")[0] : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showActaModal, setShowActaModal] = useState(false)

  const contextoProyecto = { nombre: proyecto?.nombre ?? "", estado: proyecto?.estado ?? "" }

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--card-border)")

  const handleSubmit = async () => {
    setError("")
    if (!fecha) { setError("La fecha es obligatoria"); return }
    if (!objetivos.trim()) { setError("Los objetivos son obligatorios"); return }

    try {
      setLoading(true)
      if (editando) {
        await api.patch(`/reuniones/${reunion!.id}`, {
          fecha,
          objetivos,
          proximospasos: proximospasos.trim() || undefined,
          proximaReunion: proximaReunion || undefined,
        })
      } else {
        await api.post("/reuniones", {
          fecha,
          objetivos,
          proximospasos: proximospasos.trim() || undefined,
          proximaReunion: proximaReunion || undefined,
          proyectoId,
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${editando ? "editar" : "crear"} la reunión`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    {showActaModal && (
      <GenerarActaModal
        contextoProyecto={contextoProyecto}
        onUsar={(obj, pasos) => {
          setObjetivos(obj)
          setProximospasos(pasos)
          setShowActaModal(false)
        }}
        onCancelar={() => setShowActaModal(false)}
      />
    )}
    <Modal onClose={onClose} accentColor={editando ? "var(--accent)" : "var(--navy, #1e3a6e)"} size="md">
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            margin: 0, lineHeight: 1.3,
          }}>
            {editando ? "Editar Reunión" : "Nueva Reunión de Seguimiento"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {editando ? "Actualiza los datos de la reunión" : "Registra los puntos tratados y próximos pasos"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Section: Fecha */}
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "var(--content-bg)", border: "1px solid var(--card-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CalendarDays size={14} color="var(--navy, #1e3a6e)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy, #1e3a6e)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Fecha
              </span>
            </div>
            <label style={labelStyle}>
              Fecha de la reunión <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Section: Contenido */}
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "var(--content-bg)", border: "1px solid var(--card-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <FileText size={14} color="var(--navy, #1e3a6e)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy, #1e3a6e)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Contenido
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Objetivos / Temas tratados <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  {proyecto && (
                    <IaButton onClick={() => setShowActaModal(true)} />
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder="¿Qué se trató en la reunión?"
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  style={textareaStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Próximos pasos
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
                  </label>
                  {proyecto && (
                    <IaButton onClick={() => setShowActaModal(true)} />
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Acciones acordadas..."
                  value={proximospasos}
                  onChange={(e) => setProximospasos(e.target.value)}
                  style={textareaStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            </div>
          </div>

          {/* Section: Próxima reunión */}
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "var(--content-bg)", border: "1px solid var(--card-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Clock size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Seguimiento
              </span>
            </div>
            <label style={labelStyle}>
              Próxima reunión
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <input
              type="date"
              value={proximaReunion}
              onChange={(e) => setProximaReunion(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

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
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: editando ? "var(--accent)" : "var(--navy, #1e3a6e)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading ? "Guardando..." : (
              <>
                {editando ? "Guardar cambios" : "Registrar Reunión"}
                {!loading && <ArrowRight size={14} />}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
    </>
  )
}

function IaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 7, border: "none",
        background: "rgba(249,115,22,0.10)", color: "var(--accent, #f97316)",
        fontSize: 11, fontWeight: 700, cursor: "pointer",
        transition: "background 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.20)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(249,115,22,0.10)")}
    >
      <Sparkles size={11} />
      IA
    </button>
  )
}
