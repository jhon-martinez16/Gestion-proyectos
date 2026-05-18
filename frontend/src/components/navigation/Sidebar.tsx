import { NavLink, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { getRolFromToken, getNameFromToken } from "../../utils/auth"

interface Props {
  criticalCount: number
  notifCount: number
  onOpenPanel: () => void
  onOpenNotif: () => void
}

export default function Sidebar({ criticalCount, notifCount, onOpenPanel, onOpenNotif }: Props) {
  const navigate = useNavigate()
  const rol = getRolFromToken()
  const nombre = getNameFromToken()
  const esAdmin = rol === "ADMIN"
  const esAdminOAdministrativo = rol === "ADMIN" || rol === "ADMINISTRATIVO"

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <aside className="w-64 bg-[#0B355A] border-r border-white/5 p-6 flex flex-col justify-between min-h-screen text-white">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold mb-8 tracking-wide">
          <span className="text-[#F58220]">Logique</span>{" "}
          Consulting
        </h2>

        <nav className="space-y-3">
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/projects" label="Proyectos" />
          {esAdmin && <div className="h-px bg-white/10 my-1" />}
          {esAdmin && <NavItem to="/users" label="Usuarios" />}
          {esAdmin && <NavItem to="/categories" label="Categorías" />}
          {esAdminOAdministrativo && <div className="h-px bg-white/10 my-1" />}
          {esAdminOAdministrativo && <NavItem to="/facturacion" label="Facturación" />}
          {esAdminOAdministrativo && <NavItem to="/proveedores" label="Proveedores" />}
          {esAdminOAdministrativo && <NavItem to="/reportes" label="Reportes" />}
          <div className="h-px bg-white/10 my-1" />
          <NavItem to="/settings" label="Configuración" />
        </nav>
      </div>

      {/* FOOTER */}
      <div className="space-y-2">
        {/* Notificaciones */}
        <button
          onClick={onOpenNotif}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/5 transition font-medium"
        >
          <span className="relative">
            <span className="text-xl">✉</span>
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {notifCount}
              </span>
            )}
          </span>
          <span>Notificaciones</span>
        </button>

        {/* Alertas */}
        <button
          onClick={onOpenPanel}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/5 transition font-medium"
        >
          <span className="relative">
            <span className="text-xl">🔔</span>
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {criticalCount}
              </span>
            )}
          </span>
          <span>Alertas</span>
        </button>

        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="space-y-0.5">
            {nombre && (
              <p className="text-xs text-white font-semibold truncate">{nombre}</p>
            )}
            <p className="text-xs text-[#9FB3C8]">
              <span className={`font-semibold ${
                esAdmin ? "text-[#F58220]"
                : rol === "ADMINISTRATIVO" ? "text-blue-300"
                : "text-green-400"
              }`}>
                {esAdmin ? "Administrador" : rol === "ADMINISTRATIVO" ? "Administrativo" : "Socio"}
              </span>
            </p>
            <p className="text-xs text-[#9FB3C8]">© 2026 Logique</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-red-500/20 transition"
          >
            <span className="text-base">→</span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `px-4 py-3 rounded-xl transition-all font-medium block
        ${isActive ? "bg-[#F58220]/20 text-[#F58220]" : "text-white hover:bg-white/5"}`
      }
    >
      <motion.div whileHover={{ x: 6 }}>
        {label}
      </motion.div>
    </NavLink>
  )
}
