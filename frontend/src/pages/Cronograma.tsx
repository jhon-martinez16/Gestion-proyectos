import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "../services/api"

// ── Types ────────────────────────────────────────────────────────
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
const BAR_GRADIENT: Record<string, string> = {
  EN_CURSO:    "linear-gradient(to right, #22C55E, #16A34A)",
  ADVERTENCIA: "linear-gradient(to right, #FCD34D, #F59E0B)",
  EN_RIESGO:   "linear-gradient(to right, #F87171, #DC2626)",
  FINALIZADO:  "linear-gradient(to right, #60A5FA, #2563EB)",
  PROPUESTA:   "linear-gradient(to right, #CBD5E1, #94A3B8)",
}

const BAR_SHADOW: Record<string, string> = {
  EN_CURSO:    "0 2px 8px rgba(34,197,94,0.35)",
  ADVERTENCIA: "0 2px 8px rgba(252,211,77,0.35)",
  EN_RIESGO:   "0 2px 8px rgba(248,113,113,0.35)",
  FINALIZADO:  "0 2px 8px rgba(96,165,250,0.35)",
  PROPUESTA:   "0 2px 8px rgba(148,163,184,0.35)",
}

const BADGE: Record<string, { bg: string; color: string }> = {
  EN_CURSO:    { bg: "#DCFCE7", color: "#15803D" },
  ADVERTENCIA: { bg: "#FEF9C3", color: "#A16207" },
  EN_RIESGO:   { bg: "#FEE2E2", color: "#DC2626" },
  FINALIZADO:  { bg: "#DBEAFE", color: "#1D4ED8" },
  PROPUESTA:   { bg: "#F1F5F9", color: "#475569" },
}

const BADGE_LABEL: Record<string, string> = {
  EN_CURSO:    "En curso",
  ADVERTENCIA: "Advertencia",
  EN_RIESGO:   "En riesgo",
  FINALIZADO:  "Finalizado",
  PROPUESTA:   "Propuesta",
}

const ENT_COLOR: Record<string, string> = {
  COMPLETADO:  "#22C55E",
  PENDIENTE:   "#9CA3AF",
  ADVERTENCIA: "#F59E0B",
  URGENTE:     "#F59E0B",
  VENCIDO:     "#EF4444",
}

const ENT_LABEL: Record<string, string> = {
  COMPLETADO:  "Completado",
  PENDIENTE:   "Pendiente",
  ADVERTENCIA: "Advertencia",
  URGENTE:     "Urgente",
  VENCIDO:     "Vencido",
}

const VIEW_LABELS: Record<CronogramaView, string> = {
  month:   "Mes actual",
  quarter: "Trimestre",
  year:    "Año",
  all:     "Todo",
}

// ── Tooltip variants ─────────────────────────────────────────────
type Tooltip =
  | { kind: "bar";    nombre: string; lider: string; inicio: string; fin: string; estadoLabel: string; numEntregables: number; x: number; y: number }
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
  if (first === "esteban") return "#6366F1"
  if (first === "luis")    return "#0EA5E9"
  if (first === "john" || first === "jhon") return "#10B981"
  return "#F59E0B"
}

