import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"

interface ProyectoEditable {
  id: string
  nombre: string
  descripcion: string
  fechaFin: string
}

interface Props {
  onClose: () => void
  proyecto?: ProyectoEditable
}

export default function ProjectModal({ onClose, proyecto }: Props) {
  const editando = !!proyecto

  const [nombre, setNombre] = useState(proyecto?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion ?? "")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState(
    proyecto?.fechaFin ? proyecto.fechaFin.slice(0, 10) : ""
  )
  const [categoriaId, setCategoriaId] = useState("")
  const [liderId, setLiderId] = useState("")
  const [socio2Id, setSocio2Id] = useState("")

  const [categorias, setCategorias] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editando) return
    const loadData = async () => {
      const [cat, users] = await Promise.all([
        api.get("/categorias"),
        api.get("/usuarios/asignables"),
      ])
      setCategorias(cat.data)
      setUsuarios(users.data)
    }
    loadData()
  }, [editando])

  // Calcular fecha fin automáticamente al crear (+6 meses)
  useEffect(() => {
    if (editando || !fechaInicio) return
    const inicio = new Date(fechaInicio)
    inicio.setMonth(inicio.getMonth() + 6)
    const y = inicio.getFullYear()
    const m = String(inicio.getMonth() + 1).padStart(2, "0")
    const d = String(inicio.getDate()).padStart(2, "0")
    setFechaFin(`${y}-${m}-${d}`)
  }, [fechaInicio, editando])

  const handleSubmit = async () => {
    setError(null)
    if (editando) {
      if (!nombre.trim()) { setError("El nombre es obligatorio."); return }
      if (!fechaFin) { setError("La fecha de finalización es obligatoria."); return }
    } else {
      if (!nombre.trim()) { setError("El nombre es obligatorio."); return }
      if (!fechaInicio) { setError("La fecha de inicio es obligatoria."); return }
      if (!categoriaId) { setError("Selecciona una categoría."); return }
      if (!liderId) { setError("Selecciona un líder."); return }
      if (!socio2Id) { setError("Selecciona un Socio 2."); return }
    }

    setLoading(true)
    try {
      if (editando) {
        await api.patch(`/proyectos/${proyecto!.id}`, { nombre, descripcion, fechaFin })
      } else {
        await api.post("/proyectos", {
          nombre, descripcion, fechaInicio, fechaFin, categoriaId, liderId, socio2Id,
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el proyecto.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl relative overflow-y-auto"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#F58220] to-[#FFB366] rounded-t-3xl" />

        <div className="p-8 space-y-5 mt-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            {editando ? "Editar Proyecto" : "Nuevo Proyecto"}
          </h2>

          {/* NOMBRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto *
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
            />
          </div>

          {/* FECHA FIN — editable al editar, auto-calculada al crear */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha estimada de finalización {editando ? "*" : ""}
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={!editando && !!fechaInicio}
              className={`w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F58220] ${
                !editando && fechaInicio
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-800"
              }`}
            />
            {!editando && (
              <p className="text-xs text-gray-500 mt-1">
                Se calcula automáticamente 6 meses después del inicio.
              </p>
            )}
          </div>

          {/* CAMPOS SOLO AL CREAR */}
          {!editando && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Líder del proyecto *
                </label>
                <select
                  value={liderId}
                  onChange={(e) => setLiderId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300"
                >
                  <option value="">Seleccionar Líder</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Socio 2 *
                </label>
                <select
                  value={socio2Id}
                  onChange={(e) => setSocio2Id(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300"
                >
                  <option value="">Seleccionar Socio 2</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* BOTONES */}
          <div className="sticky bottom-0 bg-white pt-4 space-y-3">
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#FFB366] text-white font-semibold hover:from-[#FF9F40] hover:to-[#FFCC80] transition disabled:opacity-50"
              >
                {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear Proyecto"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
