import { useEffect, useState } from "react"
import { api } from "../services/api"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, X } from "lucide-react"
import ProjectModal from "../components/projects/ProjectModal"
import ProjectCard from "../components/projects/ProjectCard"
import Button from "../components/ui/Button"
import SectionHeader from "../components/ui/SectionHeader"
import EmptyState from "../components/ui/EmptyState"
import Skeleton from "../components/ui/Skeleton"
import { getRolFromToken } from "../utils/auth"

interface Usuario    { id: string; nombre: string }
interface Advertencia { tipo: string; nivel: "CRITICA" | "MEDIA" | "BAJA"; mensaje: string }
interface Proyecto {
  id: string; nombre: string; descripcion: string
  lider: Usuario; socio2?: Usuario
  categoria: { id: string; nombre: string }
  fechaInicio: string; fechaFin: string
  estado: string; etapa?: string
  advertencias?: Advertencia[]
}

const ESTADO_OPTIONS = [
  { value: "todos",        label: "Todos los estados" },
  { value: "EN_CURSO",    label: "En curso" },
  { value: "ADVERTENCIA", label: "Advertencia" },
  { value: "EN_RIESGO",   label: "En riesgo" },
  { value: "FINALIZADO",  label: "Finalizado" },
]

const ETAPA_OPTIONS = [
  { value: "todas",        label: "Todas las etapas" },
  { value: "PROPUESTA",    label: "Propuesta" },
  { value: "KICK_OFF",     label: "Kick-off" },
  { value: "EN_EJECUCION", label: "En ejecución" },
  { value: "CIERRE",       label: "Cierre" },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
}

const gridVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
}

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

const GRID_COLS = "repeat(auto-fill, minmax(320px, 1fr))"

