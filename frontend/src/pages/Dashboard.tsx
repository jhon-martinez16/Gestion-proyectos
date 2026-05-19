import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Briefcase, AlertTriangle, Clock, Calendar, DollarSign,
  TrendingUp, ArrowRight, CheckCircle2, ChevronRight,
} from "lucide-react"
import { api } from "../services/api"
import { getRolFromToken, getNameFromToken } from "../utils/auth"

// ── Types ──────────────────────────────────────────────────────────
interface DashboardData {
  proyectos:   { total: number; enRiesgo: number; advertencia: number }
  compromisos: { vencidos: number }
  entregables: { urgentes: number; proximos7Dias: number }
  financiero:  { totalFacturado: number; facturasPendientes: number; montoPorCobrar: number; proveedoresActivos: number }
  socio?: {
    misProyectosActivos:         { id: string; nombre: string; estado: string; etapa: string; fechaFin: string }[]
    misCompromisosVencidos:      { id: string; descripcion: string; fechaActual: string; proyecto: { id: string; nombre: string } }[]
    misEntregablesProximos7Dias: { id: string; nombre: string; fechaEntrega: string; estado: string; proyecto: { id: string; nombre: string } }[]
  }
}

interface Proyecto {
  id: string; nombre: string; fechaInicio: string; fechaFin: string
  estado: string; etapa: string; createdAt: string
  lider: { id: string; nombre: string }
  categoria?: { id: string; nombre: string; color?: string }
}

interface Compromiso {
  id: string; descripcion: string; fechaActual: string; estado: string; proyectoId: string
}

interface Factura {
  id: string; numero: string; concepto: string; monto: number; estado: string; fechaEmision: string
  proyecto?: { id: string; nombre: string }
}

interface EntregableProximo {
  id: string; nombre: string; fechaEntrega: string; estado: string
  proyecto: { id: string; nombre: string }
}

interface ReunionProxima {
  id: string; proximaReunion: string
  proyecto: { id: string; nombre: string }
}

// ── Helpers ────────────────────────────────────────────────────────
const DAYS   = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

function formatFecha(d: Date) {
  return `${DAYS[d.getDay()].charAt(0).toUpperCase() + DAYS[d.getDay()].slice(1)}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function avatarBg(name: string) {
  const colors = ["#6366F1","#0EA5E9","#10B981","#F59E0B","#EC4899","#8B5CF6"]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function hace(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return "hoy"
  if (days === 1) return "ayer"
  return `hace ${days}d`
}

function enDias(dateStr: string) {
  const days = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (days <= 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days}d`
}

function diasRetraso(dateStr: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000))
}

function formatCOP(n: number) {
  return "$" + Math.round(n).toLocaleString("es-CO")
}

// ── Design tokens ──────────────────────────────────────────────────
const ESTADO_COLOR: Record<string, { bar: string; badge: { bg: string; text: string }; label: string }> = {
  EN_CURSO:    { bar: "#16a34a", badge: { bg: "#dcfce7", text: "#15803d" }, label: "En curso" },
  ADVERTENCIA: { bar: "#f59e0b", badge: { bg: "#fef9c3", text: "#a16207" }, label: "Advertencia" },
  EN_RIESGO:   { bar: "#ef4444", badge: { bg: "#fee2e2", text: "#dc2626" }, label: "En riesgo" },
  FINALIZADO:  { bar: "#3b82f6", badge: { bg: "#dbeafe", text: "#1d4ed8" }, label: "Finalizado" },
  PROPUESTA:   { bar: "#94a3b8", badge: { bg: "#f1f5f9", text: "#475569" }, label: "Propuesta" },
}

const GANTT_GRADIENT: Record<string, string> = {
  EN_CURSO:    "linear-gradient(90deg, #22c55e, #16a34a)",
  ADVERTENCIA: "linear-gradient(90deg, #fcd34d, #f59e0b)",
  EN_RIESGO:   "linear-gradient(90deg, #f87171, #dc2626)",
  FINALIZADO:  "linear-gradient(90deg, #60a5fa, #2563eb)",
  PROPUESTA:   "linear-gradient(90deg, #cbd5e1, #94a3b8)",
}

