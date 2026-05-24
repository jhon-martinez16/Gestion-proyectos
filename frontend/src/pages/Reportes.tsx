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

import React from "react"

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  EN_CURSO:    { background: "transparent", color: "var(--state-green)",  border: "1px solid var(--state-green)" },
  ADVERTENCIA: { background: "transparent", color: "var(--state-amber)",  border: "1px solid var(--state-amber)" },
  EN_RIESGO:   { background: "transparent", color: "var(--state-red)",    border: "1px solid var(--state-red)" },
  FINALIZADO:  { background: "transparent", color: "var(--state-zinc)",   border: "1px solid var(--state-zinc)" },
}

const FACTURA_STYLE: Record<string, React.CSSProperties> = {
  PENDIENTE: { background: "transparent", color: "var(--state-amber)",     border: "1px solid var(--state-amber)" },
  APROBADA:  { background: "transparent", color: "var(--accent-forest)",   border: "1px solid var(--accent-forest)" },
  PAGADA:    { background: "transparent", color: "var(--state-green)",     border: "1px solid var(--state-green)" },
  RECHAZADA: { background: "transparent", color: "var(--state-red)",       border: "1px solid var(--state-red)" },
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "var(--text-muted)" }}>Cargando reporte...</div>
  if (error) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "var(--state-red)" }}>{error}</div>
  if (!data) return null

  const { resumen, financiero, pagosPorProyecto, performanceLideres } = data

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent-gold)", marginBottom: 6 }}>Analítica</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 300, color: "var(--text-primary)", lineHeight: 1.05 }}>Reportes Ejecutivos</h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>Resumen general del portafolio de proyectos</p>
      </motion.div>

      {/* RESUMEN GENERAL */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Proyectos" value={resumen.totalProyectos} />
        <StatCard label="Compromisos cumplidos" value={`${resumen.pctCompromisosCumplidos}%`} valueColor="var(--state-green)" />
        <StatCard label="Entregables aprobados" value={`${resumen.pctEntregablesAprobados}%`} valueColor="var(--accent-forest)" />
        <StatCard label="Total facturado" value={formatCOP(financiero.totalFacturado)} valueColor="var(--accent-gold)" />
      </div>

      {/* PROYECTOS POR ESTADO */}
      <div className="card-surface" style={{ padding: 32 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, color: "var(--text-primary)", marginBottom: 20 }}>Proyectos por Estado</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(resumen.porEstado).map(([estado, count]) => (
            <div key={estado} style={{ ...(ESTADO_STYLE[estado] ?? { background: "transparent", color: "var(--state-zinc)", border: "1px solid var(--state-zinc)" }), padding: "16px 20px", borderRadius: 10 }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 400, lineHeight: 1, margin: "0 0 6px" }}>{count}</p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{ESTADO_LABELS[estado] ?? estado}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FINANCIERO */}
      <div className="card-surface" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, color: "var(--text-primary)" }}>Resumen Financiero</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FinCard label="Total facturado" value={formatCOP(financiero.totalFacturado)} sub="Todas las facturas" />
          <FinCard label="Pendiente por pagar" value={formatCOP(financiero.totalPendienteFactura)} sub="Facturas pendientes" />
          <FinCard label="Pendiente clientes" value={formatCOP(financiero.pendienteCliente)} sub={`${formatCOP(financiero.totalRecibidoCliente)} recibido de ${formatCOP(financiero.totalEsperadoCliente)}`} />
        </div>

        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Facturas por estado</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(financiero.facturasPorEstado).map(([estado, { count, monto }]) => (
              <div key={estado} style={{ ...(FACTURA_STYLE[estado] ?? { background: "transparent", color: "var(--state-zinc)", border: "1px solid var(--state-zinc)" }), padding: "14px 16px", borderRadius: 10 }}>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{estado}</p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, lineHeight: 1, margin: "0 0 4px" }}>{count}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{formatCOP(monto)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAGOS POR PROYECTO */}
      {pagosPorProyecto.length > 0 && (
        <div className="card-surface" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, color: "var(--text-primary)", marginBottom: 20 }}>Cobros por Proyecto</h2>
          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--canvas)" }}>
                <tr>
                  {["Proyecto","Cuotas","Esperado","Recibido","Pendiente","%"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: i >= 2 ? "right" : i === 1 ? "center" : "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagosPorProyecto.map((p) => {
                  const pendiente = p.montoEsperado - p.montoRecibido
                  const porcentaje = pct(p.montoRecibido, p.montoEsperado)
                  return (
                    <tr key={p.proyectoId} style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)", transition: "background 150ms" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--canvas)")} onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}>
                      <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{p.proyectoNombre}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.cuotasRecibidas}/{p.cuotasEsperadas}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatCOP(p.montoEsperado)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "var(--state-green)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{formatCOP(p.montoRecibido)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: pendiente > 0 ? "var(--state-red)" : "var(--state-green)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatCOP(pendiente)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "var(--border-subtle)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: 4, background: "var(--accent-gold)", borderRadius: 99, width: `${porcentaje}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: 32, textAlign: "right" }}>{porcentaje}%</span>
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
        <div className="card-surface" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, color: "var(--text-primary)", marginBottom: 20 }}>Performance por Líder / Socio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceLideres.map((l) => {
              const pctCompromisos = pct(l.compromisosCumplidos, l.compromisosTotal)
              const pctEntregables = pct(l.entregablesAprobados, l.entregablesTotal)
              return (
                <div key={l.liderId} style={{ padding: 20, border: "1px solid var(--border-subtle)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{l.liderNombre}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Compromisos cumplidos</span>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{l.compromisosCumplidos}/{l.compromisosTotal}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--border-subtle)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: 4, background: "var(--state-green)", borderRadius: 99, width: `${pctCompromisos}%`, transition: "width 600ms" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Entregables aprobados</span>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{l.entregablesAprobados}/{l.entregablesTotal}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--border-subtle)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: 4, background: "var(--accent-gold)", borderRadius: 99, width: `${pctEntregables}%`, transition: "width 600ms" }} />
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

function StatCard({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="card-surface" style={{ padding: 24 }}>
      <p style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-muted)", marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 44, fontWeight: 400, color: valueColor ?? "var(--text-primary)", lineHeight: 1 }}>{value}</p>
    </div>
  )
}

function FinCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ padding: 20, background: "var(--canvas)", borderRadius: 10, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 4 }}>
      <p style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-muted)" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</p>
    </div>
  )
}
