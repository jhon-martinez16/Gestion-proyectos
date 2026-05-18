import React, { useEffect, useState } from "react"
import { api } from "../services/api"
import CrearFacturaModal from "../components/facturas/CrearFacturaModal"

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

const ESTADO_STYLES: Record<EstadoFactura, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-700",
  APROBADA:   "bg-blue-100 text-blue-700",
  PAGADA:     "bg-green-100 text-green-700",
  RECHAZADA:  "bg-red-100 text-red-700",
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
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={loadData} className="px-5 py-2 bg-[#0B355A] text-white rounded-xl font-medium hover:bg-[#0a2e4e] transition">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">Facturación</h1>
          <p className="text-sm text-green-900/70 mt-1">Gestión de facturas por proyecto</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0B355A] hover:bg-[#0a2e4e] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          + Nueva Factura
        </button>
      </div>

      {/* TOTALIZADOR POR ESTADO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {totalesPorEstado.map(({ estado, monto, count }) => (
          <div key={estado} className={`p-4 rounded-2xl border shadow-sm ${ESTADO_STYLES[estado]} bg-white`}>
            <p className="text-xs font-semibold uppercase tracking-wide">{ESTADO_LABELS[estado]}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
            <p className="text-xs mt-0.5 opacity-80">${monto.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</p>
          </div>
        ))}
      </div>

      {/* FILTROS + TOTAL */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B355A]"
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
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B355A]"
          >
            <option value="todos">Todos los proyectos</option>
            {proyectosUnicos.map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-green-100 px-5 py-2.5 rounded-2xl shadow-sm">
          <span className="text-sm text-gray-500">Total filtrado: </span>
          <span className="font-bold text-[#0B355A] text-lg">
            ${totalMonto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* TABLA */}
      {facturasFiltradas.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No hay facturas que mostrar.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-green-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#DDF7E6] text-[#14532D] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">N°</th>
                <th className="px-5 py-3 text-left">Proyecto</th>
                <th className="px-5 py-3 text-left">Concepto / Obs.</th>
                <th className="px-5 py-3 text-left">Proveedor</th>
                <th className="px-5 py-3 text-right">Monto</th>
                <th className="px-5 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-left">Emisión</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {facturasFiltradas.map((f) => (
                <React.Fragment key={f.id}>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-mono font-semibold text-gray-700">{f.numero}</td>
                    <td className="px-5 py-4 text-gray-600">{f.proyecto.nombre}</td>
                    <td className="px-5 py-4 text-gray-700 max-w-[180px]">
                      <div className="truncate">{f.concepto}</div>
                      {f.observaciones && (
                        <button
                          onClick={() => setExpandObs(expandObs === f.id ? null : f.id)}
                          className="text-xs text-blue-500 hover:underline mt-0.5"
                        >
                          {expandObs === f.id ? "Ocultar obs." : "Ver obs."}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{f.proveedor?.nombre ?? "—"}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-800">
                      ${Number(f.monto).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_STYLES[f.estado]}`}>
                        {ESTADO_LABELS[f.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(f.fechaEmision).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {/* Editar siempre que no esté pagada/rechazada */}
                        {(f.estado === "PENDIENTE" || f.estado === "APROBADA") && (
                          <button onClick={() => setEditandoFactura(f)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 transition">
                            Editar
                          </button>
                        )}

                        {/* PASO 1: Aprobar */}
                        {f.estado === "PENDIENTE" && (
                          <button onClick={() => handleAprobar(f.id)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                            Aprobar
                          </button>
                        )}

                        {/* PASO 2: Programar pago (solo si APROBADA y sin fecha) */}
                        {f.estado === "APROBADA" && !f.fechaProgramadaPago && (
                          <button
                            onClick={() => { setProgramandoPagoId(f.id); setFechaProgramada("") }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                          >
                            Programar pago
                          </button>
                        )}

                        {/* PASO 3: Ejecutar pago (fecha programada y no ejecutado) */}
                        {f.estado === "APROBADA" && f.fechaProgramadaPago && !f.pagoEjecutado && (
                          <button onClick={() => handleEjecutarPago(f.id)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 transition">
                            Ejecutar pago
                          </button>
                        )}

                        {/* PASO 4: Confirmar pago */}
                        {f.pagoEjecutado && !f.confirmacionFinanciera && (
                          <button onClick={() => handleConfirmarPago(f.id)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 transition">
                            Confirmar
                          </button>
                        )}

                        {/* Rechazar */}
                        {(f.estado === "PENDIENTE" || (f.estado === "APROBADA" && !f.pagoEjecutado)) && (
                          <button onClick={() => handleRechazar(f.id)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition">
                            Rechazar
                          </button>
                        )}

                        {/* Eliminar */}
                        {(f.estado === "PENDIENTE" || f.estado === "RECHAZADA") && (
                          <button onClick={() => handleEliminar(f.id, f.numero)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition">
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Fila fecha programada */}
                  {f.fechaProgramadaPago && (
                    <tr className="bg-indigo-50/40">
                      <td colSpan={8} className="px-5 py-2 text-xs text-indigo-700">
                        Pago programado para:{" "}
                        <span className="font-semibold">{new Date(f.fechaProgramadaPago).toLocaleDateString("es-CO")}</span>
                        {f.pagoEjecutado && <span className="ml-3 text-purple-700 font-semibold">· Ejecutado</span>}
                        {f.confirmacionFinanciera && <span className="ml-3 text-green-700 font-semibold">· Confirmado</span>}
                      </td>
                    </tr>
                  )}

                  {/* Inline: programar fecha */}
                  {programandoPagoId === f.id && (
                    <tr className="bg-indigo-50">
                      <td colSpan={8} className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-indigo-700">Fecha de pago programada:</span>
                          <input
                            type="date"
                            value={fechaProgramada}
                            onChange={(e) => setFechaProgramada(e.target.value)}
                            className="border border-indigo-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <button
                            disabled={!fechaProgramada}
                            onClick={() => handleProgramarPago(f.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40"
                          >
                            Guardar
                          </button>
                          <button onClick={() => setProgramandoPagoId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Observaciones expandidas */}
                  {expandObs === f.id && f.observaciones && (
                    <tr className="bg-blue-50">
                      <td colSpan={8} className="px-5 py-3 text-sm text-blue-700">
                        <span className="font-semibold">Observaciones: </span>{f.observaciones}
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
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">Editar Factura {factura.numero}</h2>
        <div>
          <label className="text-sm font-medium text-gray-600">Concepto *</label>
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A]" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Monto *</label>
          <input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A]" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Observaciones</label>
          <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A] resize-none" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 rounded-xl bg-[#0B355A] hover:bg-[#0a2e4e] text-white font-semibold transition disabled:opacity-50">
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}