// ── Motion variants ────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24 } },
}

// ── AnimatedNumber ─────────────────────────────────────────────────
function AnimatedNumber({ value, currency = false }: { value: number; currency?: boolean }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const start = prevRef.current
    const end   = value
    prevRef.current = value
    if (start === end) return

    const duration = 900
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + eased * (end - start)))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  if (currency) return <>{formatCOP(display)}</>
  return <>{display}</>
}

// ── KPI Card ───────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, accentColor, numColor = "var(--text-primary)", sub, currency, progress, bgTint, onClick }: {
  title: string; value: number; icon: React.ElementType
  accentColor: string; numColor?: string; sub?: string
  currency?: boolean; progress?: number; bgTint?: boolean; onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const displayFontSize = currency && value >= 10_000_000 ? 22 : currency && value >= 1_000_000 ? 26 : currency ? 30 : 40

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: bgTint ? "var(--danger-light)" : "white",
        border: bgTint ? "1px solid rgba(239,68,68,0.2)" : "1px solid var(--card-border)",
        borderRadius: "var(--radius-lg)",
        padding: 20,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        boxShadow: hovered
          ? "var(--card-shadow-hover)"
          : "var(--card-shadow)",
        transition: "box-shadow 0.18s ease",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      {/* Icon circle */}
      <div style={{
        position: "absolute", top: 18, right: 18,
        width: 38, height: 38, borderRadius: "50%",
        background: `${accentColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} color={accentColor} />
      </div>

      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--text-muted)",
        marginBottom: 10, paddingRight: 48,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {title}
      </p>

      <p style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: displayFontSize,
        color: numColor,
        lineHeight: 1.05,
        fontVariantNumeric: "tabular-nums",
      }}>
        <AnimatedNumber value={value} currency={currency} />
      </p>

      {sub && (
        <p style={{
          fontSize: 11, color: "var(--text-muted)", marginTop: 4,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {sub}
        </p>
      )}

      {progress !== undefined && (
        <div style={{ marginTop: 14, height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            style={{ height: "100%", background: accentColor, borderRadius: 99 }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ── Section Title ──────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 12,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </p>
  )
}

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_COLOR[estado] ?? ESTADO_COLOR.PROPUESTA
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 50,
      fontSize: 11, fontWeight: 600,
      background: cfg.badge.bg, color: cfg.badge.text,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.bar }} />
      {cfg.label}
    </span>
  )
}

// ── Dashboard Header ───────────────────────────────────────────────
function DashboardHeader({ nombre, alertasCriticas, lideres, filterLider, setFilterLider }: {
  nombre: string | null; alertasCriticas: number
  lideres: { id: string; nombre: string }[]; filterLider: string; setFilterLider: (v: string) => void
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
      <div>
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 32, fontWeight: 400,
          color: "var(--text-primary)", margin: 0, lineHeight: 1.1,
        }}>
          {getGreeting()}{nombre ? `, ${nombre.split(" ")[0]}` : ""}
        </h1>
        <p style={{
          fontSize: 14, color: "var(--text-muted)", marginTop: 6,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {formatFecha(new Date())}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {lideres.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "white", border: "1px solid var(--card-border)",
            borderRadius: 10, padding: "7px 14px",
            boxShadow: "var(--card-shadow)",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>Vista:</span>
            <select
              value={filterLider}
              onChange={e => setFilterLider(e.target.value)}
              style={{
                fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                border: "none", background: "transparent", outline: "none",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <option value="">Todos los líderes</option>
              {lideres.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
        )}
        <AnimatePresence>
          {alertasCriticas > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px",
                background: "var(--danger-light)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--danger)", display: "inline-block",
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: "var(--danger)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {alertasCriticas} alerta{alertasCriticas !== 1 ? "s" : ""} crítica{alertasCriticas !== 1 ? "s" : ""}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Facturas Pendientes Card ───────────────────────────────────────
function FacturasPendientesCard({ facturas, total, onNavigate }: {
  facturas: Factura[]; total: number; onNavigate: () => void
}) {
  if (facturas.length === 0) {
    return (
      <div style={{
        background: "white", border: "1px solid var(--card-border)",
        borderRadius: "var(--radius-lg)", padding: "24px 20px",
        textAlign: "center", boxShadow: "var(--card-shadow)",
      }}>
        <CheckCircle2 size={24} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
          Sin facturas pendientes
        </p>
      </div>
    )
  }
  return (
    <div style={{
      background: "white", border: "1px solid var(--card-border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      boxShadow: "var(--card-shadow)",
    }}>
      {facturas.map((f, i) => (
        <div key={f.id} style={{
          padding: "10px 20px",
          borderBottom: i < facturas.length - 1 ? "1px solid var(--card-border)" : "none",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              #{f.numero}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              {f.proyecto?.nombre ?? "—"} · {hace(f.fechaEmision)}
            </p>
          </div>
          <p style={{
            fontSize: 13, fontWeight: 700, color: "var(--warning)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {formatCOP(Number(f.monto))}
          </p>
        </div>
      ))}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid var(--card-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--content-bg)",
      }}>
        <span style={{
          fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
          fontFamily: "'Instrument Serif', Georgia, serif",
        }}>
          {formatCOP(total)}
        </span>
        <button
          onClick={onNavigate}
          className="btn-primary"
          style={{ padding: "6px 14px", fontSize: 12, gap: 4 }}
        >
          Aprobar <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Mini Gantt ─────────────────────────────────────────────────────
function MiniGantt({ proyectos, onNavigate }: { proyectos: Proyecto[]; onNavigate: (p: string) => void }) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const now    = new Date(); now.setHours(0, 0, 0, 0)
  const rStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const rEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  const totalMs  = rEnd.getTime() - rStart.getTime()
  const toPct    = (d: Date) => Math.max(0, Math.min(100, (d.getTime() - rStart.getTime()) / totalMs * 100))
  const todayPct = toPct(now)

  const months: { label: string; pct: number }[] = []
  const mc = new Date(rStart.getFullYear(), rStart.getMonth(), 1)
  while (mc <= rEnd) {
    months.push({ label: mc.toLocaleDateString("es-CO", { month: "long", year: "2-digit" }), pct: toPct(mc) })
    mc.setMonth(mc.getMonth() + 1)
  }

  const visible = proyectos.filter(p =>
    new Date(p.fechaFin).getTime() >= rStart.getTime() &&
    new Date(p.fechaInicio).getTime() <= rEnd.getTime()
  )

  return (
    <div style={{
      background: "white", border: "1px solid var(--card-border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      boxShadow: "var(--card-shadow)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: "1px solid var(--card-border)",
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
          Proyectos — vista mensual
        </p>
        <button
          onClick={() => onNavigate("/cronograma")}
          style={{
            fontSize: 12, color: "var(--primary)", background: "none",
            border: "none", cursor: "pointer", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Ver cronograma completo <ChevronRight size={13} />
        </button>
      </div>

      {visible.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Sin proyectos en este período
        </div>
      ) : (
        <div className="gantt-scroll" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 600 }}>
            {/* Month row */}
            <div style={{ display: "flex", background: "var(--content-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <div style={{ width: 200, flexShrink: 0, padding: "8px 16px", borderRight: "1px solid var(--card-border)" }} />
              <div style={{ flex: 1, position: "relative", height: 36 }}>
                {months.map((m, i) => (
                  <span key={i} style={{
                    position: "absolute", left: `${m.pct}%`,
                    top: "50%", transform: "translate(-50%, -50%)",
                    fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                    textTransform: "capitalize", whiteSpace: "nowrap",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {m.label}
                  </span>
                ))}
                {todayPct > 0 && todayPct < 100 && (
                  <div style={{
                    position: "absolute", left: `${todayPct}%`,
                    top: 4, transform: "translateX(-50%)",
                  }}>
                    <span style={{
                      fontSize: 9, background: "var(--accent)", color: "white",
                      padding: "2px 6px", borderRadius: 4, fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      boxShadow: "0 2px 6px rgba(249,115,22,0.4)",
                    }}>
                      HOY
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Project rows */}
            {visible.map((p, idx) => {
              const barLeft  = toPct(new Date(p.fechaInicio))
              const barRight = toPct(new Date(p.fechaFin))
              const barWidth = Math.max(0.8, barRight - barLeft)
              const bKey     = p.etapa === "PROPUESTA" ? "PROPUESTA" : p.estado
              const gradient = GANTT_GRADIENT[bKey] ?? GANTT_GRADIENT.PROPUESTA
              const isHovered = hoveredRow === p.id
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex", height: 52,
                    borderBottom: idx < visible.length - 1 ? "1px solid var(--card-border)" : "none",
                    background: isHovered ? "rgba(22,163,74,0.03)" : idx % 2 === 0 ? "white" : "#fafbff",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div
                    style={{
                      width: 200, flexShrink: 0, padding: "0 16px",
                      borderRight: "1px solid var(--card-border)",
                      display: "flex", alignItems: "center", cursor: "pointer",
                    }}
                    onClick={() => onNavigate(`/projects/${p.id}`)}
                  >
                    <p style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {p.nombre}
                    </p>
                  </div>
                  <div style={{ flex: 1, position: "relative" }}>
                    {/* Today line */}
                    {todayPct > 0 && todayPct < 100 && (
                      <div style={{
                        position: "absolute", left: `${todayPct}%`,
                        top: 0, bottom: 0,
                        borderLeft: "2px dashed var(--accent)",
                        opacity: 0.6, zIndex: 2,
                      }} />
                    )}
                    {/* Bar */}
                    <div style={{
                      position: "absolute",
                      left: `${barLeft}%`, width: `${barWidth}%`,
                      height: 32, top: "50%", transform: "translateY(-50%)",
                      background: gradient, borderRadius: 20, zIndex: 1,
                      boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.08)",
                      transition: "box-shadow 0.15s",
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Próximos Vencimientos ──────────────────────────────────────────
function ProximosVencimientos({ entregables, reuniones, onNavigate }: {
  entregables: EntregableProximo[]; reuniones: ReunionProxima[]
  onNavigate: (p: string) => void
}) {
  const ents  = entregables.slice(0, 4)
  const reuns = reuniones.slice(0, 4)

  return (
    <div style={{
      background: "white", border: "1px solid var(--card-border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      boxShadow: "var(--card-shadow)",
    }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
          Próximos vencimientos
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Entregables */}
        <div style={{ borderRight: "1px solid var(--card-border)", padding: "16px 20px" }}>
          <SectionTitle>Entregables</SectionTitle>
          {ents.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin entregables próximos</p>
          ) : ents.map((e, i) => {
            const label = enDias(e.fechaEntrega)
            const isUrgent = label === "hoy" || label === "mañana"
            return (
              <div
                key={e.id}
                onClick={() => onNavigate(`/projects/${e.proyecto.id}`)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  paddingBottom: i < ents.length - 1 ? 10 : 0,
                  marginBottom: i < ents.length - 1 ? 10 : 0,
                  borderBottom: i < ents.length - 1 ? "1px solid var(--card-border)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {e.nombre}
                  </p>
                  <span style={{
                    fontSize: 10, padding: "1px 7px", borderRadius: 99,
                    background: "var(--primary-light)", color: "var(--primary-dark)",
                    fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {e.proyecto.nombre}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  color: isUrgent ? "var(--danger)" : "var(--info)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Reuniones */}
        <div style={{ padding: "16px 20px" }}>
          <SectionTitle>Reuniones</SectionTitle>
          {reuns.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin reuniones programadas</p>
          ) : reuns.map((r, i) => (
            <div
              key={r.id}
              onClick={() => onNavigate(`/projects/${r.proyecto.id}`)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                paddingBottom: i < reuns.length - 1 ? 10 : 0,
                marginBottom: i < reuns.length - 1 ? 10 : 0,
                borderBottom: i < reuns.length - 1 ? "1px solid var(--card-border)" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {new Date(r.proximaReunion).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <p style={{
                  fontSize: 11, color: "var(--text-muted)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {r.proyecto.nombre}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#6366f1", flexShrink: 0,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {enDias(r.proximaReunion)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const rol    = getRolFromToken()
  const nombre = getNameFromToken()
  const mostrarFinanciero = rol === "ADMIN" || rol === "ADMINISTRATIVO"

  const [data,             setData]             = useState<DashboardData | null>(null)
  const [proyectos,        setProyectos]        = useState<Proyecto[]>([])
  const [compromisos,      setCompromisos]      = useState<Compromiso[]>([])
  const [facturas,         setFacturas]         = useState<Factura[]>([])
  const [entregablesProx,  setEntregablesProx]  = useState<EntregableProximo[]>([])
  const [reunionesProx,    setReunionesProx]    = useState<ReunionProxima[]>([])
  const [alertasCriticas,  setAlertasCriticas]  = useState(0)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState<string | null>(null)
  const [filterLider,      setFilterLider]      = useState("")

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const base = await Promise.all([
        api.get("/dashboard"),
        api.get("/proyectos"),
        api.get("/alertas").catch(() => ({ data: [] })),
        api.get("/entregables/proximos").catch(() => ({ data: [] })),
        api.get("/reuniones/proximas").catch(() => ({ data: [] })),
      ])
      setData(base[0].data)
      setProyectos(base[1].data)
      setAlertasCriticas((base[2].data as any[]).filter((a: any) => a.nivel === "CRITICA").length)
      setEntregablesProx(base[3].data)
      setReunionesProx(base[4].data)

      if (mostrarFinanciero) {
        const extra = await Promise.all([
          api.get("/compromisos").catch(() => ({ data: [] })),
          api.get("/facturas").catch(() => ({ data: [] })),
        ])
        setCompromisos(extra[0].data)
        setFacturas(extra[1].data)
      }
    } catch {
      setError("Error al cargar datos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Loading ──
  if (loading) return (
    <div style={{
      height: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: "3px solid var(--card-border)",
        borderTopColor: "var(--primary)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
        Cargando dashboard…
      </p>
    </div>
  )

  // ── Error ──
  if (error || !data) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 16,
    }}>
      <p style={{ color: "var(--danger)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
        {error ?? "Error inesperado."}
      </p>
      <button onClick={loadData} className="btn-primary">Reintentar</button>
    </div>
  )

  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Derived data
  const lideres            = Array.from(new Map(proyectos.map(p => [p.lider.id, p.lider])).values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  const proyectosFiltrados = filterLider ? proyectos.filter(p => p.lider.id === filterLider) : proyectos
  const recentProyectos    = [...proyectosFiltrados].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  const proyectoMap        = new Map(proyectos.map(p => [p.id, p]))

  const compVencidos = compromisos
    .filter(c => c.estado === "PENDIENTE" && new Date(c.fechaActual) < today)
    .sort((a, b) => new Date(a.fechaActual).getTime() - new Date(b.fechaActual).getTime())
    .slice(0, 12)

  const montoPendienteTotal = facturas
    .filter(f => f.estado === "PENDIENTE" || f.estado === "APROBADA")
    .reduce((s, f) => s + Number(f.monto), 0)

  const factsPendientes = facturas.filter(f => f.estado === "PENDIENTE").slice(0, 6)
  const totalFactsPend  = facturas.filter(f => f.estado === "PENDIENTE").reduce((s, f) => s + Number(f.monto), 0)

  const totalActivos     = proyectos.filter(p => p.estado !== "FINALIZADO").length
  const totalFinalizados = proyectos.filter(p => p.estado === "FINALIZADO").length
  const progresoPct      = proyectos.length > 0 ? (totalFinalizados / proyectos.length) * 100 : 0

  // ── SOCIO ──────────────────────────────────────────────────────
  if (rol === "SOCIO") {
    const socio = data.socio
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ minHeight: "100%" }}>
        <DashboardHeader nombre={nombre} alertasCriticas={alertasCriticas} lideres={lideres} filterLider={filterLider} setFilterLider={setFilterLider} />

        <motion.div variants={containerVariants} initial="initial" animate="animate"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <KpiCard title="Mis Proyectos" value={data.proyectos.total}
            icon={Briefcase} accentColor="#6366f1"
            sub="asignados" onClick={() => navigate("/projects")} />
          <KpiCard title="En Advertencia" value={data.proyectos.advertencia}
            icon={AlertTriangle} accentColor="var(--warning)" numColor="var(--warning)"
            onClick={() => navigate("/projects")} />
          <KpiCard title="En Riesgo" value={data.proyectos.enRiesgo}
            icon={AlertTriangle} accentColor="var(--danger)" numColor="var(--danger)"
            bgTint onClick={() => navigate("/projects")} />
        </motion.div>

        {socio?.misProyectosActivos && socio.misProyectosActivos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle>Mis proyectos activos</SectionTitle>
            <motion.div variants={containerVariants} initial="initial" animate="animate"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {socio.misProyectosActivos.map(p => (
                <motion.div key={p.id} variants={itemVariants}
                  whileHover={{ y: -3, boxShadow: "var(--card-shadow-hover)" }}
                  style={{
                    background: "white", border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-lg)", padding: 16,
                    cursor: "pointer", boxShadow: "var(--card-shadow)",
                  }}
                  onClick={() => navigate(`/projects/${p.id}`)}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                    {p.nombre}
                  </p>
                  <StatusBadge estado={p.estado} />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                    Fin: {new Date(p.fechaFin).toLocaleDateString("es-CO")}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {socio?.misCompromisosVencidos && socio.misCompromisosVencidos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle>Compromisos vencidos</SectionTitle>
            <div style={{
              background: "white", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              boxShadow: "var(--card-shadow)",
            }}>
              {socio.misCompromisosVencidos.map((c, i) => (
                <div key={c.id}
                  onClick={() => navigate(`/projects/${c.proyecto.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", cursor: "pointer",
                    background: "var(--danger-light)",
                    borderBottom: i < socio.misCompromisosVencidos.length - 1 ? "1px solid rgba(239,68,68,0.1)" : "none",
                    borderLeft: "3px solid var(--danger)",
                    transition: "opacity 0.12s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.opacity = "0.85")}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
                      {c.descripcion}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                      {c.proyecto.nombre}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12, color: "var(--danger)", fontWeight: 700, flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    +{diasRetraso(c.fechaActual)}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // ── ADMINISTRATIVO ─────────────────────────────────────────────
  if (rol === "ADMINISTRATIVO") {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ minHeight: "100%" }}>
        <DashboardHeader nombre={nombre} alertasCriticas={alertasCriticas} lideres={[]} filterLider="" setFilterLider={() => {}} />
        <motion.div variants={containerVariants} initial="initial" animate="animate"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <KpiCard title="Total Facturado" value={data.financiero.totalFacturado}
            icon={TrendingUp} accentColor="var(--primary)" numColor="var(--primary-dark)"
            currency sub="cobrado" onClick={() => navigate("/facturacion")} />
          <KpiCard title="Facturas Pendientes" value={data.financiero.facturasPendientes}
            icon={AlertTriangle} accentColor="var(--warning)" numColor="var(--warning)"
            onClick={() => navigate("/facturacion")} />
          <KpiCard title="Por Cobrar" value={data.financiero.montoPorCobrar}
            icon={DollarSign} accentColor="var(--info)" numColor="var(--info)"
            currency sub="aprobado" onClick={() => navigate("/facturacion")} />
          <KpiCard title="Proveedores Activos" value={data.financiero.proveedoresActivos}
            icon={Briefcase} accentColor="#6366f1"
            onClick={() => navigate("/proveedores")} />
        </motion.div>
        <SectionTitle>Facturas pendientes de aprobación</SectionTitle>
        <FacturasPendientesCard facturas={factsPendientes} total={totalFactsPend} onNavigate={() => navigate("/facturacion")} />
      </motion.div>
    )
  }

  // ── ADMIN ──────────────────────────────────────────────────────
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ minHeight: "100%" }}>

      {/* Header */}
      <DashboardHeader nombre={nombre} alertasCriticas={alertasCriticas} lideres={lideres} filterLider={filterLider} setFilterLider={setFilterLider} />

      {/* Row 1: KPIs */}
      <motion.div variants={containerVariants} initial="initial" animate="animate"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        <KpiCard
          title="Proyectos Activos" value={totalActivos}
          icon={Briefcase} accentColor="#6366f1"
          sub={`${totalFinalizados} finalizados de ${proyectos.length}`}
          progress={progresoPct}
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="En Riesgo" value={data.proyectos.enRiesgo}
          icon={AlertTriangle} accentColor="var(--danger)" numColor="var(--danger)"
          sub="requieren atención" bgTint
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="Compromisos Vencidos" value={data.compromisos.vencidos}
          icon={Clock} accentColor="var(--danger)"
          numColor={data.compromisos.vencidos > 0 ? "var(--danger)" : "var(--text-primary)"}
          bgTint={data.compromisos.vencidos > 0}
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="Entregables 7 días" value={data.entregables.proximos7Dias}
          icon={Calendar} accentColor="var(--info)" numColor="var(--info)"
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="Facturación pendiente" value={montoPendienteTotal}
          icon={DollarSign} accentColor="var(--warning)" numColor="var(--warning)"
          currency sub="pendiente + aprobado"
          onClick={() => navigate("/facturacion")}
        />
      </motion.div>

      {/* Row 2: 60/40 */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 24 }}>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          style={{
            background: "white", border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-lg)", overflow: "hidden",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid var(--card-border)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
              Actividad reciente
            </p>
            <span style={{
              fontSize: 12, padding: "2px 10px", borderRadius: 99,
              background: "var(--content-bg)", color: "var(--text-secondary)",
              fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            }}>
              {recentProyectos.length}
            </span>
          </div>
          {recentProyectos.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Sin proyectos
            </div>
          ) : (
            recentProyectos.map((p, i) => {
              const cfg = ESTADO_COLOR[p.estado] ?? ESTADO_COLOR.PROPUESTA
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 0,
                    borderBottom: i < recentProyectos.length - 1 ? "1px solid var(--card-border)" : "none",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(22,163,74,0.03)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "white")}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div style={{
                    width: 3, alignSelf: "stretch",
                    background: cfg.bar, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {p.nombre}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>
                        {p.categoria?.nombre ?? "—"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: avatarBg(p.lider.nombre),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: 10, fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {initials(p.lider.nombre)}
                      </div>
                    </div>
                    <StatusBadge estado={p.estado} />
                    <span style={{
                      fontSize: 11, color: "var(--text-muted)", flexShrink: 0, minWidth: 48, textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {hace(p.createdAt)}
                    </span>
                    <ArrowRight size={13} color="var(--card-border)" style={{ flexShrink: 0 }} />
                  </div>
                </div>
              )
            })
          )}
        </motion.div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Compromisos vencidos */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            style={{
              background: "white", border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              flex: 1, boxShadow: "var(--card-shadow)",
            }}
          >
            <div style={{
              padding: "12px 16px",
              background: compVencidos.length > 0 ? "var(--danger-light)" : "var(--content-bg)",
              borderBottom: "1px solid var(--card-border)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Clock size={14} color={compVencidos.length > 0 ? "var(--danger)" : "var(--text-muted)"} />
              <p style={{
                fontSize: 13, fontWeight: 700,
                color: compVencidos.length > 0 ? "var(--danger)" : "var(--text-primary)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Compromisos vencidos
              </p>
              {compVencidos.length > 0 && (
                <span style={{
                  marginLeft: "auto", fontSize: 11, padding: "1px 8px",
                  borderRadius: 99, background: "var(--danger)",
                  color: "white", fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {compVencidos.length}
                </span>
              )}
            </div>
            {compVencidos.length === 0 ? (
              <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="var(--primary)" />
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
                  Sin compromisos vencidos
                </span>
              </div>
            ) : (
              <div className="comp-scroll" style={{ maxHeight: 200, overflowY: "auto" }}>
                {compVencidos.map((c, i) => {
                  const proy = proyectoMap.get(c.proyectoId)
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: i < compVencidos.length - 1 ? "1px solid rgba(239,68,68,0.08)" : "none",
                        borderLeft: "3px solid var(--danger)",
                        background: "var(--danger-light)",
                        cursor: proy ? "pointer" : "default",
                        display: "flex", alignItems: "flex-start", gap: 10,
                        transition: "opacity 0.12s",
                      }}
                      onMouseEnter={e => { if (proy) (e.currentTarget as HTMLDivElement).style.opacity = "0.8" }}
                      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
                      onClick={() => { if (proy) navigate(`/projects/${proy.id}`) }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 12, color: "var(--text-primary)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {c.descripcion}
                        </p>
                        {proy && (
                          <span style={{
                            fontSize: 10, padding: "1px 6px", borderRadius: 99,
                            background: "rgba(239,68,68,0.12)", color: "var(--danger)",
                            fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                          }}>
                            {proy.nombre}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "var(--danger)", flexShrink: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        +{diasRetraso(c.fechaActual)}d
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Facturas pendientes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{
              background: "white", border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              flex: 1, boxShadow: "var(--card-shadow)",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 16px", borderBottom: "1px solid var(--card-border)",
            }}>
              <DollarSign size={14} color="var(--warning)" />
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
                Facturas pendientes
              </p>
            </div>
            {factsPendientes.length === 0 ? (
              <div style={{ padding: "24px 16px", fontSize: 13, color: "var(--text-muted)", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
                Sin facturas pendientes
              </div>
            ) : (
              <>
                {factsPendientes.map((f, i) => (
                  <div key={f.id} style={{
                    padding: "9px 16px",
                    borderBottom: i < factsPendientes.length - 1 ? "1px solid var(--card-border)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                        #{f.numero}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
                        {f.proyecto?.nombre ?? "—"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatCOP(Number(f.monto))}
                      </p>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {hace(f.fechaEmision)}
                      </p>
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: "10px 16px", borderTop: "1px solid var(--card-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--content-bg)",
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
                    fontFamily: "'Instrument Serif', Georgia, serif",
                  }}>
                    {formatCOP(totalFactsPend)}
                  </span>
                  <button
                    onClick={() => navigate("/facturacion")}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: "5px 12px", gap: 4 }}
                  >
                    Aprobar <ArrowRight size={11} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Row 3: Mini Gantt */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        style={{ marginBottom: 20 }}
      >
        <MiniGantt proyectos={proyectos} onNavigate={(path) => navigate(path)} />
      </motion.div>

      {/* Row 4: Próximos vencimientos */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <ProximosVencimientos
          entregables={entregablesProx}
          reuniones={reunionesProx}
          onNavigate={(path) => navigate(path)}
        />
      </motion.div>

    </motion.div>
  )
}
