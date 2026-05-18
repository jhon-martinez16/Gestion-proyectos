import { useEffect, useState } from "react"
import { api } from "../services/api"
import { motion } from "framer-motion"

interface ReporteData {
  resumen: {
    porEstado: Record<string, number>
    pctCompromisosCumplidos: number
    pctEntregablesAprobados: number
    totalProyectos: number
  }
  financiero: {
    totalFacturado: number
    totalPendienteFactura: number
    totalEsperadoCliente: number
    totalRecibidoCliente: number
    pendienteCliente: number
    facturasPorEstado: Record<string, { count: number; monto: number }>
  }
  pagosPorProyecto: {
    proyectoId: string
    proyectoNombre: string
    cuotasEsperadas: number
    cuotasRecibidas: number
    montoEsperado: number
    montoRecibido: number
  }[]
  performanceLideres: {
    liderId: string
    liderNombre: string
    compromisosCumplidos: number
    compromisosTotal: number
    entregablesAprobados: number
    entregablesTotal: number
  }[]
}

const ESTADO_LABELS: Record<string, string> = {
  EN_CURSO:    "En curso",
  ADVERTENCIA: "Advertencia",
  EN_RIESGO:   "En riesgo",
  FINALIZADO:  "Finalizado",
}

const ESTADO_COLORS: Record<string, string> = {
  EN_CURSO:    "bg-green-100 text-green-700",
  ADVERTENCIA: "bg-yellow-100 text-yellow-700",
  EN_RIESGO:   "bg-red-100 text-red-700",
  FINALIZADO:  "bg-gray-100 text-gray-600",
}

const FACTURA_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA:  "bg-blue-100 text-blue-700",
  PAGADA:    "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

function formatCOP(n: number) {
  return `$${Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 })}`
}

export default function Reportes() {
  const [data, setData] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get("/reportes")
        setData(res.data)
      } catch {
        setError("Error al cargar el reporte.")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando reporte...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
  if (!data) return null

  const { resumen, financiero, pagosPorProyecto, performanceLideres } = data

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B355A] rounded-3xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold">Reportes Ejecutivos</h1>
        <p className="text-[#9FB3C8] mt-1">Resumen general del portafolio de proyectos</p>
      </motion.div>

      {/* RESUMEN GENERAL */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Proyectos" value={resumen.totalProyectos} color="text-[#0B355A]" />
        <StatCard label="% Compromisos cumplidos" value={`${resumen.pctCompromisosCumplidos}%`} color="text-green-600" />
        <StatCard label="% Entregables aprobados" value={`${resumen.pctEntregablesAprobados}%`} color="text-blue-600" />
        <StatCard label="Total facturado (pagado)" value={formatCOP(financiero.totalFacturado)} color="text-[#F58220]" />
      </div>

      {/* PROYECTOS POR ESTADO */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Proyectos por Estado</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(resumen.porEstado).map(([estado, count]) => (
            <div key={estado} className={`p-4 rounded-2xl ${ESTADO_COLORS[estado] ?? "bg-gray-100 text-gray-600"}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium mt-1">{ESTADO_LABELS[estado] ?? estado}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FINANCIERO */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Resumen Financiero</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FinCard label="Total facturado" value={formatCOP(financiero.totalFacturado)} sub="Facturas pagadas" />
          <FinCard label="Pendiente por pagar" value={formatCOP(financiero.totalPendienteFactura)} sub="Facturas pendientes" />
          <FinCard label="Pendiente clientes" value={formatCOP(financiero.pendienteCliente)} sub={`${formatCOP(financiero.totalRecibidoCliente)} recibido de ${formatCOP(financiero.totalEsperadoCliente)}`} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Facturas por estado</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(financiero.facturasPorEstado).map(([estado, { count, monto }]) => (
              <div key={estado} className={`p-4 rounded-2xl ${FACTURA_COLORS[estado] ?? "bg-gray-100 text-gray-600"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{estado}</p>
                <p className="text-xl font-bold mt-1">{count}</p>
                <p className="text-sm font-medium">{formatCOP(monto)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAGOS POR PROYECTO */}
      {pagosPorProyecto.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Cobros por Proyecto</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Proyecto</th>
                  <th className="px-4 py-3 text-center">Cuotas</th>
                  <th className="px-4 py-3 text-right">Esperado</th>
                  <th className="px-4 py-3 text-right">Recibido</th>
                  <th className="px-4 py-3 text-right">Pendiente</th>
                  <th className="px-4 py-3 text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagosPorProyecto.map((p) => {
                  const pendiente = p.montoEsperado - p.montoRecibido
                  const porcentaje = pct(p.montoRecibido, p.montoEsperado)
                  return (
                    <tr key={p.proyectoId} className="bg-white hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.proyectoNombre}</td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {p.cuotasRecibidas}/{p.cuotasEsperadas}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCOP(p.montoEsperado)}</td>
                      <td className="px-4 py-3 text-right text-green-700 font-semibold">{formatCOP(p.montoRecibido)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCOP(pendiente)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: `${porcentaje}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{porcentaje}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PERFORMANCE LÍDERES */}
      {performanceLideres.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Performance por Líder / Socio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceLideres.map((l) => {
              const pctCompromisos = pct(l.compromisosCumplidos, l.compromisosTotal)
              const pctEntregables = pct(l.entregablesAprobados, l.entregablesTotal)
              return (
                <div key={l.liderId} className="p-6 border border-gray-100 rounded-2xl space-y-4">
                  <p className="font-bold text-gray-800">{l.liderNombre}</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Compromisos cumplidos</span>
                        <span>{l.compromisosCumplidos}/{l.compromisosTotal}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${pctCompromisos}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Entregables aprobados</span>
                        <span>{l.entregablesAprobados}/{l.entregablesTotal}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${pctEntregables}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-2">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function FinCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 space-y-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
