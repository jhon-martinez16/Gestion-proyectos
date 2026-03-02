import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"

interface Props {
  children: ReactNode
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0E1B2B] to-[#0F4C81] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0B355A] border-r border-white/5 p-6 flex flex-col justify-between">

        {/* LOGO */}
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-wide">
              <span className="text-[#F58220]">Logique</span>
              <span className="text-white"> Consulting</span>
            </h1>
            <div className="w-12 h-[2px] bg-[#F58220] mt-2"></div>
          </div>

          {/* MENU */}
          <nav className="space-y-3">

            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/projects" label="Proyectos" />
            <NavItem to="/usuarios" label="Usuarios" />

          </nav>
        </div>

        {/* FOOTER SIDEBAR */}
        <div className="text-xs text-[#9FB3C8]">
          © 2026 Logique Consulting
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  )
}

/* ITEM REUTILIZABLE */
function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-3 rounded-xl font-medium transition-all ${
          isActive
            ? "bg-[#F58220]/20 text-[#F58220]"
            : "text-white hover:bg-white/5"
        }`
      }
    >
      <motion.div whileHover={{ x: 5 }}>
        {label}
      </motion.div>
    </NavLink>
  )
}