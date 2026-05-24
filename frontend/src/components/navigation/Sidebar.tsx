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

const S = {
  sidebar: {
    width: 240,
    background: "#0F0F0F",
    minHeight: "100vh",
    display: "flex" as const,
    flexDirection: "column" as const,
    padding: "20px 12px",
    flexShrink: 0,
    borderRight: "1px solid rgba(255,255,255,0.06)",
    position: "sticky" as const,
    top: 0,
    alignSelf: "flex-start" as const,
    height: "100vh",
    overflowY: "auto" as const,
  },
  logoWrap: {
    padding: "24px 16px 32px 16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 4,
  },
  logoTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    fontWeight: 400,
    color: "#C8A96E",
    lineHeight: 1.0,
    letterSpacing: "-0.01em",
  },
  logoSub: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 10,
    color: "#6B6560",
    lineHeight: 1,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
  },
  nav: { flex: 1, display: "flex" as const, flexDirection: "column" as const, gap: 1 },
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 4px" },
  footerText: {
    fontSize: 10,
    color: "rgba(148,163,184,0.25)",
    textAlign: "center" as const,
    marginTop: 10,
  },
}

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

  return (
    <aside style={S.sidebar}>

      {/* ── LOGO ── */}
      <div style={S.logoWrap}>
        <span style={S.logoTitle}>Logique</span>
        <span style={S.logoSub}>Consulting</span>
      </div>

      {/* ── NAVIGATION ── */}
      <nav style={S.nav}>
        {NAV_MAIN.map(item => <NavItem key={item.to} {...item} />)}

        {esAdmin && (
          <>
            <div style={S.divider} />
            {NAV_ADMIN.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}

        {esAdminOAdministrativo && (
          <>
            <div style={S.divider} />
            {NAV_FIN.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}

        <div style={S.divider} />
        <NavItem to="/settings" label="Configuración" icon={Settings2} />
      </nav>

      {/* ── BOTTOM ACTIONS ── */}
      <div style={{ marginTop: 16 }}>
        <SidebarAction icon={Mail} label="Notificaciones" onClick={onOpenNotif} badge={notifCount} badgeColor="#C8A96E" />
        <SidebarAction icon={Bell} label="Alertas" onClick={onOpenPanel} badge={criticalCount} badgeColor="#C0392B" pulse />

        <div style={S.divider} />

        {/* User card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #2D4A3E, #C8A96E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, color: "white", flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 500, color: "#E8E4DC",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {nombre ?? "Usuario"}
            </p>
            <p style={{
              fontSize: 11, color: "#6B6560",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {rolLabel}
            </p>
          </div>
          <motion.button
            onClick={() => { localStorage.removeItem("token"); navigate("/login") }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Cerrar sesión"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.25)", flexShrink: 0,
              display: "flex", alignItems: "center", padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#C0392B")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            <LogOut size={14} />
          </motion.button>
        </div>

        <p style={S.footerText}>© 2026 Logique</p>
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 13.5,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? "#FFFFFF" : "#9A9490",
          background: isActive ? "#1A1A1A" : "transparent",
          borderLeft: isActive ? "2px solid #C8A96E" : "2px solid transparent",
          transition: "color 150ms ease, background 150ms ease",
          cursor: "pointer",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.color = "#E8E4DC"
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.color = "#9A9490"
          }
        }}
      >
        <Icon
          size={15}
          style={{ flexShrink: 0, color: isActive ? "#C8A96E" : "#6B6560" }}
        />
        {label}
      </div>
    </NavLink>
  )
}

/* ── SidebarAction ── */
function SidebarAction({ icon: Icon, label, onClick, badge, badgeColor, pulse }: {
  icon: React.ElementType; label: string; onClick: () => void
  badge: number; badgeColor: string; pulse?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 6, border: "none",
        background: "transparent", color: "#9A9490",
        cursor: "pointer", marginBottom: 2,
        fontSize: 13.5, fontWeight: 400,
        transition: "color 150ms ease",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
      onMouseEnter={e => (e.currentTarget.style.color = "#E8E4DC")}
      onMouseLeave={e => (e.currentTarget.style.color = "#9A9490")}
    >
      <span style={{ position: "relative", flexShrink: 0 }}>
        <Icon size={15} style={{ color: "#6B6560" }} />
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
                opacity: 0.5,
              }} />
            )}
          </>
        )}
      </span>
      <span>{label}</span>
    </button>
  )
}
