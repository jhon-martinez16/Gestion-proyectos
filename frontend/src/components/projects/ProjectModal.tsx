import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { motion } from "framer-motion"

interface Props {
  onClose: () => void
}

export default function ProjectModal({ onClose }: Props) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [liderId, setLiderId] = useState("")
  const [socio2Id, setSocio2Id] = useState("")

  const [categorias, setCategorias] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])

  // 🔹 Cargar categorías y usuarios
  useEffect(() => {
    const loadData = async () => {
      const cat = await api.get("/categorias")
      const users = await api.get("/usuarios")

      setCategorias(cat.data)
      setUsuarios(users.data)
    }

    loadData()
  }, [])

  // 🔹 Calcular fecha fin automáticamente (+6 meses)
  useEffect(() => {
    if (fechaInicio) {
      const inicio = new Date(fechaInicio)
      inicio.setMonth(inicio.getMonth() + 6)

      const year = inicio.getFullYear()
      const month = String(inicio.getMonth() + 1).padStart(2, "0")
      const day = String(inicio.getDate()).padStart(2, "0")

      setFechaFin(`${year}-${month}-${day}`)
    }
  }, [fechaInicio])

  const handleSubmit = async () => {
    if (!nombre || !fechaInicio || !categoriaId || !liderId || !socio2Id) {
      alert("Completa todos los campos obligatorios")
      return
    }

    await api.post("/proyectos", {
      nombre,
      descripcion,
      fechaInicio,
      fechaFin,
      categoriaId,
      liderId,
      socio2Id,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl relative overflow-y-auto"
      >
        {/* CINTA SUPERIOR DECORATIVA */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#F58220] to-[#FFB366] rounded-t-3xl" />

        {/* CONTENIDO DEL MODAL */}
        <div className="p-8 space-y-5 mt-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Nuevo Proyecto
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

          {/* FECHA INICIO */}
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

          {/* FECHA FIN AUTOMÁTICA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha estimada de finalización
            </label>
            <input
              type="date"
              value={fechaFin}
              disabled
              className="w-full p-3 rounded-xl bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta fecha se calcula automáticamente 6 meses después del inicio.
            </p>
          </div>

          {/* CATEGORÍA */}
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
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* LÍDER */}
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
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* SOCIO 2 */}
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
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 mt-4 sticky bottom-0 bg-white pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 transition font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#F58220] to-[#FFB366] text-white font-semibold hover:from-[#FF9F40] hover:to-[#FFCC80] transition"
            >
              Crear Proyecto
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}