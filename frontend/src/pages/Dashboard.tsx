import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../services/api"
import { getRolFromToken } from "../utils/auth"

interface DashboardData {
  proyectos: {
    total: number
    enRiesgo: number
    advertencia: number
  }
  compromisos: {
    vencidos: number
  }
  entregables: {
    urgentes: number
    proximos7Dias: number
  }
  organizacion: {
    usuariosActivos: number
    categoriasActivas: number
  }
  financiero: {
    totalFacturado: number
    facturasPendientes: number
    montoPorCobrar: number
    proveedoresActivos: number
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const rol = getRolFromToken()
  const esAdmin = rol === "ADMIN"
  const esSocio = rol === "SOCIO"
  const mostrarFinanciero = rol === "ADMIN" || rol === "ADMINISTRATIVO"
  const [data, setData] = useState<DashboardData | null>(null)
  const [alertasCriticas, setAlertasCriticas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, alertasRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/alertas").catch(() => ({ data: [] })),
      ])
      setData(dashRes.data)
      setAlertasCriticas(alertasRes.data.filter((a: any) => a.nivel === "CRITICA").length)
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error ?? "Error inesperado."}</p>
        <button onClick={loadData} className="px-5 py-2 bg-[#16A34A] text-white rounded-xl font-medium hover:bg-[#15803D] transition">
          Reintentar
        </button>
      </div>
    )
  }

  // ADMINISTRATIVO: solo vista financiera
  if (rol === "ADMINISTRATIVO") {
    return (
      <div className="space-y-10 bg-[#F3FBF6] p-6 rounded-3xl">
        <div className="bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold text-[#14532D]">Dashboard Financiero</h1>
          <p className="text-green-900/70 mt-2">Resumen financiero del sistema.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Financiero</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card title="Total Facturado (Pagado)" value={data.financiero.totalFacturado} highlight="success" currency onClick={() => navigate("/facturacion")} />
            <Card title="Facturas Pendientes" value={data.financiero.facturasPendientes} highlight="warning" onClick={() => navigate("/facturacion")} />
            <Card title="Monto por Cobrar" value={data.financiero.montoPorCobrar} highlight="info" currency onClick={() => navigate("/facturacion")} />
            <Card title="Proveedores Activos" value={data.financiero.proveedoresActivos} highlight="success" onClick={() => navigate("/proveedores")} />
          </div>
        </section>
      </div>
    )
  }

  // SOCIO: solo sus proyectos
  if (esSocio) {
    return (
      <div className="space-y-10 bg-[#F3FBF6] p-6 rounded-3xl">
        <div className="bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold text-[#14532D]">Mis Proyectos</h1>
          <p className="text-green-900/70 mt-2">Estado de los proyectos en los que participa.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Proyectos</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card title="Mis Proyectos" value={data.proyectos.total} onClick={() => navigate("/projects")} />
            <Card title="En Advertencia" value={data.proyectos.advertencia} highlight="warning" onClick={() => navigate("/projects")} />
            <Card title="En Riesgo" value={data.proyectos.enRiesgo} highlight="danger" onClick={() => navigate("/projects")} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Compromisos y Entregables</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card title="Compromisos Vencidos" value={data.compromisos.vencidos} highlight="danger" onClick={() => navigate("/projects")} />
            <Card title="Entregables Urgentes" value={data.entregables.urgentes} highlight="warning" onClick={() => navigate("/projects")} />
            <Card title="Entregables próximos 7 días" value={data.entregables.proximos7Dias} highlight="info" onClick={() => navigate("/projects")} />
          </div>
        </section>
      </div>
    )
  }

  // ADMIN: vista completa
  return (
    <div className="space-y-10 bg-[#F3FBF6] p-6 rounded-3xl">

      <div className="bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">Dashboard General</h1>
          <p className="text-green-900/70 mt-2">Vista consolidada del estado de proyectos y compromisos.</p>
        </div>
        {alertasCriticas > 0 && (
          <div className="bg-red-50 border border-red-200 px-5 py-3 rounded-2xl">
            <p className="text-sm font-semibold text-red-700">{alertasCriticas} alerta{alertasCriticas !== 1 ? "s" : ""} crítica{alertasCriticas !== 1 ? "s" : ""}</p>
            <p className="text-xs text-red-500">Revisa el panel de alertas</p>
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Proyectos</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Total Proyectos" value={data.proyectos.total} onClick={() => navigate("/projects")} />
          <Card title="En Advertencia" value={data.proyectos.advertencia} highlight="warning" onClick={() => navigate("/projects")} />
          <Card title="En Riesgo" value={data.proyectos.enRiesgo} highlight="danger" onClick={() => navigate("/projects")} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Compromisos y Entregables</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Compromisos Vencidos" value={data.compromisos.vencidos} highlight="danger" onClick={() => navigate("/projects")} />
          <Card title="Entregables Urgentes" value={data.entregables.urgentes} highlight="warning" onClick={() => navigate("/projects")} />
          <Card title="Entregables próximos 7 días" value={data.entregables.proximos7Dias} highlight="info" onClick={() => navigate("/projects")} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Organización</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Usuarios Activos" value={data.organizacion.usuariosActivos} highlight="success" onClick={() => navigate("/users")} />
          <Card title="Categorías Activas" value={data.organizacion.categoriasActivas} highlight="success" onClick={() => navigate("/categories")} />
        </div>
      </section>

      {mostrarFinanciero && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 px-1">Financiero</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card title="Total Facturado (Pagado)" value={data.financiero.totalFacturado} highlight="success" currency onClick={() => navigate("/facturacion")} />
            <Card title="Facturas Pendientes" value={data.financiero.facturasPendientes} highlight="warning" onClick={() => navigate("/facturacion")} />
            <Card title="Monto por Cobrar (Aprobado)" value={data.financiero.montoPorCobrar} highlight="info" currency onClick={() => navigate("/facturacion")} />
            <Card title="Proveedores Activos" value={data.financiero.proveedoresActivos} highlight="success" onClick={() => navigate("/proveedores")} />
          </div>
        </section>
      )}

    </div>
  )
}

function Card({
  title,
  value,
  highlight,
  currency,
  onClick,
}: {
  title: string
  value: number
  highlight?: "danger" | "warning" | "success" | "info"
  currency?: boolean
  onClick?: () => void
}) {
  const styles: Record<string, string> = {
    danger:  "border-red-200 bg-red-50 text-red-600",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-600",
    success: "border-green-200 bg-green-50 text-green-600",
    info:    "border-blue-200 bg-blue-50 text-blue-600",
  }

  const style = highlight ? styles[highlight] : "border-green-100"

  return (
    <div
      onClick={onClick}
      className={`p-8 rounded-2xl border shadow-sm transition hover:shadow-md bg-white ${style} ${onClick ? "cursor-pointer hover:-translate-y-1 active:translate-y-0" : ""}`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-4xl font-bold mt-2 ${highlight ? "" : "text-[#14532D]"}`}>
        {currency ? `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}` : value}
      </p>
      {onClick && <p className="text-xs mt-3 opacity-60">Ver detalle →</p>}
    </div>
  )
}
