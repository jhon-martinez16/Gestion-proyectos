import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  LayoutDashboard, FolderOpen, CalendarDays, Users, Tag,
  Receipt, Truck, BarChart3, Settings2, Bell, Mail, LogOut, FileText,
} from "lucide-react"
import { getRolFromToken, getNameFromToken } from "../../utils/auth"

interface Props {
  criticalCount: number
  notifCount: number
  onOpenPanel: () => void
  onOpenNotif: () => void
}

const NAV_MAIN = [
  { to: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { to: "/projects",    label: "Proyectos",   icon: FolderOpen,  matchPrefix: true },
  { to: "/propuestas",  label: "Propuestas",  icon: FileText },
  { to: "/cronograma",  label: "Cronograma",  icon: CalendarDays },
]
const NAV_ADMIN = [
  { to: "/users",      label: "Usuarios",    icon: Users },
  { to: "/categories", label: "Categorías",  icon: Tag },
]
const NAV_FIN = [
  { to: "/facturacion", label: "Facturación", icon: Receipt },
  { to: "/proveedores", label: "Proveedores", icon: Truck },
  { to: "/reportes",    label: "Reportes",    icon: BarChart3 },
]

export default function Sidebar({ criticalCount, notifCount, onOpenPanel, onOpenNotif }: Props) {
  const navigate = useNavigate()
  const rol    = getRolFromToken()
  const nombre = getNameFromToken()
  const esAdmin              = rol === "ADMIN"
  const esAdminOAdministrativo = rol === "ADMIN" || rol === "ADMINISTRATIVO"

  const initials = nombre
    ? nombre.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  const rolLabel = esAdmin ? "Administrador" : rol === "ADMINISTRATIVO" ? "Administrativo" : "Socio"
  const rolColor = esAdmin ? "var(--accent)" : rol === "ADMINISTRATIVO" ? "#93c5fd" : "#4ade80"

  return (
    <aside style={{
      width: 220,
      background: "linear-gradient(160deg, #1a3560 0%, #1e3f73 60%, #1b3461 100%)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "20px 12px",
      flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.08)",
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
      height: "100vh",
      overflowY: "auto",
      boxShadow: "4px 0 24px rgba(10,20,60,0.18)",
    }}>

      {/* ── LOGO ── */}
      <div style={{ padding: "20px 16px 28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 26,
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}>
              Logique
            </div>
            <div style={{
              fontSize: 12,
              color: "var(--sidebar-text)",
              lineHeight: 1,
              marginTop: 3,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Consulting
            </div>
          </div>
          <div style={{ position: "relative", width: 9, height: 9, flexShrink: 0 }}>
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.7,
              animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
          </div>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_MAIN.map(item => <NavItem key={item.to} {...item} />)}

        {esAdmin && (
          <>
            <Divider />
            {NAV_ADMIN.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}

        {esAdminOAdministrativo && (
          <>
            <Divider />
            {NAV_FIN.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}

        <Divider />
        <NavItem to="/settings" label="Configuración" icon={Settings2} />
      </nav>

      {/* ── BOTTOM ACTIONS ── */}
      <div style={{ marginTop: 16 }}>
        <SidebarAction icon={Mail} label="Notificaciones" onClick={onOpenNotif} badge={notifCount} badgeColor="#3b82f6" />
        <SidebarAction icon={Bell} label="Alertas" onClick={onOpenPanel} badge={criticalCount} badgeColor="#ef4444" pulse />

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />

        {/* User card */}
        <div style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: "white",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {nombre ?? "Usuario"}
            </p>
            <p style={{ fontSize: 11, color: rolColor }}>
              {rolLabel}
            </p>
          </div>
          <motion.button
            onClick={() => { localStorage.removeItem("token"); navigate("/login") }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title="Cerrar sesión"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)", flexShrink: 0,
              display: "flex", alignItems: "center", padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <LogOut size={14} />
          </motion.button>
        </div>

        <p style={{
          fontSize: 10, color: "rgba(148,163,184,0.4)",
          textAlign: "center", marginTop: 10,
        }}>
          © 2026 Logique
        </p>
      </div>
    </aside>
  )
}

/* ── NavItem ── */
function NavItem({ to, label, icon: Icon, matchPrefix }: {
  to: string; label: string
  icon: React.ElementType; matchPrefix?: boolean
}) {
  const location = useLocation()
  const isActive = matchPrefix
    ? location.pathname === to || location.pathname.startsWith(to + "/")
    : location.pathname === to

  return (
    <NavLink to={to} end={!matchPrefix && to !== "/"} style={{ textDecoration: "none" }}>
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "white" : "var(--sidebar-text)",
          background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
          borderLeft: isActive ? "2px solid var(--sidebar-accent)" : "2px solid transparent",
          transition: "all 0.15s ease",
          cursor: "pointer",
          marginLeft: isActive ? 0 : 0,
        }}
        onMouseEnter={e => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"
        }}
        onMouseLeave={e => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"
        }}
      >
        <Icon
          size={15}
          style={{ flexShrink: 0, color: isActive ? "var(--sidebar-accent)" : "inherit" }}
        />
        {label}
      </motion.div>
    </NavLink>
  )
}

/* ── Divider ── */
function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 4px" }} />
}

/* ── SidebarAction (Notif / Alerta buttons) ── */
function SidebarAction({ icon: Icon, label, onClick, badge, badgeColor, pulse }: {
  icon: React.ElementType; label: string; onClick: () => void
  badge: number; badgeColor: string; pulse?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 3 }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8, border: "none",
        background: "transparent", color: "var(--sidebar-text)",
        cursor: "pointer", marginBottom: 2,
        fontSize: 14, fontWeight: 500,
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ position: "relative", flexShrink: 0 }}>
        <Icon size={15} />
        {badge > 0 && (
          <>
            <span style={{
              position: "absolute", top: -6, right: -8,
              background: badgeColor, color: "white",
              fontSize: 9, fontWeight: 700, borderRadius: 99,
              minWidth: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px", zIndex: 1,
            }}>
              {badge}
            </span>
            {pulse && (
              <span style={{
                position: "absolute", top: -6, right: -8,
                background: badgeColor, borderRadius: 99,
                minWidth: 16, height: 16,
                animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                opacity: 0.6,
              }} />
            )}
          </>
        )}
      </span>
      <span>{label}</span>
    </motion.button>
  )
}