export default function Projects() {
  const esAdmin = getRolFromToken() === "ADMIN"
  const [projects,         setProjects]         = useState<Proyecto[]>([])
  const [busqueda,         setBusqueda]         = useState("")
  const [filtroEstado,     setFiltroEstado]     = useState("todos")
  const [filtroEtapa,      setFiltroEtapa]      = useState("todas")
  const [filtroLider,      setFiltroLider]      = useState("todos")
  const [showModal,        setShowModal]        = useState(false)
  const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState<string | null>(null)

  const loadProjects = async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get("/proyectos")
      setProjects(res.data)
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [])

  const handleDelete = async (p: Proyecto) => {
    if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    try { await api.delete(`/proyectos/${p.id}`); loadProjects() }
    catch { setError("Error eliminando proyecto.") }
  }

  const handleCloseModal = () => {
    setShowModal(false); setProyectoEditando(null); loadProjects()
  }

  const lideres = Array.from(new Set(projects.map(p => p.lider?.nombre))).filter(Boolean)

  const filteredProjects = projects.filter(p => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado   = filtroEstado === "todos" || p.estado === filtroEstado
    const matchEtapa    = filtroEtapa  === "todas" || p.etapa  === filtroEtapa
    const matchLider    = filtroLider  === "todos" || p.lider?.nombre === filtroLider
    return matchBusqueda && matchEstado && matchEtapa && matchLider
  })

  const activos     = filteredProjects.filter(p => p.estado !== "FINALIZADO")
  const finalizados = filteredProjects.filter(p => p.estado === "FINALIZADO")

  const groupByCategory = (list: Proyecto[]) =>
    list.reduce((acc: Record<string, Proyecto[]>, p) => {
      const cat = p.categoria?.nombre || "Sin Categoría"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(p)
      return acc
    }, {})

  const activosAgrupados = groupByCategory(activos)
  const hasFilters = !!(busqueda || filtroEstado !== "todos" || filtroEtapa !== "todas" || filtroLider !== "todos")

  // ── Loading ─────────────────────────────────────────────────────
  if (loading) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-ui-border">
        <div>
          <h1 className="font-serif text-[30px] font-normal text-ink leading-tight">Proyectos</h1>
          <p className="text-sm text-ink-3 mt-1.5">Cargando proyectos…</p>
        </div>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </motion.div>
  )

  // ── Error ────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-sm text-state-red font-medium">{error}</p>
      <Button variant="secondary" onClick={loadProjects}>Reintentar</Button>
    </div>
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-ui-border">
        <div>
          <h1 className="font-serif text-[30px] font-normal text-ink leading-tight">Proyectos</h1>
          <p className="text-sm text-ink-3 mt-1.5">
            {projects.length} proyecto{projects.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => setShowModal(true)}>
          Nuevo Proyecto
        </Button>
      </div>

      {/* ── FILTERS (floating — no card wrapper) ────────────────── */}
      <div className="flex flex-wrap gap-2.5 items-center mb-8">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "2.25rem", paddingRight: busqueda ? "2rem" : "0.75rem" }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Selects */}
        {[
          { value: filtroLider,  onChange: setFiltroLider,  options: [{ value: "todos", label: "Todos los líderes" }, ...lideres.map(l => ({ value: l, label: l }))] },
          { value: filtroEstado, onChange: setFiltroEstado, options: ESTADO_OPTIONS },
          { value: filtroEtapa,  onChange: setFiltroEtapa,  options: ETAPA_OPTIONS  },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={e => sel.onChange(e.target.value)}
            className="form-input"
            style={{ width: "auto", minWidth: 145 }}
          >
            {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}

        {/* Clear filters */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
            >
              <Button
                variant="danger"
                size="sm"
                leftIcon={X}
                onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroEtapa("todas"); setFiltroLider("todos") }}
              >
                Limpiar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result counter */}
        {hasFilters && (
          <span className="text-xs text-ink-3 ml-auto tabular-nums">
            <strong className="text-ink font-semibold">{filteredProjects.length}</strong> de {projects.length}
          </span>
        )}
      </div>

      {/* ── ACTIVE PROJECTS grouped by category ─────────────────── */}
      {Object.entries(activosAgrupados).map(([categoria, proyectosGrupo]) => (
        <div key={categoria} className="mb-8">
          <SectionHeader title={categoria} count={proyectosGrupo.length} className="mb-4" />
          <motion.div
            variants={gridVariants}
            initial="initial"
            animate="animate"
            className="grid gap-4"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            {proyectosGrupo.map(p => (
              <motion.div key={p.id} variants={cardVariants}>
                <ProjectCard
                  proyecto={p}
                  onEdit={() => setProyectoEditando(p)}
                  onDelete={esAdmin ? () => handleDelete(p) : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      {/* ── EMPTY STATE ─────────────────────────────────────────── */}
      {activos.length === 0 && finalizados.length === 0 && (
        <EmptyState
          icon={Search}
          title={hasFilters ? "Ningún proyecto coincide" : "No hay proyectos aún"}
          description={hasFilters ? "Prueba cambiando los filtros activos." : "Crea tu primer proyecto para comenzar."}
          action={
            hasFilters
              ? { label: "Limpiar filtros", onClick: () => { setBusqueda(""); setFiltroEstado("todos"); setFiltroEtapa("todas"); setFiltroLider("todos") }, variant: "secondary" }
              : { label: "Nuevo Proyecto", onClick: () => setShowModal(true), variant: "primary" }
          }
        />
      )}

      {/* ── FINALIZED PROJECTS ──────────────────────────────────── */}
      {finalizados.length > 0 && (
        <div className="mb-8 opacity-70">
          <SectionHeader
            title={`Proyectos cerrados`}
            count={finalizados.length}
            className="mb-4"
          />
          <motion.div
            variants={gridVariants}
            initial="initial"
            animate="animate"
            className="grid gap-4"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            {finalizados.map(p => (
              <motion.div key={p.id} variants={cardVariants}>
                <ProjectCard
                  proyecto={p}
                  onEdit={() => setProyectoEditando(p)}
                  onDelete={esAdmin ? () => handleDelete(p) : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────────────── */}
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
    </motion.div>
  )
}
