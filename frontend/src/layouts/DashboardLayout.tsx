import { Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCheck, Bell } from "lucide-react"
import Sidebar from "../components/navigation/Sidebar"
import AlertsPanel from "../components/alerts/AlertsPanel"
import { api } from "../services/api"

interface Alerta {
  tipo: string
  mensaje: string
  proyectoId: string
  proyectoNombre: string
  nivel: "CRITICA" | "MEDIA"
}

interface Notificacion {
  id: string
  mensaje: string
  leida: boolean
  createdAt: string
  proyecto: { id: string; nombre: string }
}

const panelVariants = {
  initial: { opacity: 0, x: 320 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", damping: 32, stiffness: 340 } },
  exit:    { opacity: 0, x: 320, transition: { duration: 0.2 } },
}

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

export default function DashboardLayout() {
  const [alertas,        setAlertas]        = useState<Alerta[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [panelOpen,      setPanelOpen]      = useState(false)
  const [notifOpen,      setNotifOpen]      = useState(false)

  const fetchAlertas = async () => {
    try { const res = await api.get("/alertas"); setAlertas(res.data) } catch { /* silent */ }
  }

  const fetchNotificaciones = async () => {
    try { const res = await api.get("/notificaciones"); setNotificaciones(res.data) } catch { /* silent */ }
  }

  const marcarLeida = async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`)
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    } catch { /* ignore */ }
  }

  const marcarTodasLeidas = async () => {
    try {
      await api.patch("/notificaciones/leer-todas")
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchAlertas()
    fetchNotificaciones()
    const interval = setInterval(() => { fetchAlertas(); fetchNotificaciones() }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const criticalCount = alertas.filter(a => a.nivel === "CRITICA").length
  const notifCount    = notificaciones.filter(n => !n.leida).length

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--content-bg)" }}>
      <Sidebar
        criticalCount={criticalCount}
        notifCount={notifCount}
        onOpenPanel={() => setPanelOpen(true)}
        onOpenNotif={() => setNotifOpen(true)}
      />

      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 48px" }}>
          <Outlet />
        </div>
      </main>

      {/* ── Alerts Panel ── */}
      {panelOpen && <AlertsPanel alertas={alertas} onClose={() => setPanelOpen(false)} />}

      {/* ── Notifications Panel ── */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              className="modal-backdrop"
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setNotifOpen(false)}
            />

            <motion.div
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: 360,
                background: "white",
                borderLeft: "1px solid var(--card-border)",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 20px 16px",
                borderBottom: "1px solid var(--card-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--info-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Bell size={18} color="var(--info)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Notificaciones
                    </h3>
                    {notifCount > 0 && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                        {notifCount} sin leer
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {notifCount > 0 && (
                    <button
                      onClick={marcarTodasLeidas}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: 12, color: "var(--primary)", background: "none",
                        border: "none", cursor: "pointer", fontWeight: 600,
                        padding: "5px 8px", borderRadius: 6, transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--primary-light)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <CheckCheck size={14} />
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
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
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {notificaciones.length === 0 ? (
                  <div style={{ padding: "48px 20px", textAlign: "center" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "var(--content-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px",
                    }}>
                      <Bell size={20} color="var(--text-muted)" />
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>
                      Sin notificaciones
                    </p>
                  </div>
                ) : (
                  notificaciones.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => !n.leida && marcarLeida(n.id)}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--card-border)",
                        cursor: n.leida ? "default" : "pointer",
                        background: n.leida ? "white" : "rgba(59,130,246,0.04)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (!n.leida) (e.currentTarget as HTMLDivElement).style.background = "rgba(59,130,246,0.08)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.leida ? "white" : "rgba(59,130,246,0.04)" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {!n.leida && (
                          <div style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: "var(--info)", flexShrink: 0, marginTop: 5,
                          }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0, paddingLeft: n.leida ? 17 : 0 }}>
                          <p style={{
                            fontSize: 13, color: "var(--text-primary)",
                            fontWeight: n.leida ? 400 : 600, marginBottom: 3,
                          }}>
                            {n.mensaje}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, marginBottom: 2 }}>
                            {n.proyecto?.nombre}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                            {new Date(n.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
