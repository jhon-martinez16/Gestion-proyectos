import { useEffect, useState } from "react"
import { api } from "../services/api"
import { motion } from "framer-motion"
import ProjectModal from "../components/projects/ProjectModal"
import ProjectCard from "../components/projects/ProjectCard"
import { getRolFromToken } from "../utils/auth"

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
  etapa?: string
  advertencias?: Advertencia[]
}

const ESTADO_OPTIONS = [
  { value: "todos", label: "Todos los estados" },
  { value: "EN_CURSO",    label: "En curso" },
  { value: "ADVERTENCIA", label: "Advertencia" },
  { value: "EN_RIESGO",   label: "En riesgo" },
  { value: "FINALIZADO",  label: "Finalizado" },
]

const ETAPA_OPTIONS = [
  { value: "todas", label: "Todas las etapas" },
  { value: "PROPUESTA",    label: "Propuesta" },
  { value: "KICK_OFF",     label: "Kick-off" },
  { value: "EN_EJECUCION", label: "En ejecución" },
  { value: "CIERRE",       label: "Cierre" },
]

export default function Projects() {
  const esAdmin = getRolFromToken() === "ADMIN"
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroEtapa, setFiltroEtapa] = useState("todas")
  const [filtroLider, setFiltroLider] = useState("todos")
  const [showModal, setShowModal] = useState(false)
  const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/proyectos")
      setProjects(res.data)
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (p: Proyecto) => {
    if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/proyectos/${p.id}`)
      loadProjects()
    } catch {
      setError("Error eliminando proyecto.")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setProyectoEditando(null)
    loadProjects()
  }

  const lideres = Array.from(new Set(projects.map((p) => p.lider?.nombre))).filter(Boolean)

  const filteredProjects = projects.filter((p) => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado
    const matchEtapa = filtroEtapa === "todas" || p.etapa === filtroEtapa
    const matchLider = filtroLider === "todos" || p.lider?.nombre === filtroLider
    return matchBusqueda && matchEstado && matchEtapa && matchLider
  })

  // Split active vs finalized
  const activos = filteredProjects.filter((p) => p.estado !== "FINALIZADO")
  const finalizados = filteredProjects.filter((p) => p.estado === "FINALIZADO")

  const groupByCategory = (list: Proyecto[]) =>
    list.reduce((acc: Record<string, Proyecto[]>, proyecto) => {
      const cat = proyecto.categoria?.nombre || "Sin Categoría"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(proyecto)
      return acc
    }, {})

  const activosAgrupados = groupByCategory(activos)

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={loadProjects} className="px-5 py-2 bg-[#16A34A] text-white rounded-xl font-medium hover:bg-[#15803D] transition">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3FBF6] p-10 space-y-10">

      {/* HEADER */}
      <div className="bg-[#DDF7E6] rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#14532D]">Proyectos</h1>
          <p className="text-sm text-[#166534] mt-1">Gestión y seguimiento de proyectos activos</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-200"
        >
          + Nuevo Proyecto
        </motion.button>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar proyecto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-white border border-green-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] min-w-[200px]"
        />
        <select
          value={filtroLider}
          onChange={(e) => setFiltroLider(e.target.value)}
          className="bg-white border border-green-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        >
          <option value="todos">Todos los líderes</option>
          {lideres.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-white border border-green-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        >
          {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="bg-white border border-green-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        >
          {ETAPA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(busqueda || filtroEstado !== "todos" || filtroEtapa !== "todas" || filtroLider !== "todos") && (
          <button
            onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroEtapa("todas"); setFiltroLider("todos") }}
            className="text-sm text-gray-500 hover:text-red-500 underline transition"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* CONTADOR */}
      {(busqueda || filtroEstado !== "todos" || filtroEtapa !== "todas" || filtroLider !== "todos") && (
        <p className="text-sm text-gray-500">
          Mostrando <span className="font-semibold text-gray-700">{filteredProjects.length}</span> de{" "}
          <span className="font-semibold text-gray-700">{projects.length}</span> proyectos
        </p>
      )}

      {/* PROYECTOS ACTIVOS */}
      {Object.entries(activosAgrupados).map(([categoria, proyectos]) => (
        <div key={categoria} className="space-y-6">
          <div className="inline-flex items-center bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full">
            {categoria}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {proyectos.map((p) => (
              <ProjectCard
                key={p.id}
                proyecto={p}
                onEdit={() => setProyectoEditando(p)}
                onDelete={esAdmin ? () => handleDelete(p) : undefined}
              />
            ))}
          </div>
        </div>
      ))}

      {activos.length === 0 && finalizados.length === 0 && (
        <p className="text-center text-gray-400 py-12">No hay proyectos que mostrar con los filtros actuales.</p>
      )}

      {/* PROYECTOS FINALIZADOS */}
      {finalizados.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Proyectos cerrados</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 opacity-70">
            {finalizados.map((p) => (
              <ProjectCard
                key={p.id}
                proyecto={p}
                onEdit={() => setProyectoEditando(p)}
                onDelete={esAdmin ? () => handleDelete(p) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {(showModal || proyectoEditando) && (
        <ProjectModal
          onClose={handleCloseModal}
          proyecto={proyectoEditando ? {
            id: proyectoEditando.id,
            nombre: proyectoEditando.nombre,
            descripcion: proyectoEditando.descripcion,
            fechaFin: proyectoEditando.fechaFin,
          } : undefined}
        />
      )}
    </div>
  )
}
