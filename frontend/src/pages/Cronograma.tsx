import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { api } from "../services/api"
import { Clock, AlertCircle, TrendingUp, ChevronLeft, ChevronRight, BarChart3, CalendarDays } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────
type PageView       = "gantt" | "calendario"
type EstadoProyecto = "EN_CURSO" | "ADVERTENCIA" | "EN_RIESGO" | "FINALIZADO"
type EtapaProyecto  = "PROPUESTA" | "KICK_OFF" | "EN_EJECUCION" | "CIERRE"
type CronogramaView = "month" | "quarter" | "year" | "all"

interface Entregable {
  id: string
  nombre: string
  fechaEntrega: string
  estado: string
}

interface ProyectoGantt {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: EstadoProyecto
  etapa: EtapaProyecto
  lider: { id: string; nombre: string }
  categoria: { id: string; nombre: string }
  entregables: Entregable[]
}

// ── Design tokens ────────────────────────────────────────────────
const SIDEBAR_W = 200
const ROW_H     = 52
const SVG_VW    = 10000

const BAR_COLOR: Record<string, string> = {
  EN_CURSO:    "#3b82f6",
  ADVERTENCIA: "#f59e0b",
  EN_RIESGO:   "#ef4444",
  FINALIZADO:  "#10b981",
  PROPUESTA:   "#94a3b8",
}

const BADGE: Record<string, { bg: string; color: string }> = {
  EN_CURSO:    { bg: "#dbeafe", color: "#1d4ed8" },
  ADVERTENCIA: { bg: "#fef9c3", color: "#a16207" },
  EN_RIESGO:   { bg: "#fee2e2", color: "#dc2626" },
  FINALIZADO:  { bg: "#dcfce7", color: "#15803d" },
  PROPUESTA:   { bg: "#f1f5f9", color: "#475569" },
}

const BADGE_LABEL: Record<string, string> = {
  EN_CURSO:    "En curso",
  ADVERTENCIA: "Advertencia",
  EN_RIESGO:   "En riesgo",
  FINALIZADO:  "Finalizado",
  PROPUESTA:   "Propuesta",
}

const ETAPA_LABEL: Record<string, string> = {
  PROPUESTA:    "Propuesta",
  KICK_OFF:     "Kick-off",
  EN_EJECUCION: "Ejecución",
  CIERRE:       "Cierre",
}

const ETAPA_COLOR: Record<string, string> = {
  PROPUESTA:    "#94a3b8",
  KICK_OFF:     "#3b82f6",
  EN_EJECUCION: "#10b981",
  CIERRE:       "#f59e0b",
}

const ENT_COLOR: Record<string, string> = {
  COMPLETADO:  "#22c55e",
  PENDIENTE:   "#9ca3af",
  ADVERTENCIA: "#f59e0b",
  URGENTE:     "#f59e0b",
  VENCIDO:     "#ef4444",
}

const ENT_LABEL: Record<string, string> = {
  COMPLETADO:  "Completado",
  PENDIENTE:   "Pendiente",
  ADVERTENCIA: "Advertencia",
  URGENTE:     "Urgente",
  VENCIDO:     "Vencido",
}

const VIEW_LABELS: Record<CronogramaView, string> = {
  month:   "Mes",
  quarter: "Trimestre",
  year:    "Año",
  all:     "Todo",
}

// ── Tooltip type ─────────────────────────────────────────────────
type Tooltip =
  | {
      kind: "bar"
      nombre: string; lider: string; inicio: string; fin: string
      estadoLabel: string; numEntregables: number
      diasRestantes: number; pctAvance: number
      x: number; y: number
    }
  | { kind: "marker"; nombre: string; fecha: string; estadoLabel: string; x: number; y: number }
  | null

