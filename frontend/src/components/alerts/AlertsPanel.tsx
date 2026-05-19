import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, AlertCircle } from "lucide-react"

interface Alerta {
  tipo: string
  mensaje: string
  proyectoId: string
  proyectoNombre: string
  nivel: "CRITICA" | "MEDIA"
}

interface Props {
  alertas: Alerta[]
  onClose: () => void
}

const panelVariants = {
  initial: { opacity: 0, x: 320 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", damping: 32, stiffness: 340 } },
  exit:    { opacity: 0, x: 320, transition: { duration: 0.2 } },
}

export default function AlertsPanel({ alertas, onClose }: Props) {
  const navigate = useNavigate()
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set())

  const descartar = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDescartadas(prev => new Set([...prev, key]))
  }

  const alertaKey = (a: Alerta, i: number) => `${a.tipo}-${a.proyectoId}-${i}`
  const visibles  = alertas.filter((a, i) => !descartadas.has(alertaKey(a, i)))
  const criticas  = visibles.filter(a => a.nivel === "CRITICA")
  const medias    = visibles.filter(a => a.nivel === "MEDIA")

  const groupByProject = (list: Alerta[]) =>
    list.reduce((map: Record<string, Alerta[]>, a) => {
      if (!map[a.proyectoId]) map[a.proyectoId] = []
      map[a.proyectoId].push(a)
      return map
    }, {})

  const handleClick = (proyectoId: string) => {
    onClose(); navigate(`/projects/${proyectoId}`)
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)", zIndex: 40,
          }}
          onClick={onClose}
        />

        <motion.div
          key="panel"
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: "fixed", right: 0, top: 0, bottom: 0,
            width: 380, background: "white", zIndex: 50,
            boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
            borderLeft: "1px solid var(--card-border)",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--danger-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertTriangle size={18} color="var(--danger)" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Alertas del sistema
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  {visibles.length} alerta{visibles.length !== 1 ? "s" : ""} activa{visibles.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-muted)", transition: "var(--transition)",
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = "white"); (e.currentTarget.style.color = "var(--text-primary)") }}
              onMouseLeave={e => { (e.currentTarget.style.background = "var(--content-bg)"); (e.currentTarget.style.color = "var(--text-muted)") }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {visibles.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: "var(--primary-light)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
                }}>
                  <AlertCircle size={20} color="var(--primary)" />
                </div>
                <p style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                  No hay alertas activas
                </p>
              </div>
            )}

            {criticas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--danger)",
                  marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
                }}>
                  Críticas ({criticas.length})
                </p>
                {Object.entries(groupByProject(criticas)).map(([proyectoId, alertasP]) => (
                  <div key={proyectoId} style={{
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden", marginBottom: 8,
                  }}>
                    <button
                      onClick={() => handleClick(proyectoId)}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px",
                        background: "var(--danger-light)", border: "none", cursor: "pointer",
                        borderBottom: "1px solid rgba(239,68,68,0.15)",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--danger-light)")}
                    >
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>
                        {alertasP[0].proyectoNombre}
                      </p>
                    </button>
                    {alertasP.map((a, i) => {
                      const key = alertaKey(a, alertas.indexOf(a))
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                          gap: 8, padding: "9px 14px",
                          borderTop: i > 0 ? "1px solid rgba(239,68,68,0.08)" : "none",
                          background: "white",
                        }}>
                          <p style={{ fontSize: 12, color: "var(--danger)", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
                            {a.mensaje}
                          </p>
                          <button
                            onClick={e => descartar(key, e)}
                            style={{ flexShrink: 0, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {medias.length > 0 && (
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--warning)",
                  marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
                }}>
                  Advertencias ({medias.length})
                </p>
                {Object.entries(groupByProject(medias)).map(([proyectoId, alertasP]) => (
                  <div key={proyectoId} style={{
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden", marginBottom: 8,
                  }}>
                    <button
                      onClick={() => handleClick(proyectoId)}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px",
                        background: "var(--warning-light)", border: "none", cursor: "pointer",
                        borderBottom: "1px solid rgba(245,158,11,0.15)",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,158,11,0.12)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--warning-light)")}
                    >
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", fontFamily: "'DM Sans', sans-serif" }}>
                        {alertasP[0].proyectoNombre}
                      </p>
                    </button>
                    {alertasP.map((a, i) => {
                      const key = alertaKey(a, alertas.indexOf(a))
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                          gap: 8, padding: "9px 14px",
                          borderTop: i > 0 ? "1px solid rgba(245,158,11,0.08)" : "none",
                          background: "white",
                        }}>
                          <p style={{ fontSize: 12, color: "#92400e", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
                            {a.mensaje}
                          </p>
                          <button
                            onClick={e => descartar(key, e)}
                            style={{ flexShrink: 0, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
