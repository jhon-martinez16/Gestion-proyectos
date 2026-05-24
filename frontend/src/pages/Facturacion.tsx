import React, { useEffect, useState } from "react"
import { api } from "../services/api"
import CrearFacturaModal from "../components/facturas/CrearFacturaModal"
import PageHeader from "../components/ui/PageHeader"

type EstadoFactura = "PENDIENTE" | "APROBADA" | "PAGADA" | "RECHAZADA"

interface Factura {
  id: string
  numero: string
  concepto: string
  monto: number
  estado: EstadoFactura
  fechaEmision: string
  fechaPago?: string
  observaciones?: string
  fechaProgramadaPago?: string
  pagoEjecutado: boolean
  confirmacionFinanciera: boolean
  proyecto: { id: string; nombre: string }
  proveedor?: { id: string; nombre: string } | null
}

const ESTADO_STYLES: Record<EstadoFactura, React.CSSProperties> = {
  PENDIENTE:  { background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)" },
  APROBADA:   { background: "transparent", color: "var(--state-blue)",  border: "1px solid var(--state-blue)" },
  PAGADA:     { background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)" },
  RECHAZADA:  { background: "transparent", color: "var(--state-red)",   border: "1px solid var(--state-red)" },
}

const ESTADO_LABELS: Record<EstadoFactura, string> = {
  PENDIENTE:  "Pendiente",
  APROBADA:   "Aprobada",
  PAGADA:     "Pagada",
  RECHAZADA:  "Rechazada",
}

