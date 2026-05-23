import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { UserPlus, Edit2, UserX } from "lucide-react"
import clsx from "clsx"
import { api } from "../services/api"
import UserModal from "../components/users/UserModal"
import Avatar from "../components/ui/Avatar"
import Button from "../components/ui/Button"
import PageHeader from "../components/ui/PageHeader"
import Skeleton from "../components/ui/Skeleton"

interface User {
  id: string
  nombre: string
  email: string
  rol: "ADMIN" | "SOCIO" | "ADMINISTRATIVO"
  activo: boolean
}

const ROL_LABELS: Record<string, string> = {
  ADMIN:          "Administrador",
  SOCIO:          "Socio",
  ADMINISTRATIVO: "Administrativo",
}

const ROL_STYLE: Record<string, string> = {
  ADMIN:          "bg-state-violet-bg text-state-violet",
  SOCIO:          "bg-state-blue-bg text-state-blue",
  ADMINISTRATIVO: "bg-state-zinc-bg text-state-zinc",
}

const ROL_OPTIONS = [
  { value: "todos",          label: "Todos" },
  { value: "ADMIN",          label: "Administrador" },
  { value: "SOCIO",          label: "Socio" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
}

export default function Users() {
  const [users,            setUsers]            = useState<User[]>([])
  const [filtroRol,        setFiltroRol]        = useState("todos")
  const [showModal,        setShowModal]        = useState(false)
  const [usuarioEditando,  setUsuarioEditando]  = useState<User | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get("/usuarios")
      setUsers(res.data)
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleDesactivar = async (u: User) => {
    if (!window.confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`)) return
    try {
      await api.patch(`/usuarios/${u.id}/desactivar`)
      loadData()
    } catch {
      setError("Error desactivando usuario.")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false); setUsuarioEditando(null); loadData()
  }

  const filteredUsers = filtroRol === "todos" ? users : users.filter(u => u.rol === filtroRol)

  if (loading) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <PageHeader eyebrow="Equipo" title="Usuarios" subtitle="Cargando…" />
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

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">

      <PageHeader
        eyebrow="Equipo"
        title="Usuarios"
        subtitle="Administra los miembros del equipo y sus permisos."
        stats={
          <>
            <span><strong className="text-ink font-semibold">{users.length}</strong> usuarios</span>
            <span className="text-ink-4">·</span>
            <span><strong className="text-ink font-semibold">{users.filter(u => u.rol === "ADMIN").length}</strong> administradores</span>
            <span className="text-ink-4">·</span>
            <span><strong className="text-ink font-semibold">{users.filter(u => u.rol === "SOCIO").length}</strong> socios</span>
          </>
        }
        actions={
          <Button variant="primary" leftIcon={UserPlus} onClick={() => setShowModal(true)}>
            Nuevo Usuario
          </Button>
        }
      />

      {/* Pill tabs — role filter */}
      <div className="flex items-center gap-1 bg-canvas-2 p-1 rounded-[10px] w-fit mb-6">
        {ROL_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setFiltroRol(o.value)}
            className={clsx(
              "relative px-3 py-1.5 text-[13px] font-medium rounded-[8px] transition-colors duration-150 whitespace-nowrap",
              filtroRol === o.value ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {filtroRol === o.value && (
              <motion.div
                layoutId="users-tab-indicator"
                className="absolute inset-0 bg-white rounded-[8px] shadow-sm border border-ui-border"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {o.label}
            {o.value !== "todos" && (
              <span className="ml-1.5 text-[11px] text-ink-3">
                ({users.filter(u => u.rol === o.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dense table */}
      <div className="card-surface overflow-hidden">
        {filteredUsers.map((u, i) => (
          <div
            key={u.id}
            className={clsx(
              "group flex items-center gap-4 px-4 hover:bg-canvas-2 transition-colors duration-100",
              i < filteredUsers.length - 1 && "border-b border-ui-border",
            )}
            style={{ height: 56 }}
          >
            {/* Avatar */}
            <Avatar name={u.nombre} size="md" />

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink truncate">{u.nombre}</p>
              <p className="text-[12px] text-ink-3 truncate">{u.email}</p>
            </div>

            {/* Role badge */}
            <span className={clsx("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", ROL_STYLE[u.rol] ?? "bg-canvas-2 text-ink-2")}>
              {ROL_LABELS[u.rol] ?? u.rol}
            </span>

            {/* Status */}
            <div className="flex items-center gap-1.5" style={{ minWidth: 72 }}>
              <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", u.activo ? "bg-state-green" : "bg-state-zinc")} />
              <span className={clsx("text-[13px]", u.activo ? "text-ink-2" : "text-ink-3")}>
                {u.activo ? "Activo" : "Inactivo"}
              </span>
            </div>

            {/* Actions — hover only */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                aria-label="Editar"
                className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-ink hover:bg-canvas-2 transition-colors duration-100"
                onClick={() => setUsuarioEditando(u)}
              >
                <Edit2 size={13} />
              </button>
              {u.activo && (
                <button
                  aria-label="Desactivar"
                  className="flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-state-red hover:bg-state-red-bg transition-colors duration-100"
                  onClick={() => handleDesactivar(u)}
                >
                  <UserX size={13} />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="flex items-center justify-center py-12 text-[13px] text-ink-3">
            No hay usuarios con el filtro seleccionado.
          </div>
        )}
      </div>

      {(showModal || usuarioEditando) && (
        <UserModal onClose={handleCloseModal} usuario={usuarioEditando ?? undefined} />
      )}
    </motion.div>
  )
}
