import { useState } from "react"
import { api } from "../../services/api"
import Modal from "../ui/Modal"
import CrearCompromisoModal from "../compromisos/CrearCompromisoModal"
import { CheckCircle2, Calendar, FileText, ArrowRight, Clock, Plus } from "lucide-react"

interface Compromiso {
  id: string
  descripcion: string
  estado: string
  fechaActual: string
}

interface Reunion {
  id: string
  fecha: string
  objetivos: string
  proximospasos?: string
  calidadAprobada: boolean
  proximaReunion?: string
  compromisos: Compromiso[]
  proyectoId: string
}

interface Props {
  reunion: Reunion
  onClose: () => void
  onUpdate: () => void
}

const ESTADO_CFG: Record<string, { bg: string; color: string; label: string }> = {
  PENDIENTE:    { bg: "#fef9c3", color: "#a16207", label: "Pendiente" },
  CUMPLIDO:     { bg: "#dcfce7", color: "#15803d", label: "Cumplido" },
  NO_CUMPLIDO:  { bg: "#fee2e2", color: "#dc2626", label: "No cumplido" },
  REPROGRAMADO: { bg: "#dbeafe", color: "#1d4ed8", label: "Reprogramado" },
}

export default function DetalleReunionModal({ reunion, onClose, onUpdate }: Props) {
  const [aprobando, setAprobando] = useState(false)
  const [showCrearCompromiso, setShowCrearCompromiso] = useState(false)

  const handleAprobarCalidad = async () => {
    try {
      setAprobando(true)
      await api.patch(`/reuniones/${reunion.id}`, { calidadAprobada: true })
      onUpdate()
    } catch (err) {
      console.error("Error aprobando calidad", err)
    } finally {
      setAprobando(false)
    }
  }

  return (
    <>
      <Modal onClose={onClose} size="md" accentColor="var(--navy, #1e3a6e)">
        <div style={{ padding: "28px 28px 24px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, paddingRight: 40 }}>
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 4,
              }}>
                Reunión de seguimiento
              </p>
              <h2 style={{
                fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
                fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.3,
              }}>
                {new Date(reunion.fecha).toLocaleDateString("es-CO", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </h2>
            </div>
            {reunion.calidadAprobada ? (
              <span style={{
                padding: "5px 12px", borderRadius: 99, flexShrink: 0,
                background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0",
                fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <CheckCircle2 size={12} /> Calidad aprobada
              </span>
            ) : (
              <button
                onClick={handleAprobarCalidad}
                disabled={aprobando}
                style={{
                  padding: "5px 12px", borderRadius: 99, flexShrink: 0, cursor: "pointer",
                  background: "rgba(249,115,22,0.10)", color: "var(--accent)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s", opacity: aprobando ? 0.6 : 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(249,115,22,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(249,115,22,0.10)")}
              >
                {aprobando ? "Aprobando..." : "Aprobar calidad"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Objetivos */}
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: "var(--content-bg)", border: "1px solid var(--card-border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <FileText size={12} color="var(--navy, #1e3a6e)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--navy, #1e3a6e)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Objetivos
                </span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                {reunion.objetivos}
              </p>
            </div>

            {/* Próximos pasos */}
            {reunion.proximospasos && (
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <ArrowRight size={12} color="var(--accent)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Próximos pasos
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                  {reunion.proximospasos}
                </p>
              </div>
            )}

            {/* Próxima reunión */}
            {reunion.proximaReunion && (
              <div style={{
                padding: "12px 16px", borderRadius: 12,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Clock size={14} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                    Próxima reunión
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0, fontWeight: 500 }}>
                    {new Date(reunion.proximaReunion).toLocaleDateString("es-CO", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Compromisos */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <Calendar size={12} color="var(--navy, #1e3a6e)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--navy, #1e3a6e)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Compromisos asociados ({reunion.compromisos.length})
                </span>
              </div>
              {reunion.compromisos.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", padding: "12px 0" }}>
                  Sin compromisos vinculados a esta reunión.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {reunion.compromisos.map((c) => {
                    const est = ESTADO_CFG[c.estado] ?? { bg: "#f1f5f9", color: "#64748b", label: c.estado }
                    return (
                      <div key={c.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                        background: "var(--content-bg)", padding: "10px 14px", borderRadius: 10,
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.descripcion}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", margin: 0, marginTop: 2 }}>
                            {new Date(c.fechaActual).toLocaleDateString("es-CO")}
                          </p>
                        </div>
                        <span style={{
                          padding: "3px 8px", borderRadius: 99, flexShrink: 0,
                          background: est.bg, color: est.color,
                          fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {est.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
            <button
              onClick={() => setShowCrearCompromiso(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                background: "rgba(249,115,22,0.08)", color: "var(--accent)",
                border: "1px solid rgba(249,115,22,0.20)",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(249,115,22,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(249,115,22,0.08)")}
            >
              <Plus size={14} />
              Agregar compromiso
            </button>
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
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {showCrearCompromiso && (
        <CrearCompromisoModal
          proyectoId={reunion.proyectoId}
          reunionId={reunion.id}
          onClose={() => {
            setShowCrearCompromiso(false)
            onUpdate()
          }}
        />
      )}
    </>
  )
}
