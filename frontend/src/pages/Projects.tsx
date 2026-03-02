import { useEffect, useState } from "react"
import { api } from "../services/api"
import { motion } from "framer-motion"
import ProjectModal from "../components/projects/ProjectModal"
import ProjectCard from "../components/projects/ProjectCard"

interface Usuario {
  id: string
  nombre: string
}

interface Advertencia {
  tipo: string
  nivel: "CRITICA" | "MEDIA" | "BAJA"
  mensaje: string
}

interface Proyecto {
  id: string
  nombre: string
  descripcion: string
  lider: Usuario
  socio2?: Usuario
  categoria: { id: string; nombre: string }
  fechaInicio: string
  fechaFin: string
  estado: string
  advertencias?: Advertencia[]
}

export default function Projects() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [filter, setFilter] = useState<string>("todos")
  const [showModal, setShowModal] = useState(false)

  const loadProjects = async () => {
    try {
      const res = await api.get("/proyectos")
      setProjects(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // Obtener líderes únicos
  const lideres = Array.from(
    new Set(projects.map((p) => p.lider?.nombre))
  ).filter(Boolean)

  // Filtrar por líder
  const filteredProjects =
    filter === "todos"
      ? projects
      : projects.filter((p) => p.lider?.nombre === filter)

  // Agrupar por categoría
  const groupedByCategory = filteredProjects.reduce(
    (acc: Record<string, Proyecto[]>, proyecto) => {
      const cat = proyecto.categoria?.nombre || "Sin Categoría"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(proyecto)
      return acc
    },
    {}
  )

  return (
    <div className="min-h-screen bg-[#F3FBF6] p-10 space-y-10">

      {/* HEADER */}
      <div className="bg-[#DDF7E6] rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">
            Proyectos
          </h1>
          <p className="text-sm text-[#166534] mt-1">
            Gestión y seguimiento de proyectos activos
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">

          <select
            className="bg-white border border-green-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="todos">Todos los líderes</option>
            {lideres.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-200"
          >
            + Nuevo Proyecto
          </motion.button>

        </div>
      </div>

      {/* LISTADO */}
      {Object.entries(groupedByCategory).map(([categoria, proyectos]) => (
        <div key={categoria} className="space-y-6">

          <div className="inline-flex items-center bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full">
            {categoria}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {proyectos.map((p) => (
              <ProjectCard key={p.id} proyecto={p} />
            ))}
          </div>

        </div>
      ))}

      {showModal && (
        <ProjectModal
          onClose={() => {
            setShowModal(false)
            loadProjects()
          }}
        />
      )}
    </div>
  )
}