// ── Helpers ──────────────────────────────────────────────────────
function badgeKey(p: ProyectoGantt): string {
  return p.etapa === "PROPUESTA" ? "PROPUESTA" : p.estado
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function avatarBg(name: string): string {
  const first = name.split(" ")[0].toLowerCase()
  if (first === "esteban") return "#6366f1"
  if (first === "luis")    return "#0ea5e9"
  if (first === "john" || first === "jhon") return "#10b981"
  return "#f59e0b"
}

const KEYFRAMES = `
  @keyframes spin-loader {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes today-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(249,115,22,0.5); }
    50%       { opacity: 0.85; box-shadow: 0 0 0 5px rgba(249,115,22,0); }
  }
`

// ── Main component ────────────────────────────────────────────────
export default function Cronograma() {
  const navigate = useNavigate()

  const [proyectos,   setProyectos]   = useState<ProyectoGantt[]>([])
  const [categorias,  setCategorias]  = useState<{ id: string; nombre: string }[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tooltip,     setTooltip]     = useState<Tooltip>(null)
  const [view,        setView]        = useState<CronogramaView>("month")
  const [pageView,    setPageView]    = useState<PageView>("gantt")

  const [filterLider,     setFilterLider]     = useState("")
  const [filterEstado,    setFilterEstado]    = useState("")
  const [filterCategoria, setFilterCategoria] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          api.get("/proyectos"),
          api.get("/categorias"),
        ])
        const conEntregables: ProyectoGantt[] = await Promise.all(
          (pRes.data as any[]).map(async (p) => {
            try {
              const eRes = await api.get(`/entregables/proyecto/${p.id}`)
              return { ...p, entregables: eRes.data }
            } catch {
              return { ...p, entregables: [] }
            }
          })
        )
        setProyectos(conEntregables)
        setCategorias((cRes.data as any[]).filter(c => c.activa))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const lideres = Array.from(
    new Map(proyectos.map(p => [p.lider.id, p.lider])).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre))

  const filtrados = proyectos.filter(p => {
    if (filterLider     && p.lider.id      !== filterLider)     return false
    if (filterEstado    && p.estado        !== filterEstado)    return false
    if (filterCategoria && p.categoria?.id !== filterCategoria) return false
    return true
  })

  // ── Timeline math ─────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0)

  let rStart: Date
  let rEnd: Date

  switch (view) {
    case "month":
      rStart = new Date(today.getFullYear(), today.getMonth(), 1)
      rEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      break
    case "quarter": {
      const q = Math.floor(today.getMonth() / 3)
      rStart  = new Date(today.getFullYear(), q * 3, 1)
      rEnd    = new Date(today.getFullYear(), q * 3 + 3, 0)
      break
    }
    case "year":
      rStart = new Date(today.getFullYear(), 0, 1)
      rEnd   = new Date(today.getFullYear(), 11, 31)
      break
    case "all":
    default: {
      const allDates = filtrados.flatMap(p => [new Date(p.fechaInicio).getTime(), new Date(p.fechaFin).getTime()])
      rStart = allDates.length ? new Date(Math.min(...allDates)) : new Date(today.getFullYear(), 0, 1)
      rEnd   = allDates.length ? new Date(Math.max(...allDates)) : new Date(today.getFullYear(), 11, 31)
      rStart = new Date(rStart.getTime() - 14 * 864e5)
      rEnd   = new Date(rEnd.getTime()   + 14 * 864e5)
      break
    }
  }

  const totalMs = rEnd.getTime() - rStart.getTime()
  const toPct   = (d: Date) => Math.max(0, Math.min(100, (d.getTime() - rStart.getTime()) / totalMs * 100))

  // ── Month header ticks ────────────────────────────────────────
  const months: { label: string; pct: number }[] = []
  const mc = new Date(rStart.getFullYear(), rStart.getMonth(), 1)
  while (mc <= rEnd) {
    months.push({
      label: mc.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }).toUpperCase(),
      pct: toPct(mc),
    })
    mc.setMonth(mc.getMonth() + 1)
  }

  // ── Sub-header day ticks (month view) ─────────────────────────
  const days: { label: string; pct: number; isWeekend: boolean }[] = []
  if (view === "month") {
    const dc = new Date(rStart)
    while (dc <= rEnd) {
      const day = dc.getDay()
      days.push({ label: String(dc.getDate()), pct: toPct(new Date(dc)), isWeekend: day === 0 || day === 6 })
      dc.setDate(dc.getDate() + 1)
    }
  }

  // ── Sub-header week ticks (quarter view) ──────────────────────
  const subWeeks: { label: string; pct: number }[] = []
  if (view === "quarter") {
    const wc2 = new Date(rStart)
    const dow2 = wc2.getDay()
    wc2.setDate(wc2.getDate() + (8 - dow2) % 7) // advance to first Monday
    while (wc2 <= rEnd) {
      subWeeks.push({ label: `${wc2.getDate()}/${wc2.getMonth() + 1}`, pct: toPct(new Date(wc2)) })
      wc2.setDate(wc2.getDate() + 7)
    }
  }

  // ── Week grid lines ───────────────────────────────────────────
  const weeks: number[] = []
  const wc = new Date(rStart)
  const wd = wc.getDay(); wc.setDate(wc.getDate() + (wd === 0 ? 1 : (8 - wd) % 7 || 7))
  while (wc <= rEnd) { weeks.push(toPct(wc)); wc.setDate(wc.getDate() + 7) }

  const todayPct = toPct(today)

  // ── Dependency detection ──────────────────────────────────────
  const deps: { from: number; to: number }[] = []
  for (let i = 0; i < filtrados.length; i++) {
    for (let j = 0; j < filtrados.length; j++) {
      if (i === j) continue
      const finA = new Date(filtrados[i].fechaFin);  finA.setHours(0, 0, 0, 0)
      const iniB = new Date(filtrados[j].fechaInicio); iniB.setHours(0, 0, 0, 0)
      if (finA.getTime() === iniB.getTime()) deps.push({ from: i, to: j })
    }
  }

  // ── Footer stats ──────────────────────────────────────────────
  const in7d         = new Date(today.getTime() + 7 * 864e5)
  const allEnts      = proyectos.flatMap(p => p.entregables)
  const statEnCurso  = proyectos.filter(p => p.estado === "EN_CURSO").length
  const statProximos = allEnts.filter(e => e.estado !== "COMPLETADO" && new Date(e.fechaEntrega) >= today && new Date(e.fechaEntrega) <= in7d).length
  const statVencidos = allEnts.filter(e => e.estado === "VENCIDO").length

  const hideTooltip = () => setTooltip(null)
  const hasFilters  = !!(filterLider || filterEstado || filterCategoria)

  if (loading) {
    return (
      <div style={{ height: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{KEYFRAMES}</style>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid #e2e8f0", borderTopColor: "#f97316",
          animation: "spin-loader 0.8s linear infinite",
        }} />
      </div>
    )
  }

  return (
    <div style={{ margin: "-24px -28px", background: "#f8fafc", minHeight: "100vh" }}>
      <style>{KEYFRAMES}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ padding: "28px 36px 0" }}>
        {/* Editorial header */}
        <div className="flex items-end justify-between mb-6 pb-6 border-b border-ui-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block flex-shrink-0" />
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-3">Planificación</span>
            </div>
            <h1 className="font-serif text-[36px] font-normal text-ink leading-[1.05] mb-2">Cronograma</h1>
            <p className="text-[15px] text-ink-2 max-w-xl mb-4">Vista temporal de proyectos y entregables.</p>
            <div className="flex items-center gap-4 text-[13px] text-ink-3 flex-wrap">
              <span><strong className="text-ink font-semibold">{proyectos.length}</strong> proyectos</span>
              <span className="text-ink-4">·</span>
              <span><strong className="text-ink font-semibold">{proyectos.flatMap(p => p.entregables).length}</strong> entregables</span>
            </div>
          </div>
          {/* Segmented view toggle */}
          <div className="flex-shrink-0 ml-6 flex items-center gap-2">
            <div className="flex items-center bg-canvas-2 p-[3px] rounded-[10px]">
              {([
                { value: "gantt"      as PageView, label: "Gantt",      icon: BarChart3    },
                { value: "calendario" as PageView, label: "Calendario", icon: CalendarDays },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPageView(value)}
                  className={clsx(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors duration-150 whitespace-nowrap",
                    pageView === value
                      ? "text-ink bg-white shadow-sm border border-ui-border"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-state-blue-bg text-state-blue whitespace-nowrap">
              {filtrados.length} proyecto{filtrados.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ── Controls bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "white", borderRadius: 99, padding: "4px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <FilterSelect value={filterLider} onChange={setFilterLider} placeholder="Todos los líderes">
              {lideres.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </FilterSelect>
            <Divider />
            <FilterSelect value={filterEstado} onChange={setFilterEstado} placeholder="Todos los estados">
              <option value="EN_CURSO">En curso</option>
              <option value="ADVERTENCIA">Advertencia</option>
              <option value="EN_RIESGO">En riesgo</option>
              <option value="FINALIZADO">Finalizado</option>
            </FilterSelect>
            <Divider />
            <FilterSelect value={filterCategoria} onChange={setFilterCategoria} placeholder="Todas las categorías">
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FilterSelect>
            <AnimatePresence>
              {hasFilters && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <Divider />
                  <button
                    onClick={() => { setFilterLider(""); setFilterEstado(""); setFilterCategoria("") }}
                    style={{
                      padding: "6px 12px", fontSize: 12, borderRadius: 99,
                      border: "none", background: "transparent",
                      color: "#6b7280", cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                  >
                    × Limpiar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {pageView === "gantt" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}
                style={{
                  display: "flex", alignItems: "center",
                  background: "white", borderRadius: 10, padding: 3,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                }}
              >
                {(["month", "quarter", "year", "all"] as CronogramaView[]).map((v) => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: "5px 13px", borderRadius: 7, border: "none",
                    fontSize: 12, fontWeight: view === v ? 600 : 500,
                    background: view === v ? "#1e293b" : "transparent",
                    color: view === v ? "white" : "#64748b",
                    cursor: "pointer", transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}>
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Legend ── */}
        {pageView === "gantt" && (
          <div style={{
            display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 0,
            borderRadius: 99, padding: "8px 16px", fontSize: 11,
            background: "white", color: "#374151", border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginTop: 12,
          }}>
            <span style={{ fontWeight: 600, marginRight: 10, color: "#1e293b" }}>Proyectos</span>
            {([
              ["EN_CURSO",    "#3b82f6", "En curso"],
              ["ADVERTENCIA", "#f59e0b", "Advertencia"],
              ["EN_RIESGO",   "#ef4444", "En riesgo"],
              ["FINALIZADO",  "#10b981", "Finalizado"],
              ["PROPUESTA",   "#94a3b8", "Propuesta"],
            ] as const).map(([k, c, l]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, marginRight: 12 }}>
                <span style={{ width: 14, height: 4, borderRadius: 2, background: c, flexShrink: 0 }} />
                <span>{l}</span>
              </span>
            ))}
            <span style={{ width: 1, height: 14, background: "#e2e8f0", margin: "0 10px" }} />
            <span style={{ fontWeight: 600, marginRight: 10, color: "#1e293b" }}>Entregables</span>
            {([
              ["COMPLETADO", "#22c55e", "Completado"],
              ["PENDIENTE",  "#9ca3af", "Pendiente"],
              ["URGENTE",    "#f59e0b", "Urgente"],
              ["VENCIDO",    "#ef4444", "Vencido"],
            ] as const).map(([k, c, l]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, marginRight: 12 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                  <polygon points="5,0 10,5 5,10 0,5" fill={c} />
                </svg>
                <span>{l}</span>
              </span>
            ))}
            <span style={{ width: 1, height: 14, background: "#e2e8f0", margin: "0 10px" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 20, borderTop: "2px dashed #f97316" }} />
              <span style={{ color: "#f97316", fontWeight: 600 }}>Hoy</span>
            </span>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: "20px 36px 0" }}>
        <AnimatePresence mode="wait">

          {pageView === "gantt" ? (
            <motion.div
              key="gantt"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              {filtrados.length === 0 ? (
                <div style={{
                  height: "calc(50vh)", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "white", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Sin proyectos</p>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>No hay proyectos que coincidan con los filtros.</p>
                  </div>
                </div>
              ) : (
                <div
                  style={{ height: "calc(60vh)", minHeight: 300, overflowY: "auto", overflowX: "auto", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                  onScroll={hideTooltip}
                >
                  <div style={{ minWidth: 900 }}>

                    {/* ── Gantt header (two rows) ── */}
                    <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      {/* Sidebar header */}
                      <div style={{
                        width: SIDEBAR_W, flexShrink: 0,
                        position: "sticky", left: 0, zIndex: 30,
                        borderRight: "1px solid #e2e8f0", background: "#f8fafc",
                        display: "flex", alignItems: "center", padding: "0 14px",
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", color: "#64748b", textTransform: "uppercase" }}>
                          Proyecto / Líder
                        </span>
                      </div>

                      {/* Timeline header: month row + sub-tick row */}
                      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#f8fafc" }}>

                        {/* Month row (bold 12px) */}
                        <div style={{ position: "relative", height: 26, borderBottom: "1px solid #f1f5f9" }}>
                          {months.map((m, i) => (
                            <span key={i} style={{
                              position: "absolute", left: `${m.pct}%`, top: "50%",
                              transform: "translate(4px, -50%)",
                              fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
                              color: "#475569", textTransform: "uppercase",
                              pointerEvents: "none", userSelect: "none",
                            }}>
                              {m.label}
                            </span>
                          ))}

                          {/* HOY pill with pulse animation */}
                          {todayPct > 0 && todayPct < 100 && (
                            <div style={{
                              position: "absolute", top: "50%", left: `${todayPct}%`,
                              transform: "translate(-50%, -50%)",
                              background: "#f97316", color: "white",
                              fontWeight: 700, fontSize: 9, whiteSpace: "nowrap",
                              borderRadius: 99, padding: "2px 7px",
                              animation: "today-pulse 2s ease-in-out infinite",
                              zIndex: 5,
                            }}>
                              HOY
                            </div>
                          )}
                        </div>

                        {/* Sub-tick row: days (month) or weeks (quarter) — light 11px */}
                        <div style={{ position: "relative", height: 18 }}>
                          {view === "month" && days.map((d, i) => (
                            <span key={i} style={{
                              position: "absolute",
                              left: `${d.pct + (100 / days.length / 2)}%`,
                              top: "50%", transform: "translate(-50%, -50%)",
                              fontSize: 9, fontWeight: 300,
                              color: d.isWeekend ? "#d1d5db" : "#94a3b8",
                              pointerEvents: "none", userSelect: "none",
                            }}>
                              {d.label}
                            </span>
                          ))}
                          {view === "quarter" && subWeeks.map((sw, i) => (
                            <span key={i} style={{
                              position: "absolute", left: `${sw.pct}%`, top: "50%",
                              transform: "translate(-50%, -50%)",
                              fontSize: 9, fontWeight: 300, color: "#94a3b8",
                              pointerEvents: "none", userSelect: "none",
                            }}>
                              {sw.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Project rows + SVG dependency overlay ── */}
                    <div style={{ position: "relative" }}>

                      {/* SVG curved dependency lines */}
                      {deps.length > 0 && (
                        <svg
                          style={{
                            position: "absolute", top: 0, left: SIDEBAR_W,
                            width: `calc(100% - ${SIDEBAR_W}px)`,
                            height: filtrados.length * ROW_H,
                            pointerEvents: "none", zIndex: 12, overflow: "visible",
                          }}
                          viewBox={`0 0 ${SVG_VW} ${filtrados.length * ROW_H}`}
                          preserveAspectRatio="none"
                        >
                          {deps.map(({ from, to }, i) => {
                            const x1 = toPct(new Date(filtrados[from].fechaFin))      * (SVG_VW / 100)
                            const x2 = toPct(new Date(filtrados[to].fechaInicio))     * (SVG_VW / 100)
                            const y1 = from * ROW_H + ROW_H / 2
                            const y2 = to   * ROW_H + ROW_H / 2
                            const cx = (x1 + x2) / 2
                            return (
                              <path
                                key={i}
                                d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`}
                                fill="none" stroke="#B4B2A9"
                                strokeWidth="1" strokeDasharray="4 2"
                                vectorEffect="non-scaling-stroke"
                              />
                            )
                          })}
                        </svg>
                      )}

                      {/* Project rows */}
                      {filtrados.map((p, idx) => {
                        const barLeft  = toPct(new Date(p.fechaInicio))
                        const barRight = toPct(new Date(p.fechaFin))
                        const barWidth = Math.max(0.5, barRight - barLeft)
                        const bKey     = badgeKey(p)
                        const barColor = BAR_COLOR[bKey] ?? BAR_COLOR.PROPUESTA
                        const rowBg    = idx % 2 === 0 ? "#ffffff" : "#f8fafc"

                        const fin    = new Date(p.fechaFin)
                        const ini    = new Date(p.fechaInicio)
                        const diasRestantes = Math.ceil((fin.getTime() - today.getTime()) / 864e5)
                        const totalDays     = Math.max(1, Math.round((fin.getTime() - ini.getTime()) / 864e5))
                        const elapsed       = Math.round((today.getTime() - ini.getTime()) / 864e5)
                        const pctAvance     = p.estado === "FINALIZADO"
                          ? 100
                          : Math.max(0, Math.min(100, Math.round(elapsed / totalDays * 100)))

                        return (
                          <div key={p.id} style={{ display: "flex", height: ROW_H, borderBottom: "1px solid #f1f5f9" }}>

                            {/* ── Sidebar: avatar + name + etapa chip ── */}
                            <div
                              style={{
                                width: SIDEBAR_W, flexShrink: 0,
                                position: "sticky", left: 0, zIndex: 10,
                                borderRight: "1px solid #f1f5f9", background: rowBg,
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "0 10px", cursor: "pointer",
                                transition: "background 0.12s",
                              }}
                              onClick={() => navigate(`/projects/${p.id}`)}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                              onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                            >
                              <div style={{
                                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                background: avatarBg(p.lider.nombre),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 9, fontWeight: 700, color: "white",
                              }}>
                                {initials(p.lider.nombre)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 11.5, fontWeight: 600, color: "#1e293b",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  margin: "0 0 2px",
                                }}>
                                  {p.nombre}
                                </p>
                                <span style={{
                                  fontSize: 9, fontWeight: 600,
                                  padding: "1px 6px", borderRadius: 99,
                                  background: (ETAPA_COLOR[p.etapa] ?? "#94a3b8") + "22",
                                  color: ETAPA_COLOR[p.etapa] ?? "#94a3b8",
                                  whiteSpace: "nowrap",
                                }}>
                                  {ETAPA_LABEL[p.etapa] ?? p.etapa}
                                </span>
                              </div>
                            </div>

                            {/* ── Timeline area ── */}
                            <div style={{ flex: 1, position: "relative", background: rowBg }}>

                              {/* Weekend shading */}
                              {view === "month" && days.filter(d => d.isWeekend).map((d, i) => (
                                <div key={i} style={{
                                  position: "absolute", inset: 0, left: `${d.pct}%`,
                                  width: `${100 / days.length}%`,
                                  background: "rgba(0,0,0,0.015)", pointerEvents: "none",
                                }} />
                              ))}

                              {/* Week grid lines */}
                              {weeks.map((pct, i) => (
                                <div key={i} style={{
                                  position: "absolute", top: 0, bottom: 0, left: `${pct}%`,
                                  borderLeft: "1px dashed rgba(0,0,0,0.05)", pointerEvents: "none",
                                }} />
                              ))}

                              {/* Today vertical line */}
                              {todayPct > 0 && todayPct < 100 && (
                                <div style={{
                                  position: "absolute", top: 0, bottom: 0, left: `${todayPct}%`,
                                  zIndex: 10, pointerEvents: "none",
                                  borderLeft: "2px dashed #f97316",
                                }} />
                              )}

                              {/* ── Project bar: 8px height, slide-right animation ── */}
                              <div style={{
                                position: "absolute", zIndex: 10,
                                left: `${barLeft}%`, width: `${barWidth}%`,
                                height: 8, top: "50%", transform: "translateY(-50%)",
                                borderRadius: 4, overflow: "hidden",
                              }}>
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ duration: 0.4, delay: idx * 0.04, ease: "easeOut" }}
                                  style={{
                                    width: "100%", height: "100%",
                                    background: barColor,
                                    transformOrigin: "0% 50%",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={ev => {
                                    const r = (ev.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
                                    setTooltip({
                                      kind: "bar", nombre: p.nombre, lider: p.lider.nombre,
                                      inicio: ini.toLocaleDateString("es-CO"),
                                      fin:    fin.toLocaleDateString("es-CO"),
                                      estadoLabel: BADGE_LABEL[bKey] ?? bKey,
                                      numEntregables: p.entregables.length,
                                      diasRestantes, pctAvance,
                                      x: r.left + r.width / 2, y: r.top,
                                    })
                                  }}
                                  onMouseLeave={() => setTooltip(null)}
                                />
                              </div>

                              {/* ── Deliverable diamonds (SVG 10px) ── */}
                              {p.entregables.map(e => {
                                const ePct  = toPct(new Date(e.fechaEntrega))
                                const color = ENT_COLOR[e.estado] ?? ENT_COLOR.PENDIENTE
                                return (
                                  <div
                                    key={e.id}
                                    style={{
                                      position: "absolute", zIndex: 20,
                                      left: `${ePct}%`, top: "50%",
                                      transform: "translate(-50%, -50%)",
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={ev => {
                                      const r = ev.currentTarget.getBoundingClientRect()
                                      setTooltip({
                                        kind: "marker", nombre: e.nombre,
                                        fecha: new Date(e.fechaEntrega).toLocaleDateString("es-CO"),
                                        estadoLabel: ENT_LABEL[e.estado] ?? e.estado,
                                        x: r.left + r.width / 2, y: r.top,
                                      })
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: "block" }}>
                                      <polygon
                                        points="5,0 10,5 5,10 0,5"
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="1.5"
                                      />
                                    </svg>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

          ) : (
            <motion.div
              key="calendario"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              <CalendarioMensual proyectos={filtrados} today={today} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER STATS ── */}
      <div style={{ padding: "16px 36px 32px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "14px 20px", borderRadius: 12, background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          fontSize: 13, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={14} color="#1d4ed8" />
            </span>
            <span style={{ color: "#1d4ed8", fontWeight: 700 }}>{statEnCurso}</span>
            <span style={{ color: "#64748b" }}>proyectos en curso</span>
          </div>
          <span style={{ width: 1, height: 20, background: "#e2e8f0", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Clock size={14} color="#16a34a" />
            </span>
            <span style={{ color: "#16a34a", fontWeight: 700 }}>{statProximos}</span>
            <span style={{ color: "#64748b" }}>entregables próximos 7 días</span>
          </div>
          <span style={{ width: 1, height: 20, background: "#e2e8f0", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: statVencidos > 0 ? "#fee2e2" : "#f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <AlertCircle size={14} color={statVencidos > 0 ? "#dc2626" : "#94a3b8"} />
            </span>
            <span style={{ color: statVencidos > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }}>{statVencidos}</span>
            <span style={{ color: "#64748b" }}>vencidos</span>
          </div>
        </div>
      </div>

      {/* ── Tooltip ── */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "fixed", zIndex: 50, pointerEvents: "none",
              left: tooltip.x, top: tooltip.y,
              transform: "translate(-50%, calc(-100% - 12px))",
            }}
          >
            {tooltip.kind === "bar" ? (
              <div style={{
                minWidth: 234,
                background: "rgba(15,23,42,0.96)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12,
                padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                <p style={{
                  fontSize: 13, fontWeight: 700, color: "white", margin: "0 0 8px",
                  maxWidth: 210, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {tooltip.nombre}
                </p>

                {/* Líder */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: avatarBg(tooltip.lider),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {initials(tooltip.lider)}
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {tooltip.lider}
                  </span>
                </div>

                {/* % Avance */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Avance temporal</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>
                      {tooltip.pctAvance}%
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${tooltip.pctAvance}%`,
                      background: tooltip.pctAvance >= 80 ? "#f97316" : "#3b82f6",
                      borderRadius: 99,
                    }} />
                  </div>
                </div>

                {/* Días restantes + fechas */}
                <div style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{
                    fontSize: 11, fontWeight: 600, margin: "0 0 4px",
                    color: tooltip.diasRestantes < 0 ? "#f87171" : "#e2e8f0",
                  }}>
                    {tooltip.diasRestantes < 0
                      ? `Vencido hace ${Math.abs(tooltip.diasRestantes)} días`
                      : tooltip.diasRestantes === 0
                      ? "Vence hoy"
                      : `${tooltip.diasRestantes} días restantes`}
                  </p>
                  <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    {tooltip.inicio} → {tooltip.fin}
                  </p>
                  <p style={{ fontSize: 10, color: "#64748b", margin: "3px 0 0" }}>
                    {tooltip.estadoLabel} · {tooltip.numEntregables} entregable{tooltip.numEntregables !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(15,23,42,0.96)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12, padding: "10px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, color: "white", margin: 0,
                  maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {tooltip.nombre}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tooltip.fecha}</p>
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{tooltip.estadoLabel}</p>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 0, height: 0,
                borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(15,23,42,0.96)" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────
function FilterSelect({ value, onChange, placeholder, children }: {
  value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: "transparent", border: "none", outline: "none",
        cursor: "pointer", fontSize: 13, padding: "6px 12px",
        color: value ? "#111827" : "#6b7280",
      }}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 20, flexShrink: 0, background: "#e5e7eb" }} />
}

// ── Monthly calendar ─────────────────────────────────────────────
type CalEvent = { type: "inicio" | "fin" | "entregable"; nombre: string; bKey: string }

function CalendarioMensual({ proyectos, today }: { proyectos: ProyectoGantt[]; today: Date }) {
  const [year,   setYear]   = useState(today.getFullYear())
  const [month,  setMonth]  = useState(today.getMonth())
  const [selDay, setSelDay] = useState<string | null>(null)

  const eventMap = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    const add = (date: Date, ev: CalEvent) => {
      const d = date
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const arr = map.get(k) ?? []
      arr.push(ev)
      map.set(k, arr)
    }
    for (const p of proyectos) {
      const bKey = badgeKey(p)
      add(new Date(p.fechaInicio), { type: "inicio",     nombre: p.nombre,                      bKey })
      add(new Date(p.fechaFin),    { type: "fin",        nombre: p.nombre,                      bKey })
      for (const e of p.entregables)
        add(new Date(e.fechaEntrega), { type: "entregable", nombre: `${e.nombre} · ${p.nombre}`, bKey: e.estado })
    }
    return map
  }, [proyectos])

  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++)
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayKey   = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const monthLabel = new Date(year, month, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
  const selEvents  = selDay ? (eventMap.get(selDay) ?? []) : []

  const prevMonth = () => {
    setSelDay(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelDay(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelDay(null) }

  const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  return (
    <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0, textTransform: "capitalize" }}>
            {monthLabel}
          </h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>
            Haz clic en un día para ver sus eventos
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[
            { onClick: prevMonth, child: <ChevronLeft size={16} /> },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} style={{ width: 34, height: 34, borderRadius: 99, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }} onMouseLeave={e => { e.currentTarget.style.background = "white" }}>
              {btn.child}
            </button>
          ))}
          <button onClick={goToday} style={{ padding: "0 14px", height: 34, borderRadius: 99, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1e293b", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }} onMouseLeave={e => { e.currentTarget.style.background = "white" }}>
            Hoy
          </button>
          <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 99, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }} onMouseLeave={e => { e.currentTarget.style.background = "white" }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#94a3b8", paddingBottom: 8, textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {cells.map((key, i) => {
            if (!key) return <div key={`e${i}`} style={{ minHeight: 68 }} />
            const events    = eventMap.get(key) ?? []
            const isToday   = key === todayKey
            const isSel     = key === selDay
            const isWeekend = (i % 7 === 0) || (i % 7 === 6)
            const hasEvts   = events.length > 0
            const dayNum    = parseInt(key.split("-")[2])
            const initEvts  = events.filter(e => e.type === "inicio")
            const finEvts   = events.filter(e => e.type === "fin")
            const entEvts   = events.filter(e => e.type === "entregable")
            const circleColor = isToday ? "#f97316" : isSel ? "#1e293b" : initEvts.length > 0 ? "#10b981" : finEvts.length > 0 ? "#3b82f6" : entEvts.length > 0 ? "#f97316" : null
            const cellBg     = isSel ? "#eff6ff" : isToday ? "#fff7ed" : "transparent"
            const cellBorder = isSel ? "1.5px solid #1e293b" : isToday ? "2px solid #f97316" : "1px solid transparent"
            return (
              <div
                key={key}
                onClick={() => hasEvts && setSelDay(isSel ? null : key)}
                style={{ minHeight: 68, padding: "6px 8px", borderRadius: 9, border: cellBorder, background: cellBg, cursor: hasEvts ? "pointer" : "default", transition: "background 0.12s, border-color 0.12s" }}
                onMouseEnter={e => { if (!isSel && !isToday) e.currentTarget.style.background = "#f8fafc" }}
                onMouseLeave={e => { if (!isSel && !isToday) e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: circleColor ? 700 : 400, background: circleColor ?? "transparent", color: circleColor ? "white" : isWeekend ? "#9ca3af" : "#1e293b" }}>
                    {dayNum}
                  </span>
                  {hasEvts && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#1d4ed8", background: "#dbeafe", borderRadius: 99, padding: "1px 5px" }}>{events.length}</span>
                  )}
                </div>
                {hasEvts && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {initEvts.slice(0, 2).map((_, j) => (
                      <span key={`i${j}`} style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: "#10b981" }} />
                    ))}
                    {finEvts.slice(0, 2).map((_, j) => (
                      <span key={`f${j}`} style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, border: "2px solid #3b82f6", boxSizing: "border-box" }} />
                    ))}
                    {entEvts.slice(0, 3).map((_, j) => (
                      <span key={`d${j}`} style={{ width: 6, height: 6, transform: "rotate(45deg)", flexShrink: 0, background: "#f97316" }} />
                    ))}
                    {events.length > 7 && (
                      <span style={{ fontSize: 8, color: "#94a3b8" }}>+{events.length - 7}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px 0", fontSize: 11, color: "#94a3b8" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          Inicio proyecto
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", border: "2px solid #3b82f6", boxSizing: "border-box", display: "inline-block" }} />
          Cierre proyecto
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, transform: "rotate(45deg)", background: "#f97316", display: "inline-block" }} />
          Entregable
        </span>
      </div>

      <AnimatePresence>
        {selDay && selEvents.length > 0 && (
          <motion.div
            key={selDay}
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid #f1f5f9", padding: "16px 24px 20px", background: "#f8fafc", marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 10, textTransform: "capitalize" }}>
                {new Date(selDay + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selEvents.map((ev, i) => {
                  const isEnt      = ev.type === "entregable"
                  const isFin      = ev.type === "fin"
                  const typeLabel  = ev.type === "inicio" ? "Inicio" : ev.type === "fin" ? "Cierre" : "Entregable"
                  const stateLabel = isEnt ? (ENT_LABEL[ev.bKey] ?? ev.bKey) : (BADGE_LABEL[ev.bKey] ?? ev.bKey)
                  const fixedDot   = ev.type === "inicio" ? "#10b981" : ev.type === "fin" ? "#3b82f6" : "#f97316"
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "white", borderRadius: 10, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ width: 8, height: 8, flexShrink: 0, marginTop: 5, borderRadius: isEnt ? 1 : "50%", transform: isEnt ? "rotate(45deg)" : "none", background: isFin ? "transparent" : fixedDot, border: isFin ? `2px solid ${fixedDot}` : "none", boxSizing: "border-box" }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>{ev.nombre}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{typeLabel} · {stateLabel}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ height: 24 }} />
    </div>
  )
}