export default function Facturacion() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editandoFactura, setEditandoFactura] = useState<Factura | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos")
  const [expandObs, setExpandObs] = useState<string | null>(null)
  const [programandoPagoId, setProgramandoPagoId] = useState<string | null>(null)
  const [fechaProgramada, setFechaProgramada] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/facturas")
      setFacturas(res.data)
    } catch {
      setError("Error al cargar facturas. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAprobar = async (id: string) => {
    try {
      await api.patch(`/facturas/${id}/aprobar`)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al aprobar la factura.")
    }
  }

  const handleMarcarPagada = async (id: string) => {
    try {
      await api.patch(`/facturas/${id}/marcar-pagada`)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al marcar como pagada.")
    }
  }

  const handleRechazar = async (id: string) => {
    if (!window.confirm("¿Rechazar esta factura?")) return
    try {
      await api.patch(`/facturas/${id}/rechazar`)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al rechazar la factura.")
    }
  }

  const handleEliminar = async (id: string, numero: string) => {
    if (!window.confirm(`¿Eliminar la factura ${numero}? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/facturas/${id}`)
      loadData()
    } catch {
      setError("Error eliminando factura.")
    }
  }

  const handleProgramarPago = async (id: string) => {
    if (!fechaProgramada) return
    try {
      await api.patch(`/facturas/${id}/programar-pago`, { fechaProgramadaPago: new Date(fechaProgramada).toISOString() })
      setProgramandoPagoId(null)
      setFechaProgramada("")
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al programar pago.")
    }
  }

  const handleEjecutarPago = async (id: string) => {
    try {
      await api.patch(`/facturas/${id}/ejecutar-pago`, {})
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al ejecutar pago.")
    }
  }

  const handleConfirmarPago = async (id: string) => {
    try {
      await api.patch(`/facturas/${id}/confirmar-pago`, { confirmacionFinanciera: true })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al confirmar pago.")
    }
  }

  const proyectosUnicos = Array.from(
    new Map(facturas.map((f) => [f.proyecto.id, f.proyecto.nombre])).entries()
  )

  const facturasFiltradas = facturas.filter((f) => {
    const estadoOk = filtroEstado === "todos" || f.estado === filtroEstado
    const proyectoOk = filtroProyecto === "todos" || f.proyecto.id === filtroProyecto
    return estadoOk && proyectoOk
  })

  const totalMonto = facturasFiltradas.reduce((sum, f) => sum + Number(f.monto), 0)

  // Totals by status
  const totalesPorEstado = (["PENDIENTE", "APROBADA", "PAGADA", "RECHAZADA"] as EstadoFactura[]).map((e) => ({
    estado: e,
    monto: facturasFiltradas.filter((f) => f.estado === e).reduce((s, f) => s + Number(f.monto), 0),
    count: facturasFiltradas.filter((f) => f.estado === e).length,
  }))

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-ink-3">Cargando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p style={{ color: "var(--danger)" }} className="font-medium">{error}</p>
        <button onClick={loadData} className="btn-primary">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <PageHeader
        eyebrow="Finanzas"
        title="Facturación"
        subtitle="Gestión de facturas por proyecto"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Nueva Factura
          </button>
        }
      />

      {/* TOTALIZADOR POR ESTADO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {totalesPorEstado.map(({ estado, monto, count }) => (
          <div key={estado} className="card" style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-muted)", marginBottom: 8 }}>
              {ESTADO_LABELS[estado]}
            </p>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1 }}>
              {count}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              ${monto.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* FILTROS + TOTAL */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="form-input"
            style={{ width: "auto", minWidth: 150 }}
          >
            <option value="todos">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="PAGADA">Pagada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>

          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="form-input"
            style={{ width: "auto", minWidth: 180 }}
          >
            <option value="todos">Todos los proyectos</option>
            {proyectosUnicos.map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="card" style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total filtrado:</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 15, color: "var(--text-primary)" }}>
            ${totalMonto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* TABLA */}
      {facturasFiltradas.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 0", fontSize: 14 }}>
          No hay facturas que mostrar.
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["N°", "Proyecto", "Concepto / Obs.", "Proveedor", "Monto", "Estado", "Emisión", "Acciones"].map((h, i) => (
                  <th key={h} className="px-5 py-3" style={{
                    textAlign: i >= 7 ? "right" : i === 4 ? "right" : i === 5 ? "center" : "left",
                    fontFamily: "var(--font-ui)",
                    fontSize: 10, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    background: "var(--canvas)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: "var(--bg-card)" }}>
              {facturasFiltradas.map((f) => (
                <React.Fragment key={f.id}>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 120ms ease" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--canvas)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  >
                    <td className="px-5 py-4" style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>{f.numero}</td>
                    <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{f.proyecto.nombre}</td>
                    <td className="px-5 py-4" style={{ color: "var(--text-primary)", maxWidth: 180 }}>
                      <div className="truncate">{f.concepto}</div>
                      {f.observaciones && (
                        <button
                          onClick={() => setExpandObs(expandObs === f.id ? null : f.id)}
                          style={{ fontSize: 11, color: "var(--accent-gold)", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}
                        >
                          {expandObs === f.id ? "Ocultar obs." : "Ver obs."}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--text-muted)", fontSize: 13 }}>{f.proveedor?.nombre ?? "—"}</td>
                    <td className="px-5 py-4" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>
                      ${Number(f.monto).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4" style={{ textAlign: "center" }}>
                      <div className="flex flex-col items-center gap-1">
                        <span style={{
                          ...ESTADO_STYLES[f.estado],
                          padding: "2px 8px", borderRadius: 4,
                          fontSize: 10, fontWeight: 500,
                          fontFamily: "var(--font-ui)",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}>
                          {ESTADO_LABELS[f.estado]}
                        </span>
                        {f.fechaProgramadaPago && (
                          <span style={{ fontSize: 11, color: "var(--state-violet)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>
                            Prog. {new Date(f.fechaProgramadaPago).toLocaleDateString("es-CO")}
                            {f.pagoEjecutado && " · Ejec."}
                            {f.confirmacionFinanciera && " · Conf."}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {new Date(f.fechaEmision).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {(f.estado === "PENDIENTE" || f.estado === "APROBADA") && (
                          <button onClick={() => setEditandoFactura(f)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>
                            Editar
                          </button>
                        )}
                        {f.estado === "PENDIENTE" && (
                          <button onClick={() => handleAprobar(f.id)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-blue)", borderColor: "var(--state-blue)" }}>
                            Aprobar
                          </button>
                        )}
                        {f.estado === "APROBADA" && !f.fechaProgramadaPago && (
                          <button onClick={() => { setProgramandoPagoId(f.id); setFechaProgramada("") }}
                            className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-violet)", borderColor: "var(--state-violet)" }}>
                            Programar pago
                          </button>
                        )}
                        {f.estado === "APROBADA" && f.fechaProgramadaPago && !f.pagoEjecutado && (
                          <button onClick={() => handleEjecutarPago(f.id)}
                            className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-violet)", borderColor: "var(--state-violet)" }}>
                            Ejecutar pago
                          </button>
                        )}
                        {f.pagoEjecutado && !f.confirmacionFinanciera && (
                          <button onClick={() => handleConfirmarPago(f.id)}
                            className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-green)", borderColor: "var(--state-green)" }}>
                            Confirmar
                          </button>
                        )}
                        {(f.estado === "PENDIENTE" || (f.estado === "APROBADA" && !f.pagoEjecutado)) && (
                          <button onClick={() => handleRechazar(f.id)}
                            className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-amber)", borderColor: "var(--state-amber)" }}>
                            Rechazar
                          </button>
                        )}
                        {(f.estado === "PENDIENTE" || f.estado === "RECHAZADA") && (
                          <button onClick={() => handleEliminar(f.id, f.numero)}
                            className="btn-danger" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {programandoPagoId === f.id && (
                    <tr style={{ background: "var(--canvas)" }}>
                      <td colSpan={8} className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Fecha de pago programada:</span>
                          <input
                            type="date"
                            value={fechaProgramada}
                            onChange={(e) => setFechaProgramada(e.target.value)}
                            className="form-input"
                            style={{ width: "auto" }}
                          />
                          <button disabled={!fechaProgramada} onClick={() => handleProgramarPago(f.id)} className="btn-primary" style={{ height: 32, padding: "0 14px", fontSize: 12 }}>
                            Guardar
                          </button>
                          <button onClick={() => setProgramandoPagoId(null)} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {expandObs === f.id && f.observaciones && (
                    <tr style={{ background: "var(--canvas)" }}>
                      <td colSpan={8} className="px-5 py-3" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        <span style={{ fontWeight: 600 }}>Observaciones: </span>{f.observaciones}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CrearFacturaModal
          onClose={() => {
            setShowModal(false)
            loadData()
          }}
        />
      )}

      {editandoFactura && (
        <EditarFacturaModal
          factura={editandoFactura}
          onClose={() => {
            setEditandoFactura(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}

/* Inline edit modal */
function EditarFacturaModal({ factura, onClose }: { factura: Factura; onClose: () => void }) {
  const [concepto, setConcepto] = useState(factura.concepto)
  const [monto, setMonto] = useState(String(factura.monto))
  const [observaciones, setObservaciones] = useState(factura.observaciones ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!concepto.trim()) { setError("El concepto es obligatorio."); return }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) { setError("Ingresa un monto válido."); return }
    setLoading(true)
    try {
      await api.patch(`/facturas/${factura.id}`, {
        concepto,
        monto: Number(monto),
        observaciones: observaciones.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div style={{ background: "var(--bg-card)", padding: "32px", borderRadius: 16, width: "100%", maxWidth: 448, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>Editar Factura {factura.numero}</h2>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Concepto *</label>
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} className="form-input w-full" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Monto *</label>
          <input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} className="form-input w-full" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Observaciones</label>
          <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="form-input w-full resize-none" style={{ height: "auto" }} />
        </div>
        {error && <p style={{ fontSize: 13, color: "var(--state-red)" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} className="btn-secondary" style={{ height: 38, padding: "0 20px", fontSize: 14 }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ height: 38, padding: "0 20px", fontSize: 14, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}
