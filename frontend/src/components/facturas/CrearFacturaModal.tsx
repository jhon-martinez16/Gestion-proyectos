import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"

interface Proyecto {
  id: string
  nombre: string
}

interface Proveedor {
  id: string
  nombre: string
}

interface Props {
  onClose: () => void
}

export default function CrearFacturaModal({ onClose }: Props) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proyectoId, setProyectoId] = useState("")
  const [proveedorId, setProveedorId] = useState("")
  const [numero, setNumero] = useState("")
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [fechaEmision, setFechaEmision] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get("/proyectos").then((res) => setProyectos(res.data)).catch(() => {})
    api.get("/proveedores").then((res) => setProveedores(res.data.filter((p: any) => p.activo))).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setError(null)
    if (!proyectoId) { setError("Selecciona un proyecto."); return }
    if (!numero.trim()) { setError("El número de factura es obligatorio."); return }
    if (!concepto.trim()) { setError("El concepto es obligatorio."); return }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError("Ingresa un monto válido mayor a 0."); return
    }
    if (!fechaEmision) { setError("La fecha de emisión es obligatoria."); return }

    setLoading(true)
    try {
      await api.post("/facturas", {
        proyectoId,
        numero,
        concepto,
        monto: Number(monto),
        fechaEmision,
        observaciones: observaciones.trim() || undefined,
        proveedorId: proveedorId || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear la factura.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-full h-1.5 bg-gradient-to-r from-[#0B355A] to-[#F58220] rounded-full -mt-2 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Nueva Factura</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Proyecto *</label>
            <select
              value={proyectoId}
              onChange={(e) => setProyectoId(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A] bg-white"
            >
              <option value="">Seleccionar proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Proveedor <span className="text-gray-400">(opcional)</span></label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A] bg-white"
            >
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Número *</label>
              <input
                type="text"
                placeholder="FAC-001"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Monto *</label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Concepto *</label>
            <input
              type="text"
              placeholder="Descripción del servicio o producto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Fecha de emisión *</label>
            <input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Observaciones <span className="text-gray-400">(opcional)</span></label>
            <textarea
              rows={2}
              placeholder="Notas adicionales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B355A] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0B355A] hover:bg-[#0a2e4e] text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Crear Factura"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
