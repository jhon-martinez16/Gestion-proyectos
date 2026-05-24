import React, { useEffect, useState } from "react"
import { api } from "../services/api"
import Modal from "../components/ui/Modal"

interface Proveedor {
  id: string
  nombre: string
  nit: string
  email?: string
  telefono?: string
  activo: boolean
  categoriaProveedor?: string
  _count?: { facturas: number }
}

const pvInputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14,  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}
const pvLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  display: "block", marginBottom: 6,
}

function ProveedorModal({
  proveedor,
  onClose,
}: {
  proveedor?: Proveedor
  onClose: () => void
}) {
  const editando = !!proveedor
  const [nombre, setNombre] = useState(proveedor?.nombre ?? "")
  const [nit, setNit] = useState(proveedor?.nit ?? "")
  const [email, setEmail] = useState(proveedor?.email ?? "")
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "")
  const [categoria, setCategoria] = useState(proveedor?.categoriaProveedor ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "var(--card-border)")

  const handleSubmit = async () => {
    setError(null)
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return }
    if (!nit.trim()) { setError("El NIT es obligatorio."); return }
    setLoading(true)
    try {
      const payload = {
        nombre,
        nit,
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        categoriaProveedor: categoria.trim() || undefined,
      }
      if (editando) {
        await api.patch(`/proveedores/${proveedor!.id}`, payload)
      } else {
        await api.post("/proveedores", payload)
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el proveedor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} size="sm" accentColor={editando ? "var(--accent)" : "var(--navy, #1e3a6e)"}>
      <div style={{ padding: "28px 28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
            margin: 0, lineHeight: 1.3,
          }}>
            {editando ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {editando ? "Actualiza los datos del proveedor" : "Registra un nuevo proveedor en el sistema"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Nombre */}
          <div>
            <label style={pvLabelStyle}>
              Nombre <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Razón social o nombre comercial"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={pvInputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* NIT */}
          <div>
            <label style={pvLabelStyle}>
              NIT <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="000.000.000-0"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              style={pvInputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Email + Teléfono en grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={pvLabelStyle}>
                Email
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
              </label>
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={pvInputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label style={pvLabelStyle}>
                Teléfono
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
              </label>
              <input
                type="text"
                placeholder="+57 300 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                style={pvInputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label style={pvLabelStyle}>
              Categoría
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Consultoría, Software, Logística..."
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={pvInputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid var(--card-border)", background: "white",
              color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
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
              background: editando ? "var(--accent)" : "var(--navy, #1e3a6e)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
            }}
          >
            {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Proveedor"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/proveedores")
      setProveedores(res.data)
    } catch {
      setError("Error al cargar proveedores. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDesactivar = async (p: Proveedor) => {
    if (!window.confirm(`¿Desactivar a ${p.nombre}?`)) return
    try {
      await api.patch(`/proveedores/${p.id}/desactivar`)
      loadData()
    } catch {
      setError("Error desactivando proveedor.")
    }
  }

  const handleActivar = async (p: Proveedor) => {
    if (!window.confirm(`¿Activar a ${p.nombre}?`)) return
    try {
      await api.patch(`/proveedores/${p.id}/activar`)
      loadData()
    } catch {
      setError("Error activando proveedor.")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditando(null)
    loadData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={loadData} className="btn-primary" style={{ height: 36, padding: "0 20px", fontSize: 14 }}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent-gold)", marginBottom: 4 }}>Administración</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 300, color: "var(--text-primary)", lineHeight: 1.05 }}>Proveedores</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ height: 38, padding: "0 16px", fontSize: 13 }}>
          + Nuevo Proveedor
        </button>
      </div>

      {/* LISTADO */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {proveedores.map((p) => (
          <div key={p.id} className="card-surface" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{p.nombre}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>NIT: {p.nit}</p>
              {p.email && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.email}</p>}
              {p.telefono && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.telefono}</p>}
              {p.categoriaProveedor && <p style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{p.categoriaProveedor}</p>}
              {p._count !== undefined && (
                <p style={{ marginTop: 4 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--accent-forest)", border: "1px solid var(--accent-forest)", fontFamily: "var(--font-ui)" }}>
                    {p._count.facturas} factura{p._count.facturas !== 1 ? "s" : ""}
                  </span>
                </p>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ padding: "2px 10px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: p.activo ? "var(--state-green)" : "var(--state-zinc)", border: `1px solid ${p.activo ? "var(--state-green)" : "var(--state-zinc)"}`, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
              <button onClick={() => setEditando(p)} className="btn-secondary" style={{ height: 30, padding: "0 12px", fontSize: 12 }}>Editar</button>
              {p.activo ? (
                <button onClick={() => handleDesactivar(p)} className="btn-secondary" style={{ height: 30, padding: "0 12px", fontSize: 12, color: "var(--state-red)", borderColor: "var(--state-red)" }}>Desactivar</button>
              ) : (
                <button onClick={() => handleActivar(p)} className="btn-secondary" style={{ height: 30, padding: "0 12px", fontSize: 12, color: "var(--state-green)", borderColor: "var(--state-green)" }}>Activar</button>
              )}
            </div>
          </div>
        ))}
        {proveedores.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "32px 0" }}>No hay proveedores registrados.</p>
        )}
      </div>

      {(showModal || editando) && (
        <ProveedorModal
          proveedor={editando ?? undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
