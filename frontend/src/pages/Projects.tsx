import { useEffect, useState } from "react"
import { api } from "../services/api"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, X, ChevronDown, FolderOpen } from "lucide-react"
import ProjectModal from "../components/projects/ProjectModal"
import ProjectCard from "../components/projects/ProjectCard"
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
  { value: "todos",    label: "Todos los estados" },
  { value: "EN_CURSO",    label: "En curso" },
  { value: "ADVERTENCIA", label: "Advertencia" },
  { value: "EN_RIESGO",   label: "En riesgo" },
  { value: "FINALIZADO",  label: "Finalizado" },
]

const ETAPA_OPTIONS = [
  { value: "todas",       label: "Todas las etapas" },
  { value: "PROPUESTA",    label: "Propuesta" },
  { value: "KICK_OFF",     label: "Kick-off" },
  { value: "EN_EJECUCION", label: "En ejecución" },
  { value: "CIERRE",       label: "Cierre" },
]

// ── Motion variants ───────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
}
const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } }
const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

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
    const matchEtapa    = filtroEtapa === "todas"  || p.etapa  === filtroEtapa
    const matchLider    = filtroLider === "todos"  || p.lider?.nombre === filtroLider
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
  const hasFilters = busqueda || filtroEstado !== "todos" || filtroEtapa !== "todas" || filtroLider !== "todos"

  // ── Loading ──
  if (loading) return (
    <div style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--card-border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando proyectos…</p>
    </div>
  )

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
      <p style={{ color: "var(--danger)", fontWeight: 500 }}>{error}</p>
      <button onClick={loadProjects} className="btn-primary">Reintentar</button>
    </div>
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">

      {/* ── PAGE HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, paddingBottom: 24,
        borderBottom: "1px solid var(--card-border)",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 32, fontWeight: 400, color: "var(--text-primary)",
            margin: 0, lineHeight: 1.1,
          }}>
            Proyectos
          </h1>
          <p style={{
            fontSize: 14, color: "var(--text-muted)", marginTop: 6,
          }}>
            {projects.length} proyecto{projects.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(22,163,74,0.35)" }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 22px",
            background: "var(--primary)", color: "white",
            border: "none", borderRadius: 50, cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            boxShadow: "0 4px 14px rgba(22,163,74,0.25)",
            transition: "var(--transition)",
          }}
        >
          <Plus size={16} /> Nuevo Proyecto
        </motion.button>
      </div>

      {/* ── FILTERS ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
        marginBottom: 24,
        padding: "16px 20px",
        background: "white",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--card-shadow)",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--content-bg)", border: "1.5px solid var(--card-border)",
          borderRadius: "var(--radius-md)", padding: "8px 14px",
          flex: "1 1 200px", minWidth: 180,
          transition: "var(--transition)",
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--primary)")}
          onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--card-border)")}
        >
          <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 14, color: "var(--text-primary)", width: "100%",
            }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-muted)", padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Selects */}
        {[
          { value: filtroLider, onChange: setFiltroLider, options: [{ value: "todos", label: "Todos los líderes" }, ...lideres.map(l => ({ value: l, label: l }))] },
          { value: filtroEstado, onChange: setFiltroEstado, options: ESTADO_OPTIONS },
          { value: filtroEtapa,  onChange: setFiltroEtapa,  options: ETAPA_OPTIONS  },
        ].map((sel, i) => (
          <div key={i} style={{
            position: "relative",
            display: "flex", alignItems: "center",
          }}>
            <select
              value={sel.value}
              onChange={e => sel.onChange(e.target.value)}
              style={{
                appearance: "none",
                background: "var(--content-bg)",
                border: "1.5px solid var(--card-border)",
                borderRadius: "var(--radius-md)",
                padding: "8px 36px 8px 14px",
                fontSize: 13, fontWeight: 500,
                color: "var(--text-primary)",
                cursor: "pointer", outline: "none",
                transition: "var(--transition)",
              }}
            >
              {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} color="var(--text-muted)" style={{ position: "absolute", right: 10, pointerEvents: "none" }} />
          </div>
        ))}

        {/* Clear filters */}
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroEtapa("todas"); setFiltroLider("todos") }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, color: "var(--danger)", background: "var(--danger-light)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--radius-md)", padding: "8px 12px",
                cursor: "pointer", fontWeight: 500,
                transition: "var(--transition)",
              }}
            >
              <X size={13} /> Limpiar
            </motion.button>
          )}
        </AnimatePresence>

        {/* Counter */}
        {hasFilters && (
          <span style={{
            fontSize: 12, color: "var(--text-muted)",
            marginLeft: "auto",
          }}>
            <strong style={{ color: "var(--text-primary)" }}>{filteredProjects.length}</strong> de {projects.length}
          </span>
        )}
      </div>

      {/* ── ACTIVE PROJECTS grouped by category ── */}
      {Object.entries(activosAgrupados).map(([categoria, proyectosGrupo]) => (
        <div key={categoria} style={{ marginBottom: 36 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--primary-light)",
              color: "var(--primary-dark)",
              fontSize: 12, fontWeight: 700,
              padding: "5px 14px", borderRadius: 50,
            }}>
              <FolderOpen size={13} />
              {categoria}
              <span style={{
                background: "var(--primary)", color: "white",
                borderRadius: 50, fontSize: 10, fontWeight: 700,
                padding: "1px 7px", marginLeft: 2,
              }}>
                {proyectosGrupo.length}
              </span>
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
          </div>

          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}
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

      {/* ── EMPTY STATE ── */}
      {activos.length === 0 && finalizados.length === 0 && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "64px 20px", gap: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FolderOpen size={24} color="var(--primary)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>
            No hay proyectos que mostrar
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {hasFilters ? "Intenta cambiar los filtros activos" : "Crea tu primer proyecto"}
          </p>
        </div>
      )}

      {/* ── FINALIZED PROJECTS ── */}
      {finalizados.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>
              Proyectos cerrados ({finalizados.length})
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
          </div>
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, opacity: 0.7 }}
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

      {/* ── MODAL ── */}
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
