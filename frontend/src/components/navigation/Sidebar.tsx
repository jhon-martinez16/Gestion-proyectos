import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"

export default function Sidebar() {
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
          <NavItem to="/users" label="Usuarios" />
          <NavItem to="/categories" label="Categorías" />
          <NavItem to="/settings" label="Configuración" />
        </nav>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#9FB3C8] mt-10">
        © 2026 Logique
      </div>
    </aside>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        px-4 py-3 rounded-xl transition-all font-medium
        ${
          isActive
            ? "bg-[#F58220]/20 text-[#F58220]"
            : "text-white hover:bg-white/5"
        }
        `
      }
    >
      <motion.div whileHover={{ x: 6 }}>
        {label}
      </motion.div>
    </NavLink>
  )
}