import { Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
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

export default function DashboardLayout() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const fetchAlertas = async () => {
    try {
      const res = await api.get("/alertas")
      setAlertas(res.data)
    } catch { /* silently ignore */ }
  }

  const fetchNotificaciones = async () => {
    try {
      const res = await api.get("/notificaciones")
      setNotificaciones(res.data)
    } catch { /* silently ignore — non-ADMINISTRATIVO roles get 403 */ }
  }

  const marcarLeida = async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`)
      setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
    } catch { /* ignore */ }
  }

  const marcarTodasLeidas = async () => {
    try {
      await api.patch("/notificaciones/leer-todas")
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchAlertas()
    fetchNotificaciones()
    const interval = setInterval(() => {
      fetchAlertas()
      fetchNotificaciones()
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const criticalCount = alertas.filter((a) => a.nivel === "CRITICA").length
  const notifCount = notificaciones.filter((n) => !n.leida).length

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        criticalCount={criticalCount}
        notifCount={notifCount}
        onOpenPanel={() => setPanelOpen(true)}
        onOpenNotif={() => setNotifOpen(true)}
      />

      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {panelOpen && (
        <AlertsPanel alertas={alertas} onClose={() => setPanelOpen(false)} />
      )}

      {notifOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center sm:justify-end z-50 p-4 sm:pr-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {notifCount > 0 && (
                  <button onClick={marcarTodasLeidas} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Marcar todas
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {notificaciones.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Sin notificaciones</p>
              ) : (
                notificaciones.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.leida && marcarLeida(n.id)}
                    className={`px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${n.leida ? "opacity-60" : "bg-blue-50/40"}`}
                  >
                    <p className="text-sm text-gray-800 font-medium">{n.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.proyecto?.nombre}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(n.createdAt).toLocaleString("es-CO")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
