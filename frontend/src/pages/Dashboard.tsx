import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Briefcase, AlertTriangle, Clock, Calendar, DollarSign,
  TrendingUp, ArrowRight, CheckCircle2, ChevronRight,
} from "lucide-react"
import { api } from "../services/api"
import { getRolFromToken, getNameFromToken } from "../utils/auth"
import PageHeader from "../components/ui/PageHeader"
import BrandDot from "../components/ui/BrandDot"
import type { ReactNode } from "react"

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
  return colors[name.charCodeAt(0) % colors.length]
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

function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString("es-CO")}`
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
  animate: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

// ── AnimatedNumber ─────────────────────────────────────────────────
function AnimatedNumber({ value, currency = false, format }: {
  value: number
  currency?: boolean
  format?: (n: number) => string
}) {
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

  if (format)   return <>{format(display)}</>
  if (currency) return <>{formatCOP(display)}</>
  return <>{display}</>
}

// ── KPI Card (nuevo estilo minimalista) ────────────────────────────
function KpiCard({ title, value, icon: Icon, sub, currency, compact, progress, redBorder, amberValue, onClick }: {
  title: string
  value: number
  icon: React.ElementType
  sub?: string
  currency?: boolean
  compact?: boolean
  progress?: number
  redBorder?: boolean
  amberValue?: boolean
  onClick?: () => void
}) {
  const showRed   = !!redBorder && value > 0
  const showAmber = !!amberValue && value > 0
  const numColor  = showRed ? "var(--state-red)" : showAmber ? "var(--state-amber)" : "var(--text-primary)"

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="card-surface card-surface-hover flex flex-col"
      style={{
        borderRadius: 14,
        padding: 20,
        minHeight: 140,
        cursor: onClick ? "pointer" : "default",
        borderLeft: showRed ? "2px solid var(--state-red)" : showAmber ? "2px solid var(--state-amber)" : undefined,
        transition: "box-shadow 250ms var(--ease)",
      }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-1.5 mb-3">
        <Icon size={14} className="text-ink-3 flex-shrink-0" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2 leading-none">
          {title}
        </p>
      </div>

      {/* Number */}
      <p className="leading-none" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", color: numColor }}>
        {compact
          ? <AnimatedNumber value={value} format={formatCompact} />
          : currency
          ? <AnimatedNumber value={value} currency />
          : <AnimatedNumber value={value} />
        }
      </p>

      {sub && (
        <p className="text-[12px] text-ink-3 mt-1.5">{sub}</p>
      )}

      {progress !== undefined && (
        <div className="mt-auto pt-3">
          <div className="h-[3px] bg-canvas-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── Panel header helper ────────────────────────────────────────────
function PanelHeader({ label, count, color = "default" }: {
  label: string; count?: number; color?: "default" | "danger"
}) {
  return (
    <div className="flex items-center gap-2 px-5 py-4 border-b border-ui-border">
      <BrandDot color={color === "danger" ? "danger" : "accent"} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-2">
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: color === "danger" ? "var(--state-red)" : "var(--primary)" }}
        >
          {count}
        </span>
      )}
    </div>
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
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.bar }} />
      {cfg.label}
    </span>
  )
}

// ── Dashboard Header (usando PageHeader) ───────────────────────────
function DashboardHeader({ nombre, alertasCriticas, lideres, filterLider, setFilterLider, stats }: {
  nombre: string | null
  alertasCriticas: number
  lideres: { id: string; nombre: string }[]
  filterLider: string
  setFilterLider: (v: string) => void
  stats?: ReactNode
}) {
  return (
    <PageHeader
      eyebrow="Resumen"
      title={`${getGreeting()}${nombre ? `, ${nombre.split(" ")[0]}` : ""}`}
      subtitle={formatFecha(new Date())}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {lideres.length > 0 && (
            <select
              value={filterLider}
              onChange={e => setFilterLider(e.target.value)}
              className="form-input"
              style={{ width: "auto", minWidth: 145, fontSize: 13 }}
            >
              <option value="">Todos los líderes</option>
              {lideres.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          )}
          <AnimatePresence>
            {alertasCriticas > 0 && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-state-red bg-state-red-bg border border-state-red/20 whitespace-nowrap"
              >
                <BrandDot color="danger" pulse />
                {alertasCriticas} alerta{alertasCriticas !== 1 ? "s" : ""} crítica{alertasCriticas !== 1 ? "s" : ""}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    />
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
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin facturas pendientes</p>
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
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
              #{f.numero}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {f.proyecto?.nombre ?? "—"} · {hace(f.fechaEmision)}
            </p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)", fontFamily: "'JetBrains Mono', monospace" }}>
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
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Instrument Serif', Georgia, serif" }}>
          {formatCOP(total)}
        </span>
        <button onClick={onNavigate} className="btn-primary" style={{ padding: "6px 14px", fontSize: 12, gap: 4 }}>
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
    <div className="card-surface overflow-hidden">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--card-border)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Proyectos — vista mensual</p>
        <button
          onClick={() => onNavigate("/cronograma")}
          style={{ fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
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
            <div style={{ display: "flex", background: "var(--content-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <div style={{ width: 200, flexShrink: 0, padding: "8px 16px", borderRight: "1px solid var(--card-border)" }} />
              <div style={{ flex: 1, position: "relative", height: 36 }}>
                {months.map((m, i) => (
                  <span key={i} style={{ position: "absolute", left: `${m.pct}%`, top: "50%", transform: "translate(-50%, -50%)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                    {m.label}
                  </span>
                ))}
                {todayPct > 0 && todayPct < 100 && (
                  <div style={{ position: "absolute", top: 4, left: `${todayPct}%`, transform: "translateX(-50%)" }}>
                    <span style={{ fontSize: 9, background: "var(--accent)", color: "white", padding: "2px 6px", borderRadius: 4, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 2px 6px rgba(249,115,22,0.4)" }}>HOY</span>
                  </div>
                )}
              </div>
            </div>

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
                  style={{ display: "flex", height: 52, borderBottom: idx < visible.length - 1 ? "1px solid var(--card-border)" : "none", background: isHovered ? "rgba(22,163,74,0.03)" : idx % 2 === 0 ? "white" : "#fafbff", transition: "background 0.12s" }}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div style={{ width: 200, flexShrink: 0, padding: "0 16px", borderRight: "1px solid var(--card-border)", display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => onNavigate(`/projects/${p.id}`)}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                  </div>
                  <div style={{ flex: 1, position: "relative" }}>
                    {todayPct > 0 && todayPct < 100 && (
                      <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, borderLeft: "2px dashed var(--accent)", opacity: 0.6, zIndex: 2 }} />
                    )}
                    <div style={{ position: "absolute", left: `${barLeft}%`, width: `${barWidth}%`, height: 32, top: "50%", transform: "translateY(-50%)", background: gradient, borderRadius: 20, zIndex: 1, boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.08)", transition: "box-shadow 0.15s" }} />
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
    <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Próximos vencimientos</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ borderRight: "1px solid var(--card-border)", padding: "16px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>Entregables</p>
          {ents.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin entregables próximos</p>
          ) : ents.map((e, i) => {
            const label = enDias(e.fechaEntrega)
            const isUrgent = label === "hoy" || label === "mañana"
            return (
              <div key={e.id} onClick={() => onNavigate(`/projects/${e.proyecto.id}`)} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: i < ents.length - 1 ? 10 : 0, marginBottom: i < ents.length - 1 ? 10 : 0, borderBottom: i < ents.length - 1 ? "1px solid var(--card-border)" : "none", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nombre}</p>
                  <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: "var(--primary-light)", color: "var(--primary-dark)", fontWeight: 600 }}>{e.proyecto.nombre}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: isUrgent ? "var(--danger)" : "var(--info)", fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
              </div>
            )
          })}
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>Reuniones</p>
          {reuns.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin reuniones programadas</p>
          ) : reuns.map((r, i) => (
            <div key={r.id} onClick={() => onNavigate(`/projects/${r.proyecto.id}`)} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: i < reuns.length - 1 ? 10 : 0, marginBottom: i < reuns.length - 1 ? 10 : 0, borderBottom: i < reuns.length - 1 ? "1px solid var(--card-border)" : "none", cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(r.proximaReunion).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.proyecto.nombre}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{enDias(r.proximaReunion)}</span>
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
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <DashboardHeader
        nombre={nombre}
        alertasCriticas={0}
        lideres={[]}
        filterLider=""
        setFilterLider={() => {}}
        stats={<span className="text-ink-3">Cargando datos…</span>}
      />
      <div className="flex items-center justify-center h-40 gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-ui-border border-t-primary animate-spin" />
        <p className="text-[13px] text-ink-3">Cargando dashboard…</p>
      </div>
    </motion.div>
  )

  // ── Error ──
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-sm text-state-red font-medium">{error ?? "Error inesperado."}</p>
      <button onClick={loadData} className="btn-primary">Reintentar</button>
    </div>
  )

  const today = new Date(); today.setHours(0, 0, 0, 0)

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
      <motion.div variants={pageVariants} initial="initial" animate="animate">
        <DashboardHeader
          nombre={nombre}
          alertasCriticas={alertasCriticas}
          lideres={[]}
          filterLider=""
          setFilterLider={() => {}}
          stats={
            <>
              <span><strong className="text-ink font-semibold">{data.proyectos.total}</strong> proyectos</span>
              <span className="text-ink-4">·</span>
              <span><strong className="text-state-amber font-semibold">{data.proyectos.advertencia}</strong> en advertencia</span>
              <span className="text-ink-4">·</span>
              <span><strong className="text-state-red font-semibold">{data.proyectos.enRiesgo}</strong> en riesgo</span>
            </>
          }
        />

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          <KpiCard title="Mis Proyectos" value={data.proyectos.total} icon={Briefcase} sub="asignados" onClick={() => navigate("/projects")} />
          <KpiCard title="En Advertencia" value={data.proyectos.advertencia} icon={AlertTriangle} amberValue onClick={() => navigate("/projects")} />
          <KpiCard title="En Riesgo" value={data.proyectos.enRiesgo} icon={AlertTriangle} redBorder onClick={() => navigate("/projects")} />
        </motion.div>

        {socio?.misProyectosActivos && socio.misProyectosActivos.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-3 mb-3">Mis proyectos activos</p>
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {socio.misProyectosActivos.map(p => (
                <motion.div key={p.id} variants={itemVariants} whileHover={{ y: -2 }} className="card-surface card-surface-hover p-4 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <p className="text-[14px] font-semibold text-ink mb-2">{p.nombre}</p>
                  <StatusBadge estado={p.estado} />
                  <p className="text-[11px] text-ink-3 mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Fin: {new Date(p.fechaFin).toLocaleDateString("es-CO")}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {socio?.misCompromisosVencidos && socio.misCompromisosVencidos.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-3 mb-3">Compromisos vencidos</p>
            <div className="card-surface overflow-hidden" style={{ borderLeft: "2px solid var(--state-red)" }}>
              {socio.misCompromisosVencidos.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/projects/${c.proyecto.id}`)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-state-red-bg transition-colors duration-100"
                  style={{ borderBottom: i < socio.misCompromisosVencidos.length - 1 ? "1px solid rgba(220,38,38,0.08)" : "none" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink truncate">{c.descripcion}</p>
                    <p className="text-[11px] text-ink-3">{c.proyecto.nombre}</p>
                  </div>
                  <span className="text-[12px] font-bold text-state-red flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
      <motion.div variants={pageVariants} initial="initial" animate="animate">
        <DashboardHeader
          nombre={nombre}
          alertasCriticas={alertasCriticas}
          lideres={[]}
          filterLider=""
          setFilterLider={() => {}}
          stats={
            <>
              <span><strong className="text-ink font-semibold">{formatCompact(data.financiero.totalFacturado)}</strong> facturado</span>
              <span className="text-ink-4">·</span>
              <span><strong className="text-state-amber font-semibold">{data.financiero.facturasPendientes}</strong> facturas pendientes</span>
              <span className="text-ink-4">·</span>
              <span><strong className="text-ink font-semibold">{data.financiero.proveedoresActivos}</strong> proveedores</span>
            </>
          }
        />
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard title="Total Facturado" value={data.financiero.totalFacturado} icon={TrendingUp} compact sub="cobrado" onClick={() => navigate("/facturacion")} />
          <KpiCard title="Facturas Pendientes" value={data.financiero.facturasPendientes} icon={AlertTriangle} amberValue onClick={() => navigate("/facturacion")} />
          <KpiCard title="Por Cobrar" value={data.financiero.montoPorCobrar} icon={DollarSign} compact sub="aprobado" onClick={() => navigate("/facturacion")} />
          <KpiCard title="Proveedores Activos" value={data.financiero.proveedoresActivos} icon={Briefcase} onClick={() => navigate("/proveedores")} />
        </motion.div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-3 mb-3">Facturas pendientes de aprobación</p>
        <FacturasPendientesCard facturas={factsPendientes} total={totalFactsPend} onNavigate={() => navigate("/facturacion")} />
      </motion.div>
    )
  }

  // ── ADMIN ──────────────────────────────────────────────────────
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">

      <DashboardHeader
        nombre={nombre}
        alertasCriticas={alertasCriticas}
        lideres={lideres}
        filterLider={filterLider}
        setFilterLider={setFilterLider}
        stats={
          <>
            <span><strong className="text-ink font-semibold">{totalActivos}</strong> activos</span>
            <span className="text-ink-4">·</span>
            <span><strong className="text-state-red font-semibold">{data.proyectos.enRiesgo}</strong> en riesgo</span>
            <span className="text-ink-4">·</span>
            <span><strong className="text-state-red font-semibold">{data.compromisos.vencidos}</strong> compromisos vencidos</span>
            {mostrarFinanciero && (
              <>
                <span className="text-ink-4">·</span>
                <span><strong className="text-state-amber font-semibold">{formatCompact(montoPendienteTotal)}</strong> pendiente</span>
              </>
            )}
          </>
        }
      />

      {/* Row 1: 5 KPIs */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid gap-4 mb-7" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <KpiCard
          title="Proyectos Activos" value={totalActivos}
          icon={Briefcase}
          sub={`${totalFinalizados} finalizados de ${proyectos.length}`}
          progress={progresoPct}
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="En Riesgo" value={data.proyectos.enRiesgo}
          icon={AlertTriangle} redBorder
          sub="Requieren atención inmediata"
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="Compromisos Vencidos" value={data.compromisos.vencidos}
          icon={Clock} redBorder
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="Entregables 7 días" value={data.entregables.proximos7Dias}
          icon={Calendar} amberValue
          sub="Próximos a vencer"
          onClick={() => navigate("/projects")}
        />
        <KpiCard
          title="Facturación pendiente" value={montoPendienteTotal}
          icon={DollarSign} compact amberValue
          sub="Pendiente + aprobado"
          onClick={() => navigate("/facturacion")}
        />
      </motion.div>

      {/* Row 2: Activity 60% + Right panel 40% */}
      <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: "3fr 2fr" }}>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="card-surface overflow-hidden"
        >
          <PanelHeader label="Actividad reciente" count={recentProyectos.length} />
          {recentProyectos.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-[13px] text-ink-3">Sin proyectos</div>
          ) : (
            recentProyectos.map((p, i) => {
              const cfg = ESTADO_COLOR[p.estado] ?? ESTADO_COLOR.PROPUESTA
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-0 cursor-pointer hover:bg-canvas-2 transition-colors duration-100"
                  style={{ borderBottom: i < recentProyectos.length - 1 ? "1px solid var(--card-border)" : "none" }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div style={{ width: 3, alignSelf: "stretch", background: cfg.bar, flexShrink: 0 }} />
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{p.nombre}</p>
                      <p className="text-[11px] text-ink-3 mt-0.5">{p.categoria?.nombre ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: avatarBg(p.lider.nombre), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700 }}>
                        {initials(p.lider.nombre)}
                      </div>
                    </div>
                    <StatusBadge estado={p.estado} />
                    <span className="text-[11px] text-ink-3 flex-shrink-0 min-w-[40px] text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {hace(p.createdAt)}
                    </span>
                    <ArrowRight size={13} className="text-ink-4 flex-shrink-0" />
                  </div>
                </div>
              )
            })
          )}
          {recentProyectos.length > 0 && (
            <div className="px-5 py-3 border-t border-ui-border">
              <button onClick={() => navigate("/projects")} className="text-[12px] text-accent font-semibold flex items-center gap-1">
                Ver todos <ArrowRight size={11} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Compromisos vencidos */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            className="card-surface overflow-hidden flex-1"
            style={{ borderLeft: compVencidos.length > 0 ? "2px solid var(--state-red)" : undefined }}
          >
            <PanelHeader label="Compromisos vencidos" count={compVencidos.length} color="danger" />
            {compVencidos.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-5">
                <CheckCircle2 size={16} className="text-primary" />
                <span className="text-[13px] text-ink-2">Todo al día</span>
              </div>
            ) : (
              <div className="comp-scroll" style={{ maxHeight: 200, overflowY: "auto" }}>
                {compVencidos.map((c, i) => {
                  const proy = proyectoMap.get(c.proyectoId)
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-state-red-bg transition-colors duration-100"
                      style={{ borderBottom: i < compVencidos.length - 1 ? "1px solid rgba(220,38,38,0.08)" : "none" }}
                      onClick={() => { if (proy) navigate(`/projects/${proy.id}`) }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-ink truncate">{c.descripcion}</p>
                        {proy && <p className="text-[10px] text-state-red font-semibold mt-0.5">{proy.nombre}</p>}
                      </div>
                      <span className="text-[11px] font-bold text-state-red flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
            className="card-surface overflow-hidden flex-1"
          >
            <PanelHeader label="Facturas pendientes" />
            {factsPendientes.length === 0 ? (
              <div className="px-5 py-5 text-[13px] text-ink-3 text-center">Sin facturas pendientes</div>
            ) : (
              <>
                {factsPendientes.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: i < factsPendientes.length - 1 ? "1px solid var(--card-border)" : "none" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{f.numero}</p>
                      <p className="text-[11px] text-ink-3 truncate">{f.proyecto?.nombre ?? "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[12px] font-bold text-state-amber" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCOP(Number(f.monto))}</p>
                      <p className="text-[10px] text-ink-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{hace(f.fechaEmision)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 border-t border-ui-border bg-canvas">
                  <span className="text-[13px] font-bold text-ink" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{formatCOP(totalFactsPend)}</span>
                  <button onClick={() => navigate("/facturacion")} className="btn-primary" style={{ fontSize: 12, padding: "5px 12px", gap: 4 }}>
                    Aprobar <ArrowRight size={11} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Row 3: Mini Gantt */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }} className="mb-5">
        <MiniGantt proyectos={proyectos} onNavigate={(path) => navigate(path)} />
      </motion.div>

      {/* Row 4: Próximos vencimientos */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
        <ProximosVencimientos entregables={entregablesProx} reuniones={reunionesProx} onNavigate={(path) => navigate(path)} />
      </motion.div>

    </motion.div>
  )
}
