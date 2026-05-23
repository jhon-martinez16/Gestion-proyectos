import { useState } from "react"
import { api } from "../../services/api"
import Modal from "../ui/Modal"
import { CheckCircle2, RotateCcw, Package } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  entregable: any
  onClose: (resolved?: boolean) => void
}

type Action = "COMPLETADO" | "REPROGRAMAR" | null

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "white", color: "var(--text-primary)",
  fontSize: 14,  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}

export default function EntregableVencidoModal({ entregable, onClose }: Props) {
  const hoy = new Date().toISOString().split("T")[0]
  const [action, setAction] = useState<Action>(null)
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [motivo, setMotivo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fechaLimite = new Date(entregable.fechaEntrega)
  const diasRetraso = Math.max(
    0,
    Math.floor((new Date().getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24))
  )

  const call = async (payload: object) => {
    setLoading(true)
    setError("")
    try {
      await api.patch(`/entregables/${entregable.id}`, payload)
      onClose(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al actualizar el entregable.")
    } finally {
      setLoading(false)
    }
  }

  const handleCompletado = () => call({ estado: "COMPLETADO" })

  const handleReprogramar = () => {
    if (!nuevaFecha) { setError("Selecciona la nueva fecha."); return }
    call({
      fechaEntrega: nuevaFecha,
      ...(motivo.trim() ? { motivoReprogramacion: motivo } : { motivoReprogramacion: "Reprogramado desde modal de vencidos" }),
    })
  }

  return (
    <Modal onClose={() => onClose(false)} accentColor="var(--danger)">
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 20, paddingRight: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "#fef2f2", border: "1px solid #fecaca",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Package size={16} color="var(--danger)" />
            </div>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
              margin: 0,
            }}>
              Entregable vencido
            </h2>
          </div>
          <p style={{
            fontSize: 14, fontWeight: 600, color: "var(--text-secondary)",
            paddingLeft: 42,
          }}>
            {entregable.nombre}
          </p>
          {entregable.descripcion && (
            <p style={{
              fontSize: 13, color: "var(--text-muted)",
              paddingLeft: 42, marginTop: 2,
            }}>
              {entregable.descripcion}
            </p>
          )}
          <p style={{
            fontSize: 12, color: "var(--danger)", fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace", marginTop: 6, paddingLeft: 42,
          }}>
            Venció el {fechaLimite.toLocaleDateString("es-CO")}
            {diasRetraso > 0 && ` · ${diasRetraso} día${diasRetraso === 1 ? "" : "s"} de retraso`}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Acción: Completado */}
          <div style={{
            borderRadius: 12, border: `1.5px solid ${action === "COMPLETADO" ? "#16a34a" : "var(--card-border)"}`,
            overflow: "hidden", transition: "border-color 0.15s",
          }}>
            <button
              onClick={() => setAction(action === "COMPLETADO" ? null : "COMPLETADO")}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", textAlign: "left", cursor: "pointer", border: "none",
                background: action === "COMPLETADO" ? "#f0fdf4" : "var(--content-bg)",
                transition: "background 0.15s",              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: action === "COMPLETADO" ? "#16a34a" : "#e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}>
                <CheckCircle2 size={14} color={action === "COMPLETADO" ? "white" : "#64748b"} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: action === "COMPLETADO" ? "#15803d" : "var(--text-primary)", margin: 0 }}>
                  Marcar como completado
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  El entregable fue entregado
                </p>
              </div>
            </button>
            <AnimatePresence>
              {action === "COMPLETADO" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "12px 16px 14px", borderTop: "1px solid #dcfce7", background: "#f0fdf4" }}>
                    <p style={{
                      fontSize: 12, color: "#15803d",
                      marginBottom: 10,
                    }}>
                      Se registrará en el historial con los días de retraso correspondientes.
                    </p>
                    <button
                      onClick={handleCompletado}
                      disabled={loading}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 10,
                        border: "none", background: "#16a34a", color: "white",
                        fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {loading ? "Guardando..." : "Confirmar como completado"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Acción: Reprogramar */}
          <div style={{
            borderRadius: 12, border: `1.5px solid ${action === "REPROGRAMAR" ? "var(--info)" : "var(--card-border)"}`,
            overflow: "hidden", transition: "border-color 0.15s",
          }}>
            <button
              onClick={() => setAction(action === "REPROGRAMAR" ? null : "REPROGRAMAR")}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", textAlign: "left", cursor: "pointer", border: "none",
                background: action === "REPROGRAMAR" ? "#eff6ff" : "var(--content-bg)",
                transition: "background 0.15s",              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: action === "REPROGRAMAR" ? "var(--info)" : "#e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}>
                <RotateCcw size={14} color={action === "REPROGRAMAR" ? "white" : "#64748b"} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: action === "REPROGRAMAR" ? "#1d4ed8" : "var(--text-primary)", margin: 0 }}>
                  Reprogramar fecha de entrega
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Establece una nueva fecha límite
                </p>
              </div>
            </button>
            <AnimatePresence>
              {action === "REPROGRAMAR" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "12px 16px 14px", borderTop: "1px solid #dbeafe", background: "#eff6ff" }}>
                    <label style={{
                      fontSize: 12, fontWeight: 600, color: "#1d4ed8",
                      display: "block", marginBottom: 8,
                    }}>
                      Nueva fecha de entrega
                    </label>
                    <input
                      type="date"
                      value={nuevaFecha}
                      min={hoy}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      style={inputStyle}
                    />
                    <label style={{
                      fontSize: 12, fontWeight: 600, color: "#1d4ed8",
                      display: "block", marginBottom: 8, marginTop: 10,
                    }}>
                      Motivo
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Pendiente de aprobación del cliente"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      style={{ ...inputStyle, resize: "none", lineHeight: 1.5 } as React.CSSProperties}
                    />
                    <button
                      onClick={handleReprogramar}
                      disabled={loading}
                      style={{
                        width: "100%", marginTop: 10, padding: "10px", borderRadius: 10,
                        border: "none", background: "var(--info)", color: "white",
                        fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {loading ? "Guardando..." : "Confirmar reprogramación"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            onClick={() => onClose(false)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "var(--text-muted)",
              textDecoration: "underline", textUnderlineOffset: 2,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Cerrar sin resolver
          </button>
        </div>
      </div>
    </Modal>
  )
}
