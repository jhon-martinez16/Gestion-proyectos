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
        <button onClick={loadData} className="px-5 py-2 bg-[#0B355A] text-white rounded-xl font-medium hover:bg-[#0a2e4e] transition">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#DDF7E6] px-6 py-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">Proveedores</h1>
          <p className="text-sm text-green-900/70 mt-1">Gestión de proveedores del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0B355A] hover:bg-[#0a2e4e] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          + Nuevo Proveedor
        </button>
      </div>

      {/* LISTADO */}
      <div className="grid gap-4">
        {proveedores.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-green-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-800">{p.nombre}</p>
              <p className="text-sm text-gray-500">NIT: {p.nit}</p>
              {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
              {p.telefono && <p className="text-xs text-gray-400">{p.telefono}</p>}
              {p.categoriaProveedor && <p className="text-xs text-gray-500 font-medium">{p.categoriaProveedor}</p>}
              {p._count !== undefined && (
                <p className="text-xs mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    {p._count.facturas} factura{p._count.facturas !== 1 ? "s" : ""}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
              <button
                onClick={() => setEditando(p)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              >
                Editar
              </button>
              {p.activo ? (
                <button
                  onClick={() => handleDesactivar(p)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  Desactivar
                </button>
              ) : (
                <button
                  onClick={() => handleActivar(p)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition"
                >
                  Activar
                </button>
              )}
            </div>
          </div>
        ))}
        {proveedores.length === 0 && (
          <p className="text-center text-gray-400 py-8">No hay proveedores registrados.</p>
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
