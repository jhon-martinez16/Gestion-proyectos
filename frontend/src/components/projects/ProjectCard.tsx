import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Calendar, Edit2, Trash2 } from "lucide-react"

interface Usuario  { id: string; nombre: string }
interface Advertencia { tipo: string; nivel: "CRITICA" | "MEDIA" | "BAJA"; mensaje: string }
interface Proyecto {
  id: string; nombre: string; descripcion: string
  lider: Usuario; socio2?: Usuario
  categoria: { id: string; nombre: string }
  fechaInicio: string; fechaFin: string
  estado: string; etapa?: string
  advertencias?: Advertencia[]
}

interface Props { proyecto: Proyecto; onEdit: () => void; onDelete?: () => void }

// ── Config ────────────────────────────────────────────────────────
const ESTADO_CFG: Record<string, { border: string; badge: { bg: string; text: string; dot: string }; label: string }> = {
  EN_CURSO:    { border: "var(--primary)",   badge: { bg: "#dcfce7", text: "#15803d", dot: "#16a34a" }, label: "En curso" },
  ADVERTENCIA: { border: "var(--warning)",   badge: { bg: "#fef9c3", text: "#a16207", dot: "#f59e0b" }, label: "Advertencia" },
  EN_RIESGO:   { border: "var(--danger)",    badge: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" }, label: "En riesgo" },
  FINALIZADO:  { border: "#94a3b8",          badge: { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" }, label: "Finalizado" },
  PROPUESTA:   { border: "#94a3b8",          badge: { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" }, label: "Propuesta" },
}

const ETAPA_CFG: Record<string, { bg: string; text: string; label: string }> = {
  PROPUESTA:    { bg: "#f3f0ff", text: "#7c3aed", label: "Propuesta" },
  KICK_OFF:     { bg: "#eff6ff", text: "#1d4ed8", label: "Kick-off" },
  EN_EJECUCION: { bg: "#dcfce7", text: "#15803d", label: "En ejecución" },
  CIERRE:       { bg: "#f1f5f9", text: "#64748b", label: "Cierre" },
}

function avatarBg(name: string) {
  const colors = ["#6366F1","#0EA5E9","#10B981","#F59E0B","#EC4899","#8B5CF6"]
  return colors[name.charCodeAt(0) % colors.length]
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

export default function ProjectCard({ proyecto, onEdit, onDelete }: Props) {
  const navigate = useNavigate()

  const advertenciasCriticas = proyecto.advertencias?.filter(a => a.nivel === "CRITICA").length ?? 0
  const advertenciasMedias   = proyecto.advertencias?.filter(a => a.nivel === "MEDIA").length ?? 0
  const compromisosVencidos  = proyecto.advertencias?.filter(
    a => a.tipo === "COMPROMISO_VENCIDO" || a.tipo === "COMPROMISO_NO_CUMPLIDO"
  ).length ?? 0

  const esFinalizado = proyecto.estado === "FINALIZADO"
  const estadoCfg    = ESTADO_CFG[proyecto.estado] ?? ESTADO_CFG.PROPUESTA
  const etapaCfg     = proyecto.etapa ? ETAPA_CFG[proyecto.etapa] : null

  const borderColor = esFinalizado ? "#e2e8f0"
    : advertenciasCriticas > 0 ? "rgba(239,68,68,0.35)"
    : advertenciasMedias   > 0 ? "rgba(245,158,11,0.35)"
    : "var(--card-border)"

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--card-shadow-hover)" }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18 }}
      onClick={() => navigate(`/projects/${proyecto.id}`)}
      style={{
        background: esFinalizado ? "#fafbfc" : "white",
        border: `1px solid ${borderColor}`,
        borderTop: `3px solid ${estadoCfg.border}`,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "var(--card-shadow)",
        display: "flex",
        flexDirection: "column",
        opacity: esFinalizado ? 0.75 : 1,
        transition: "box-shadow 0.18s ease",
      }}
    >
      {/* ── Body ── */}
      <div style={{ padding: "16px 16px 12px", flex: 1 }}>

        {/* Header: name + badges */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <h2 style={{
            fontSize: 15, fontWeight: 600,
            color: esFinalizado ? "var(--text-muted)" : "var(--text-primary)",
            lineHeight: 1.3, flex: 1, minWidth: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {proyecto.nombre}
          </h2>
          <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 50,
              fontSize: 11, fontWeight: 600,
              background: estadoCfg.badge.bg, color: estadoCfg.badge.text,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: estadoCfg.badge.dot }} />
              {esFinalizado ? "Cerrado" : estadoCfg.label}
            </span>
            {etapaCfg && !esFinalizado && (
              <span style={{
                display: "inline-flex", padding: "3px 9px", borderRadius: 50,
                fontSize: 11, fontWeight: 600,
                background: etapaCfg.bg, color: etapaCfg.text,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {etapaCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Category + leaders */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: "var(--primary)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {proyecto.categoria?.nombre}
          </span>

          {/* Avatar stack */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {[proyecto.lider, proyecto.socio2].filter(Boolean).map((u, i) => u && (
              <div
                key={u.id}
                title={u.nombre}
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: avatarBg(u.nombre),
                  border: "2px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 10, fontWeight: 700,
                  marginLeft: i > 0 ? -8 : 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                {initials(u.nombre)}
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "var(--text-muted)", marginBottom: 10,
        }}>
          <Calendar size={12} color="var(--text-muted)" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(proyecto.fechaInicio).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
            {" → "}
            {new Date(proyecto.fechaFin).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Alert badges */}
        {(compromisosVencidos > 0 || advertenciasCriticas > 0 || advertenciasMedias > 0) && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
            {compromisosVencidos > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 50,
                background: "var(--danger-light)", color: "var(--danger)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {compromisosVencidos} compromiso{compromisosVencidos > 1 ? "s" : ""}
              </span>
            )}
            {advertenciasCriticas > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 50,
                background: "var(--danger-light)", color: "var(--danger)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {advertenciasCriticas} crítica{advertenciasCriticas > 1 ? "s" : ""}
              </span>
            )}
            {advertenciasMedias > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 50,
                background: "var(--warning-light)", color: "var(--warning)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {advertenciasMedias} media{advertenciasMedias > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: "flex", gap: 6, padding: "10px 16px",
          borderTop: "1px solid var(--card-border)",
          background: "var(--content-bg)",
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "6px 0", borderRadius: "var(--radius-sm)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "var(--info-light)", color: "var(--info)",
            border: "1px solid rgba(59,130,246,0.15)",
            fontFamily: "'DM Sans', sans-serif", transition: "var(--transition)",
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = "var(--info)"); (e.currentTarget.style.color = "white") }}
          onMouseLeave={e => { (e.currentTarget.style.background = "var(--info-light)"); (e.currentTarget.style.color = "var(--info)") }}
        >
          <Edit2 size={12} /> Editar
        </motion.button>

        {onDelete && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDelete}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "6px 0", borderRadius: "var(--radius-sm)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: "var(--danger-light)", color: "var(--danger)",
              border: "1px solid rgba(239,68,68,0.15)",
              fontFamily: "'DM Sans', sans-serif", transition: "var(--transition)",
            }}
            onMouseEnter={e => { (e.currentTarget.style.background = "var(--danger)"); (e.currentTarget.style.color = "white") }}
            onMouseLeave={e => { (e.currentTarget.style.background = "var(--danger-light)"); (e.currentTarget.style.color = "var(--danger)") }}
          >
            <Trash2 size={12} /> Eliminar
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
