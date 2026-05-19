import { useState } from "react"
import { api } from "../../services/api"
import Modal from "../ui/Modal"
import FileUploadButton from "../ui/FileUploadButton"

interface Props {
  proyectoId: string
  onClose: () => void
  entregable?: any
}

interface FieldErrors {
  nombre?: string
  descripcion?: string
  fechaEntrega?: string
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6,
}

export default function EntregableModal({ proyectoId, onClose, entregable }: Props) {
  const editando = !!entregable
  const [nombre, setNombre] = useState(entregable?.nombre || "")
  const [descripcion, setDescripcion] = useState(entregable?.descripcion || "")
  const [fechaEntrega, setFechaEntrega] = useState(entregable ? entregable.fechaEntrega.split("T")[0] : "")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState("")
  const [_archivoPath, setArchivoPath] = useState("")

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const focusInputErr = (key: keyof FieldErrors, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!fieldErrors[key]) e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)"
  }
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!(e.currentTarget.style.borderColor === "var(--danger)"))
      e.currentTarget.style.borderColor = "var(--card-border)"
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    if (!nombre.trim()) errors.nombre = "El nombre es obligatorio"
    if (!descripcion.trim()) errors.descripcion = "La descripción es obligatoria"
    if (!fechaEntrega) {
      errors.fechaEntrega = "La fecha de entrega es obligatoria"
    } else {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      if (new Date(fechaEntrega) < hoy) {
        errors.fechaEntrega = "La fecha de entrega no puede ser pasada"
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError("")
    if (!validate()) return

    try {
      if (entregable) {
        await api.patch(`/entregables/${entregable.id}`, { nombre, descripcion, fechaEntrega })
      } else {
        await api.post("/entregables", { nombre, descripcion, fechaEntrega, proyectoId })
      }
      onClose()
    } catch (err: any) {
      console.error(err)
      setSubmitError(err.response?.data?.message || "Error al guardar")
    }
  }

  const borderErr = "1.5px solid var(--danger)"

  return (
    <Modal onClose={onClose} accentColor={editando ? "var(--accent)" : "var(--navy, #1e3a6e)"}>
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.3,
          }}>
            {editando ? "Editar Entregable" : "Nuevo Entregable"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            {editando ? "Actualiza los datos del entregable" : "Define un entregable con su fecha límite"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Nombre */}
          <div>
            <label style={labelStyle}>
              Nombre <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Informe de diagnóstico"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setFieldErrors(p => ({ ...p, nombre: undefined })) }}
              style={{ ...inputStyle, border: fieldErrors.nombre ? borderErr : "1.5px solid var(--card-border)" }}
              onFocus={e => { if (!fieldErrors.nombre) focusInput(e) }}
              onBlur={blurInput}
            />
            {fieldErrors.nombre && (
              <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                {fieldErrors.nombre}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>
              Descripción <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detalla qué incluye este entregable..."
              value={descripcion}
              onChange={(e) => { setDescripcion(e.target.value); setFieldErrors(p => ({ ...p, descripcion: undefined })) }}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.5, border: fieldErrors.descripcion ? borderErr : "1.5px solid var(--card-border)" } as React.CSSProperties}
              onFocus={e => { if (!fieldErrors.descripcion) focusInput(e) }}
              onBlur={blurInput}
            />
            {fieldErrors.descripcion && (
              <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                {fieldErrors.descripcion}
              </p>
            )}
          </div>

          {/* Fecha de entrega */}
          <div>
            <label style={labelStyle}>
              Fecha de entrega <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => { setFechaEntrega(e.target.value); setFieldErrors(p => ({ ...p, fechaEntrega: undefined })) }}
              style={{ ...inputStyle, border: fieldErrors.fechaEntrega ? borderErr : "1.5px solid var(--card-border)" }}
              onFocus={e => { if (!fieldErrors.fechaEntrega) focusInput(e) }}
              onBlur={blurInput}
            />
            {fieldErrors.fechaEntrega && (
              <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                {fieldErrors.fechaEntrega}
              </p>
            )}
          </div>

          {/* Archivo adjunto */}
          <div>
            <label style={labelStyle}>
              Archivo adjunto
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <FileUploadButton
              carpeta="entregables"
              onUploaded={(path) => setArchivoPath(path)}
              hint="PDF, JPG o PNG hasta 10 MB"
            />
          </div>

          {submitError && (
            <p style={{ fontSize: 13, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>
              {submitError}
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
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: editando ? "var(--accent)" : "var(--navy, #1e3a6e)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "opacity 0.15s",
            }}
          >
            {editando ? "Guardar cambios" : "Crear Entregable"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
