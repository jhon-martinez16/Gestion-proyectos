import { useEffect, useState } from "react"
import { api } from "../../services/api"
import Modal from "../ui/Modal"
import FileUploadButton from "../ui/FileUploadButton"

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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14,  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  display: "block", marginBottom: 6,
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
  const [archivoPath, setArchivoPath] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get("/proyectos").then((res) => setProyectos(res.data)).catch(() => {})
    api.get("/proveedores").then((res) => setProveedores(res.data.filter((p: any) => p.activo))).catch(() => {})
  }, [])

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--card-border)")

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
        archivoFacturaPath: archivoPath || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear la factura.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} size="md" accentColor="var(--navy, #1e3a6e)">
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            margin: 0, lineHeight: 1.3,
          }}>
            Nueva Factura
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Registra una nueva factura o pago en el sistema
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Proyecto */}
          <div>
            <label style={labelStyle}>
              Proyecto <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select
              value={proyectoId}
              onChange={(e) => setProyectoId(e.target.value)}
              style={{ ...inputStyle, appearance: "none" } as React.CSSProperties}
              onFocus={focusInput}
              onBlur={blurInput}
            >
              <option value="">Seleccionar proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Proveedor */}
          <div>
            <label style={labelStyle}>
              Proveedor
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              style={{ ...inputStyle, appearance: "none" } as React.CSSProperties}
              onFocus={focusInput}
              onBlur={blurInput}
            >
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Número + Monto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>
                Número <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="FAC-001"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Monto <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label style={labelStyle}>
              Concepto <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Descripción del servicio o producto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Fecha */}
          <div>
            <label style={labelStyle}>
              Fecha de emisión <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label style={labelStyle}>
              Observaciones
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <textarea
              rows={2}
              placeholder="Notas adicionales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.5 } as React.CSSProperties}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Adjunto */}
          <div>
            <label style={labelStyle}>
              Archivo de factura
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <FileUploadButton
              carpeta="facturas"
              onUploaded={(path) => setArchivoPath(path)}
              hint="PDF, JPG o PNG hasta 10 MB"
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid var(--card-border)",
              background: "white", color: "var(--text-secondary)",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "var(--navy, #1e3a6e)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Guardando..." : "Crear Factura"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
