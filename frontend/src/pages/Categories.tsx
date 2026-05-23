import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Edit2, ToggleLeft, ToggleRight } from "lucide-react"
import clsx from "clsx"
import { api } from "../services/api"
import CategoryModal from "../components/categories/CategoryModal"
import Button from "../components/ui/Button"
import PageHeader from "../components/ui/PageHeader"
import Skeleton from "../components/ui/Skeleton"
import { getCategoryStyle } from "../utils/categoryStyle"

interface Category {
  id: string
  nombre: string
  color: string
  activa: boolean
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
}

export default function Categories() {
  const [categories,        setCategories]        = useState<Category[]>([])
  const [showModal,         setShowModal]         = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Category | null>(null)
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get("/categorias")
      setCategories(res.data)
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleDesactivar = async (c: Category) => {
    if (!window.confirm(`¿Desactivar la categoría "${c.nombre}"?`)) return
    try { await api.patch(`/categorias/${c.id}/desactivar`); loadData() }
    catch { setError("Error desactivando categoría.") }
  }

  const handleActivar = async (c: Category) => {
    if (!window.confirm(`¿Activar la categoría "${c.nombre}"?`)) return
    try { await api.patch(`/categorias/${c.id}/activar`); loadData() }
    catch { setError("Error activando categoría.") }
  }

  const handleCloseModal = () => {
    setShowModal(false); setCategoriaEditando(null); loadData()
  }

  if (loading) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <PageHeader eyebrow="Configuración" title="Categorías" subtitle="Cargando…" />
      <div className="grid gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="row" />)}
      </div>
    </motion.div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-sm text-state-red font-medium">{error}</p>
      <Button variant="secondary" onClick={loadData}>Reintentar</Button>
    </div>
  )

  const activas = categories.filter(c => c.activa).length

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">

      <PageHeader
        eyebrow="Configuración"
        title="Categorías"
        subtitle="Organiza tus proyectos en categorías para mantener visibilidad."
        stats={
          <>
            <span><strong className="text-ink font-semibold">{categories.length}</strong> categorías</span>
            <span className="text-ink-4">·</span>
            <span><strong className="text-ink font-semibold">{activas}</strong> activas</span>
          </>
        }
        actions={
          <Button variant="primary" leftIcon={Plus} onClick={() => setShowModal(true)}>
            Nueva Categoría
          </Button>
        }
      />

      {/* Dense table */}
      <div className="card-surface overflow-hidden">
        {categories.map((c, i) => {
          const catStyle = getCategoryStyle(c.nombre)
          const CatIcon  = catStyle.icon
          return (
            <div
              key={c.id}
              className={clsx(
                "group flex items-center gap-4 px-4 hover:bg-canvas-2 transition-colors duration-100",
                i < categories.length - 1 && "border-b border-ui-border",
              )}
              style={{ height: 64 }}
            >
              {/* Category icon square */}
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width: 40, height: 40, background: catStyle.bg }}
              >
                <CatIcon size={17} strokeWidth={1.8} style={{ color: catStyle.fg }} />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink truncate">{c.nombre}</p>
                <p className={clsx("text-[12px] mt-0.5", c.activa ? "text-state-green" : "text-ink-3")}>
                  {c.activa ? "Activa" : "Inactiva"}
                </p>
              </div>

              {/* Color swatch */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                style={{ backgroundColor: c.color }}
              />

              {/* Actions — hover only */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  aria-label="Editar"
                  className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-ink hover:bg-canvas-2 transition-colors duration-100"
                  onClick={() => setCategoriaEditando(c)}
                >
                  <Edit2 size={13} />
                </button>
                {c.activa ? (
                  <button
                    aria-label="Desactivar"
                    className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-state-red hover:bg-state-red-bg transition-colors duration-100"
                    onClick={() => handleDesactivar(c)}
                    title="Desactivar"
                  >
                    <ToggleLeft size={14} />
                  </button>
                ) : (
                  <button
                    aria-label="Activar"
                    className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-primary hover:bg-primary-light transition-colors duration-100"
                    onClick={() => handleActivar(c)}
                    title="Activar"
                  >
                    <ToggleRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="flex items-center justify-center py-12 text-[13px] text-ink-3">
            No hay categorías creadas.
          </div>
        )}
      </div>

      {(showModal || categoriaEditando) && (
        <CategoryModal onClose={handleCloseModal} categoria={categoriaEditando ?? undefined} />
      )}
    </motion.div>
  )
}