export default function Cronograma() {
  const navigate = useNavigate()

  const [proyectos,   setProyectos]   = useState<ProyectoGantt[]>([])
  const [categorias,  setCategorias]  = useState<{ id: string; nombre: string }[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tooltip,     setTooltip]     = useState<Tooltip>(null)
  const [view,        setView]        = useState<CronogramaView>("month")

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

  // Month markers
  const months: { label: string; pct: number }[] = []
  const mc = new Date(rStart.getFullYear(), rStart.getMonth(), 1)
  while (mc <= rEnd) {
    months.push({ label: mc.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }).toUpperCase(), pct: toPct(mc) })
    mc.setMonth(mc.getMonth() + 1)
  }

  // Day markers for month view
  const days: { label: string; pct: number; isWeekend: boolean }[] = []
  if (view === "month") {
    const dc = new Date(rStart)
    while (dc <= rEnd) {
      const day = dc.getDay()
      days.push({
        label: String(dc.getDate()),
        pct: toPct(new Date(dc)),
        isWeekend: day === 0 || day === 6,
      })
      dc.setDate(dc.getDate() + 1)
    }
  }

  // Weekly grid lines (Monday-aligned)
  const weeks: number[] = []
  const wc = new Date(rStart)
  const wd = wc.getDay(); wc.setDate(wc.getDate() + (wd === 0 ? 1 : (8 - wd) % 7 || 7))
  while (wc <= rEnd) { weeks.push(toPct(wc)); wc.setDate(wc.getDate() + 7) }

  const todayPct = toPct(today)

  // ── Footer stats ──────────────────────────────────────────────
  const in7d      = new Date(today.getTime() + 7 * 864e5)
  const allEnts   = proyectos.flatMap(p => p.entregables)
  const statEnCurso  = proyectos.filter(p => p.estado === "EN_CURSO").length
  const statProximos = allEnts.filter(e => e.estado !== "COMPLETADO" && new Date(e.fechaEntrega) >= today && new Date(e.fechaEntrega) <= in7d).length
  const statVencidos = allEnts.filter(e => e.estado === "VENCIDO").length

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 80px)" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary)" }} />
      </div>
    )
  }

  const hideTooltip = () => setTooltip(null)

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 80px)", background: "var(--content-bg)" }}
    >
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex-none space-y-3 pb-4">

        {/* Title + controls */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 30, fontWeight: 400, lineHeight: 1.15,
              color: "var(--text-primary)", letterSpacing: "-0.01em",
            }}>
              Cronograma
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Vista de proyectos y entregables en el tiempo
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {/* View toggle */}
            <div style={{
              display: "flex", alignItems: "center",
              background: "white", borderRadius: 10,
              border: "1px solid var(--card-border)",
              padding: 3,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {(["month", "quarter", "year", "all"] as CronogramaView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 7,
                    border: "none",
                    fontSize: 12,
                    fontWeight: view === v ? 600 : 500,
                    background: view === v ? "var(--navy, #1e3a6e)" : "transparent",
                    color: view === v ? "white" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>

            {/* Project count badge */}
            <span style={{
              padding: "5px 14px", borderRadius: 99,
              background: "#dcfce7", color: "#15803d",
              fontSize: 12, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {filtrados.length} proyecto{filtrados.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filter bar pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 0,
          background: "white", borderRadius: 99, padding: "4px 4px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
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
            {(filterLider || filterEstado || filterCategoria) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
              >
                <Divider />
                <button
                  onClick={() => { setFilterLider(""); setFilterEstado(""); setFilterCategoria("") }}
                  style={{
                    padding: "6px 12px", fontSize: 12, borderRadius: 99,
                    border: "none", background: "transparent",
                    color: "#6b7280", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
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

        {/* Legend */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 0,
          borderRadius: 99, padding: "8px 16px", fontSize: 11,
          background: "#1E293B", color: "#94A3B8",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ fontWeight: 600, marginRight: 10, color: "#64748B" }}>Proyectos</span>
          {([
            ["EN_CURSO",    "#16A34A", "En curso"],
            ["ADVERTENCIA", "#F59E0B", "Advertencia"],
            ["EN_RIESGO",   "#DC2626", "En riesgo"],
            ["FINALIZADO",  "#2563EB", "Finalizado"],
            ["PROPUESTA",   "#94A3B8", "Propuesta"],
          ] as const).map(([k, c, l]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <span style={{ color: "#CBD5E1" }}>{l}</span>
            </span>
          ))}
          <span style={{ width: 1, height: 16, background: "#334155", margin: "0 12px" }} />
          <span style={{ fontWeight: 600, marginRight: 10, color: "#64748B" }}>Entregables</span>
          {([
            ["COMPLETADO", "#22C55E", "Completado"],
            ["PENDIENTE",  "#9CA3AF", "Pendiente"],
            ["URGENTE",    "#F59E0B", "Urgente"],
            ["VENCIDO",    "#EF4444", "Vencido"],
          ] as const).map(([k, c, l]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 12 }}>
              <span style={{ width: 8, height: 8, background: c, transform: "rotate(45deg)", flexShrink: 0 }} />
              <span style={{ color: "#CBD5E1" }}>{l}</span>
            </span>
          ))}
          <span style={{ width: 1, height: 16, background: "#334155", margin: "0 12px" }} />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 20, borderTop: "2px solid var(--accent, #f97316)" }} />
            <span style={{ color: "#fb923c", fontWeight: 600 }}>Hoy</span>
          </span>
        </div>
      </div>

      {/* ── Gantt ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {filtrados.length === 0 ? (
          <div style={{
            height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            background: "white", borderRadius: 16, border: "1px solid var(--card-border)",
          }}>
            <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Sin proyectos</p>
              <p style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No hay proyectos que coincidan con los filtros.</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: "100%", overflowY: "auto", overflowX: "auto",
              borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
            onScroll={hideTooltip}
          >
            <div style={{ minWidth: 880 }}>

              {/* ── Header (sticky top) ───────────────────────── */}
              <div
                style={{
                  position: "sticky", top: 0, zIndex: 20,
                  display: "flex", borderBottom: "1px solid #0F172A",
                  background: "#1E293B",
                }}
              >
                {/* Left col */}
                <div style={{
                  width: 220, flexShrink: 0,
                  position: "sticky", left: 0, zIndex: 30,
                  borderRight: "1px solid #0F172A",
                  background: "#1E293B",
                  display: "flex", alignItems: "center",
                  padding: "0 20px",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#64748B", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
                    Proyecto / Líder
                  </span>
                </div>

                {/* Timeline header */}
                <div style={{ flex: 1, position: "relative", height: 44 }}>
                  {/* Month labels */}
                  {months.map((m, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${m.pct}%`, top: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.1em", color: "#94A3B8",
                        fontFamily: "'DM Sans', sans-serif",
                        pointerEvents: "none", userSelect: "none",
                      }}
                    >
                      {m.label}
                    </span>
                  ))}

                  {/* TODAY badge + line stub — ORANGE */}
                  {todayPct > 0 && todayPct < 100 && (
                    <div style={{
                      position: "absolute", inset: "0 0 0",
                      left: `${todayPct}%`,
                      zIndex: 10, pointerEvents: "none",
                      display: "flex", flexDirection: "column", alignItems: "center",
                    }}>
                      <div style={{
                        marginTop: 6, transform: "translateX(-50%)",
                        background: "var(--accent, #f97316)",
                        color: "white", fontWeight: 700, fontSize: 9,
                        whiteSpace: "nowrap", borderRadius: 99,
                        padding: "2px 6px",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        HOY
                      </div>
                      <div style={{ flex: 1, marginTop: 2, borderLeft: "2px solid var(--accent, #f97316)" }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Project rows ───────────────────────────────── */}
              {filtrados.map((p, idx) => {
                const barLeft  = toPct(new Date(p.fechaInicio))
                const barRight = toPct(new Date(p.fechaFin))
                const barWidth = Math.max(0.5, barRight - barLeft)
                const bKey     = badgeKey(p)
                const bStyle   = BADGE[bKey] ?? BADGE.PROPUESTA
                const gradient = BAR_GRADIENT[bKey] ?? BAR_GRADIENT.PROPUESTA
                const shadow   = BAR_SHADOW[bKey]   ?? BAR_SHADOW.PROPUESTA
                const rowBg    = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFF"

                return (
                  <div
                    key={p.id}
                    style={{ display: "flex", height: 80, borderBottom: "1px solid #EEF2FF" }}
                  >
                    {/* ── Info panel (sticky left) ──────────── */}
                    <div style={{
                      width: 220, flexShrink: 0,
                      position: "sticky", left: 0, zIndex: 10,
                      borderRight: "1px solid #E2E8F0",
                      background: "#FFFFFF",
                      boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
                      display: "flex", flexDirection: "column", justifyContent: "center",
                      padding: "0 20px",
                    }}>
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          fontSize: 14, fontWeight: 700, color: "#0F172A",
                          background: "none", border: "none", cursor: "pointer",
                          lineHeight: 1.3, transition: "color 0.15s",
                          fontFamily: "'DM Sans', sans-serif",
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        } as any}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#0F172A")}
                      >
                        {p.nombre}
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: avatarBg(p.lider.nombre),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 8, fontWeight: 700, color: "white", flexShrink: 0,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {initials(p.lider.nombre)}
                        </div>
                        <p style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
                          {p.lider.nombre}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{
                          display: "inline-block", padding: "1px 6px", borderRadius: 99,
                          fontSize: 10, fontWeight: 600,
                          background: bStyle.bg, color: bStyle.color,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {BADGE_LABEL[bKey] ?? bKey}
                        </span>
                        {p.categoria && (
                          <span style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80, fontFamily: "'DM Sans', sans-serif" }}>
                            {p.categoria.nombre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Timeline area ─────────────────────── */}
                    <div style={{ flex: 1, position: "relative", background: rowBg }}>

                      {/* Weekend shading (month view) */}
                      {view === "month" && days.filter(d => d.isWeekend).map((d, i) => (
                        <div
                          key={i}
                          style={{
                            position: "absolute", inset: 0,
                            left: `${d.pct}%`,
                            width: `${100 / days.length}%`,
                            background: "rgba(0,0,0,0.025)",
                            pointerEvents: "none",
                          }}
                        />
                      ))}

                      {/* Weekly grid lines */}
                      {weeks.map((pct, i) => (
                        <div
                          key={i}
                          style={{
                            position: "absolute", top: 0, bottom: 0, left: `${pct}%`,
                            borderLeft: "1px dashed rgba(99,102,241,0.12)",
                            pointerEvents: "none",
                          }}
                        />
                      ))}

                      {/* TODAY line — ORANGE */}
                      {todayPct > 0 && todayPct < 100 && (
                        <div
                          style={{
                            position: "absolute", top: 0, bottom: 0, left: `${todayPct}%`,
                            zIndex: 10, pointerEvents: "none",
                            borderLeft: "2px solid var(--accent, #f97316)",
                          }}
                        />
                      )}

                      {/* ── Project bar ───────────────────── */}
                      <div
                        style={{
                          position: "absolute", zIndex: 10,
                          left:      `${barLeft}%`,
                          width:     `${barWidth}%`,
                          height:    32,
                          top:       "50%",
                          transform: "translateY(-50%)",
                          borderRadius: 99,
                          overflow: "hidden",
                          background: `linear-gradient(to bottom, rgba(255,255,255,0.28) 0%, transparent 40%), ${gradient}`,
                          boxShadow:  shadow,
                          cursor: "default",
                          transition: "transform 0.15s ease",
                        }}
                        onMouseEnter={ev => {
                          ev.currentTarget.style.transform = "translateY(-50%) scaleY(1.15)"
                          const r = ev.currentTarget.getBoundingClientRect()
                          setTooltip({
                            kind:           "bar",
                            nombre:         p.nombre,
                            lider:          p.lider.nombre,
                            inicio:         new Date(p.fechaInicio).toLocaleDateString("es-CO"),
                            fin:            new Date(p.fechaFin).toLocaleDateString("es-CO"),
                            estadoLabel:    BADGE_LABEL[bKey] ?? bKey,
                            numEntregables: p.entregables.length,
                            x: r.left + r.width / 2,
                            y: r.top,
                          })
                        }}
                        onMouseLeave={ev => {
                          ev.currentTarget.style.transform = "translateY(-50%)"
                          setTooltip(null)
                        }}
                      >
                        {barWidth > 13 && (
                          <>
                            <span style={{
                              position: "absolute", top: "50%", left: 9,
                              transform: "translateY(-50%)",
                              fontSize: 9, color: "white", fontWeight: 600, lineHeight: 1,
                              userSelect: "none", pointerEvents: "none",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              {new Date(p.fechaInicio).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                            </span>
                            <span style={{
                              position: "absolute", top: "50%", right: 9,
                              transform: "translateY(-50%)",
                              fontSize: 9, color: "white", fontWeight: 600, lineHeight: 1,
                              userSelect: "none", pointerEvents: "none",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              {new Date(p.fechaFin).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* ── Deliverable markers ───────────── */}
                      {p.entregables.map(e => {
                        const pct   = toPct(new Date(e.fechaEntrega))
                        const color = ENT_COLOR[e.estado] ?? ENT_COLOR.PENDIENTE
                        return (
                          <div
                            key={e.id}
                            style={{
                              position: "absolute", zIndex: 20,
                              left: `${pct}%`, top: "50%",
                              transform: "translate(-50%, -50%)",
                              cursor: "default",
                            }}
                            onMouseEnter={ev => {
                              const r = ev.currentTarget.getBoundingClientRect()
                              setTooltip({
                                kind:        "marker",
                                nombre:      e.nombre,
                                fecha:       new Date(e.fechaEntrega).toLocaleDateString("es-CO"),
                                estadoLabel: ENT_LABEL[e.estado] ?? e.estado,
                                x: r.left + r.width / 2,
                                y: r.top,
                              })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <div style={{
                              width: 14, height: 14,
                              background: color,
                              border: "2.5px solid white",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                              transform: "rotate(45deg)",
                              borderRadius: 2,
                            }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Summary footer ───────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
        padding: "10px 20px", borderRadius: 12, marginTop: 12,
        background: "#1E293B", fontSize: 12, color: "#64748B",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <span style={{ color: "#4ADE80", fontWeight: 600 }}>{statEnCurso}</span>
        <span style={{ color: "#94A3B8" }}>&nbsp;proyectos en curso</span>
        <span style={{ margin: "0 8px", color: "#334155" }}>·</span>
        <span style={{ color: "#60A5FA", fontWeight: 600 }}>{statProximos}</span>
        <span style={{ color: "#94A3B8" }}>&nbsp;entregables próximos 7 días</span>
        <span style={{ margin: "0 8px", color: "#334155" }}>·</span>
        <span style={{ color: statVencidos > 0 ? "#F87171" : "#94A3B8", fontWeight: 600 }}>{statVencidos}</span>
        <span style={{ color: "#94A3B8" }}>&nbsp;vencidos</span>
      </div>

      {/* ── Floating dark glassmorphism tooltip ──────────────────── */}
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
                minWidth: 220,
                background: "rgba(15,23,42,0.96)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
              }}>
                <p style={{
                  fontSize: 13, fontWeight: 700, color: "white",
                  maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {tooltip.nombre}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: avatarBg(tooltip.lider),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, fontWeight: 700, color: "white", flexShrink: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {initials(tooltip.lider)}
                  </div>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}>{tooltip.lider}</span>
                </div>
                <p style={{
                  fontSize: 11, color: "#64748B", marginTop: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {tooltip.inicio} → {tooltip.fin}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>{tooltip.estadoLabel}</span>
                  <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>
                    · {tooltip.numEntregables} entregable{tooltip.numEntregables !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(15,23,42,0.96)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: "10px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, color: "white",
                  maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {tooltip.nombre}
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  {tooltip.fecha}
                </p>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                  {tooltip.estadoLabel}
                </p>
              </div>
            )}
            {/* Arrow */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(15,23,42,0.96)",
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────
function FilterSelect({
  value, onChange, placeholder, children
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: "transparent", border: "none", outline: "none",
        cursor: "pointer", fontSize: 13, padding: "6px 12px",
        color: value ? "#111827" : "#6B7280",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 20, flexShrink: 0, background: "#E5E7EB" }} />
}
