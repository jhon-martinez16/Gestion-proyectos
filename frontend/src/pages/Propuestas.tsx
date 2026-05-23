import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "../services/api"
import { Sparkles, Copy, Check, FileText, Target, Package, CalendarDays, Briefcase, X, Plus, Wand2 } from "lucide-react"

interface PropuestaGenerada {
  resumenEjecutivo: string
  alcance: string
  entregables: string
  cronograma: string
  condicionesComerciales: string
}

interface FormData {
  nombreCliente: string
  tipoProyecto: string
  duracionEstimada: string
  presupuesto: string
  contextoAdicional: string
}

const EMPTY_FORM: FormData = {
  nombreCliente: "",
  tipoProyecto: "",
  duracionEstimada: "",
  presupuesto: "",
  contextoAdicional: "",
}

const SECCIONES = [
  { key: "resumenEjecutivo",       icon: FileText,     label: "Resumen Ejecutivo",       emoji: "📋", color: "#1e2a3a" },
  { key: "alcance",                icon: Target,       label: "Alcance del Proyecto",    emoji: "🎯", color: "#059669" },
  { key: "entregables",            icon: Package,      label: "Entregables Propuestos",  emoji: "📦", color: "#f97316" },
  { key: "cronograma",             icon: CalendarDays, label: "Cronograma Sugerido",     emoji: "📅", color: "#0284c7" },
  { key: "condicionesComerciales", icon: Briefcase,    label: "Condiciones Comerciales", emoji: "💼", color: "#7c3aed" },
] as const

const KEYFRAMES = `
  @keyframes skeleton-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%)",
  backgroundSize: "400% 100%",
  animation: "skeleton-shimmer 1.5s ease-in-out infinite",
}

function SkeletonCard({ color, lines = 3 }: { color: string; lines?: number }) {
  return (
    <div style={{ background: "white", borderRadius: 12, overflow: "hidden", borderLeft: `4px solid ${color}`, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "14px 20px", background: color, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
        <div style={{ width: 140, height: 13, borderRadius: 7, background: "rgba(255,255,255,0.3)" }} />
      </div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ height: 13, borderRadius: 6, width: i === lines - 1 ? "62%" : "100%", ...shimmerStyle }} />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 20, padding: "80px 40px", textAlign: "center",
    }}>
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="6" width="50" height="66" rx="7" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
        <path d="M50 6 L62 18 L50 18 Z" fill="#e2e8f0"/>
        <rect x="22" y="28" width="24" height="3" rx="1.5" fill="#cbd5e1"/>
        <rect x="22" y="36" width="30" height="3" rx="1.5" fill="#e2e8f0"/>
        <rect x="22" y="44" width="20" height="3" rx="1.5" fill="#e2e8f0"/>
        <rect x="22" y="52" width="26" height="3" rx="1.5" fill="#e2e8f0"/>
        <circle cx="64" cy="64" r="18" fill="#fff7ed" stroke="#f97316" strokeWidth="2"/>
        <path d="M57 64 L62 69 L71 58" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif", margin: "0 0 8px" }}>
          Tu propuesta aparecerá aquí
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif", margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
          Completa el formulario a la izquierda y haz clic en "Generar Propuesta con IA"
        </p>
      </div>
    </div>
  )
}

export default function Propuestas() {
  const [form, setForm]           = useState<FormData>(EMPTY_FORM)
  const [generando, setGenerando] = useState(false)
  const [propuesta, setPropuesta] = useState<PropuestaGenerada | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [copiado, setCopiado]     = useState(false)

  const [sugerencias, setSugerencias]         = useState<string[]>([])
  const [cargandoSug, setCargandoSug]         = useState(false)
  const [seleccionadas, setSeleccionadas]     = useState<Set<string>>(new Set())
  const [objetivoInput, setObjetivoInput]     = useState("")
  const [objetivosCustom, setObjetivosCustom] = useState<string[]>([])
  const [modoManual, setModoManual]           = useState(false)
  const [objetivosManual, setObjetivosManual] = useState("")
  const ultimoTipoRef = useRef("")

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const applyFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#f97316"
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(249,115,22,0.12)"
  }
  const applyBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#e2e8f0"
    e.currentTarget.style.boxShadow   = "none"
  }

  const fetchSugerencias = async (tipo: string) => {
    if (tipo.length < 3 || tipo === ultimoTipoRef.current) return
    ultimoTipoRef.current = tipo
    setCargandoSug(true)
    setModoManual(false)
    setSugerencias([])
    setSeleccionadas(new Set())
    setObjetivosCustom([])
    try {
      const { data } = await api.post<{ objetivos: string[] }>("/ai/sugerir-objetivos", { tipoProyecto: tipo })
      setSugerencias(data.objetivos ?? [])
    } catch {
      setModoManual(true)
    } finally {
      setCargandoSug(false)
    }
  }

  const handleTipoBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    applyBlur(e)
    await fetchSugerencias(form.tipoProyecto.trim())
  }

  const toggleSugerida = (obj: string) =>
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(obj) ? next.delete(obj) : next.add(obj)
      return next
    })

  const agregarCustom = () => {
    const val = objetivoInput.trim()
    if (!val || objetivosCustom.includes(val)) return
    setObjetivosCustom(prev => [...prev, val])
    setObjetivoInput("")
  }

  const quitarCustom = (obj: string) =>
    setObjetivosCustom(prev => prev.filter(o => o !== obj))

  const objetivosEfectivos = modoManual
    ? objetivosManual
    : [...seleccionadas, ...objetivosCustom].join(". ")

  const hayObjetivos = modoManual
    ? objetivosManual.trim().length > 0
    : seleccionadas.size + objetivosCustom.length > 0

  const camposValidos = !!(
    form.nombreCliente.trim() && form.tipoProyecto.trim() &&
    form.duracionEstimada.trim() && form.presupuesto.trim() && hayObjetivos
  )

  const handleGenerar = async () => {
    if (!camposValidos) return
    setGenerando(true)
    setError(null)
    setPropuesta(null)
    try {
      const { data } = await api.post<PropuestaGenerada>("/ai/generar-propuesta", {
        nombreCliente:     form.nombreCliente,
        tipoProyecto:      form.tipoProyecto,
        duracionEstimada:  form.duracionEstimada,
        presupuesto:       form.presupuesto,
        objetivos:         objetivosEfectivos,
        contextoAdicional: form.contextoAdicional || undefined,
      })
      setPropuesta(data)
    } catch {
      setError("No se pudo generar la propuesta, intenta de nuevo")
    } finally {
      setGenerando(false)
    }
  }

  const handleCopiar = async () => {
    if (!propuesta) return
    const texto = SECCIONES.map(s =>
      `${s.emoji} ${s.label.toUpperCase()}\n${propuesta[s.key]}`
    ).join("\n\n---\n\n")
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2200)
  }

  const mostrarPills    = !modoManual && (cargandoSug || sugerencias.length > 0)
  const mostrarTextarea = modoManual  || (!cargandoSug && sugerencias.length === 0)

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "white", color: "#374151",
    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  }

  const labelBase: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: "#374151",
    fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 7,
  }

  const canSugerir = !cargandoSug && form.tipoProyecto.trim().length >= 3

  return (
    <div style={{ margin: "-24px -28px", background: "#f8fafc", minHeight: "100vh" }}>
      <style>{KEYFRAMES}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e2a3a 0%, #243650 60%, #1a3a5c 100%)",
        padding: "40px 36px 44px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(249,115,22,0.13) 0%, transparent 50%), radial-gradient(circle at 15% 80%, rgba(249,115,22,0.06) 0%, transparent 40%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "rgba(249,115,22,0.18)",
            border: "1px solid rgba(249,115,22,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={22} color="#f97316" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "white", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
              Propuestas Comerciales
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", fontFamily: "'DM Sans', sans-serif", margin: "4px 0 0" }}>
              Genera propuestas profesionales con inteligencia artificial en segundos
            </p>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div style={{ padding: "32px 36px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* ── LEFT: FORM 45% ── */}
        <div style={{ width: "45%", flexShrink: 0 }}>
          <div style={{
            background: "white", borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}>
            {/* Card header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "#fff7ed", border: "1px solid rgba(249,115,22,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText size={16} color="#f97316" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e2a3a", fontFamily: "'DM Sans', sans-serif" }}>
                  Nueva Propuesta
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>
                  Completa los campos para generar con IA
                </p>
              </div>
            </div>

            {/* Fields */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Nombre cliente */}
              <div>
                <label style={labelBase}>
                  Nombre del cliente <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={form.nombreCliente} onChange={set("nombreCliente")}
                  placeholder="Empresa S.A.S."
                  style={inputBase} onFocus={applyFocus} onBlur={applyBlur}
                />
              </div>

              {/* Tipo de proyecto + Sugerir */}
              <div>
                <label style={labelBase}>
                  Tipo de proyecto <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={form.tipoProyecto} onChange={set("tipoProyecto")}
                    placeholder="ej: Consultoría estratégica, Auditoría financiera..."
                    style={{ ...inputBase, flex: 1 }}
                    onFocus={applyFocus} onBlur={handleTipoBlur}
                  />
                  <button
                    type="button"
                    onClick={() => fetchSugerencias(form.tipoProyecto.trim())}
                    disabled={!canSugerir}
                    title="Sugerir objetivos con IA"
                    style={{
                      padding: "10px 14px", borderRadius: 10, flexShrink: 0,
                      border: "1.5px solid #f97316",
                      background: "white", color: "#f97316",
                      fontSize: 12, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: canSugerir ? "pointer" : "not-allowed",
                      opacity: canSugerir ? 1 : 0.4,
                      display: "flex", alignItems: "center", gap: 5,
                      transition: "all 0.15s", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => { if (canSugerir) e.currentTarget.style.background = "#fff7ed" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "white" }}
                  >
                    <Wand2 size={13} />
                    Sugerir
                  </button>
                </div>
              </div>

              {/* Duración */}
              <div>
                <label style={labelBase}>
                  Duración estimada <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={form.duracionEstimada} onChange={set("duracionEstimada")}
                  placeholder="ej: 3 meses, 6 semanas..."
                  style={inputBase} onFocus={applyFocus} onBlur={applyBlur}
                />
              </div>

              {/* Presupuesto */}
              <div>
                <label style={labelBase}>
                  Presupuesto aproximado <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={form.presupuesto} onChange={set("presupuesto")}
                  placeholder="ej: $50.000.000 COP"
                  style={inputBase} onFocus={applyFocus} onBlur={applyBlur}
                />
              </div>

              {/* ── OBJETIVOS ── */}
              <div>
                <label style={labelBase}>
                  Objetivos principales <span style={{ color: "#ef4444" }}>*</span>
                </label>

                {/* Loading indicator */}
                {cargandoSug && (
                  <div style={{
                    padding: "11px 14px", borderRadius: 10,
                    background: "#fff7ed", border: "1px solid rgba(249,115,22,0.22)",
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <Wand2 size={14} color="#f97316" style={{ animation: "spin 1.2s linear infinite", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#f97316", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                      Generando objetivos sugeridos con IA...
                    </span>
                  </div>
                )}

                {/* Suggestion pills */}
                {mostrarPills && !cargandoSug && sugerencias.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sugerencias.map((obj) => {
                        const activo = seleccionadas.has(obj)
                        return (
                          <button
                            key={obj} type="button"
                            onClick={() => toggleSugerida(obj)}
                            style={{
                              padding: "7px 13px", borderRadius: 20,
                              border: activo ? "1.5px solid #f97316" : "1.5px solid rgba(249,115,22,0.35)",
                              background: activo ? "#f97316" : "#fff7ed",
                              color: activo ? "white" : "#c2410c",
                              fontSize: 12, fontWeight: activo ? 600 : 400,
                              fontFamily: "'DM Sans', sans-serif",
                              cursor: "pointer", transition: "all 0.18s",
                              textAlign: "left", lineHeight: 1.4,
                            }}
                          >
                            {obj}
                          </button>
                        )
                      })}
                    </div>

                    {/* Custom objective input */}
                    <div style={{ display: "flex", gap: 7 }}>
                      <input
                        value={objetivoInput}
                        onChange={(e) => setObjetivoInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarCustom() } }}
                        placeholder="Agregar objetivo propio..."
                        style={{ ...inputBase, fontSize: 12, padding: "9px 12px", flex: 1 }}
                        onFocus={applyFocus} onBlur={applyBlur}
                      />
                      <button
                        type="button" onClick={agregarCustom}
                        disabled={!objetivoInput.trim()}
                        style={{
                          padding: "9px 14px", borderRadius: 10, border: "none",
                          background: objetivoInput.trim() ? "#f97316" : "rgba(249,115,22,0.2)",
                          color: "white", fontSize: 12, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          cursor: objetivoInput.trim() ? "pointer" : "not-allowed",
                          display: "flex", alignItems: "center", gap: 5,
                          flexShrink: 0, transition: "background 0.15s",
                        }}
                      >
                        <Plus size={13} />
                        Agregar
                      </button>
                    </div>

                    {/* Custom tags */}
                    {objetivosCustom.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {objetivosCustom.map((obj) => (
                          <span
                            key={obj}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "5px 11px", borderRadius: 20,
                              background: "#1e2a3a", color: "white",
                              fontSize: 11, fontWeight: 500,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {obj}
                            <button
                              type="button" onClick={() => quitarCustom(obj)}
                              style={{
                                background: "none", border: "none", padding: 0,
                                cursor: "pointer", color: "rgba(255,255,255,0.55)",
                                display: "flex", alignItems: "center", lineHeight: 1,
                              }}
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual textarea fallback */}
                {mostrarTextarea && (
                  <textarea
                    rows={4}
                    value={objetivosManual}
                    onChange={(e) => setObjetivosManual(e.target.value)}
                    placeholder="Describe los objetivos que el cliente quiere lograr..."
                    style={{ ...inputBase, resize: "none", lineHeight: 1.6 }}
                    onFocus={applyFocus} onBlur={applyBlur}
                  />
                )}
              </div>

              {/* Contexto adicional */}
              <div>
                <label style={labelBase}>
                  Contexto adicional
                  <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6, fontWeight: 400 }}>opcional</span>
                </label>
                <textarea
                  rows={3}
                  value={form.contextoAdicional} onChange={set("contextoAdicional")}
                  placeholder="Información extra relevante, sector, tamaño empresa..."
                  style={{ ...inputBase, resize: "none", lineHeight: 1.6 }}
                  onFocus={applyFocus} onBlur={applyBlur}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: "11px 14px", borderRadius: 10,
                  background: "#fef2f2", border: "1px solid #fecaca",
                  display: "flex", alignItems: "flex-start", gap: 9,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerar}
                disabled={generando || !camposValidos}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: generando || !camposValidos
                    ? "rgba(249,115,22,0.28)"
                    : "linear-gradient(135deg, #f97316 0%, #ea6c0a 100%)",
                  color: "white", fontSize: 14, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: generando || !camposValidos ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: generando || !camposValidos ? "none" : "0 4px 20px rgba(249,115,22,0.35)",
                  transition: "all 0.2s", marginTop: 4,
                }}
                onMouseEnter={(e) => {
                  if (!generando && camposValidos) {
                    e.currentTarget.style.transform = "scale(1.02)"
                    e.currentTarget.style.boxShadow = "0 6px 26px rgba(249,115,22,0.45)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)"
                  e.currentTarget.style.boxShadow = generando || !camposValidos ? "none" : "0 4px 20px rgba(249,115,22,0.35)"
                }}
              >
                {generando ? (
                  <>
                    <Wand2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Generando propuesta...
                  </>
                ) : (
                  <><Sparkles size={16} /> Generar Propuesta con IA</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: RESULT 55% ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">

            {/* Empty state */}
            {!propuesta && !generando && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: "white", borderRadius: 16,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  border: "1.5px dashed #e2e8f0",
                }}
              >
                <EmptyState />
              </motion.div>
            )}

            {/* Skeleton loaders */}
            {generando && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <SkeletonCard color="#1e2a3a" lines={3} />
                <SkeletonCard color="#059669" lines={4} />
                <SkeletonCard color="#f97316" lines={3} />
                <SkeletonCard color="#0284c7" lines={3} />
                <SkeletonCard color="#7c3aed" lines={2} />
              </motion.div>
            )}

            {/* Result cards */}
            {propuesta && !generando && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Copy button row */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                  <button
                    onClick={handleCopiar}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 18px", borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: copiado ? "#f0fdf4" : "white",
                      color: copiado ? "#16a34a" : "#374151",
                      fontSize: 13, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                      boxShadow: "0 1px 5px rgba(0,0,0,0.07)",
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={(e) => { if (!copiado) e.currentTarget.style.background = "#f8fafc" }}
                    onMouseLeave={(e) => { if (!copiado) e.currentTarget.style.background = "white" }}
                  >
                    {copiado ? <Check size={14} /> : <Copy size={14} />}
                    {copiado ? "¡Copiado!" : "Copiar propuesta"}
                  </button>
                </div>

                {/* Animated section cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {SECCIONES.map(({ key, icon: Icon, label, emoji, color }, index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.07 }}
                    >
                      <SeccionCard
                        emoji={emoji} icon={Icon} label={label}
                        contenido={propuesta[key]} color={color}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function SeccionCard({ emoji, icon: Icon, label, contenido, color }: {
  emoji: string; icon: React.ElementType; label: string; contenido: string; color: string
}) {
  return (
    <div style={{
      background: "white", borderRadius: 12,
      borderLeft: `4px solid ${color}`,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px",
        background: color,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} color="white" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "'DM Sans', sans-serif" }}>
          {emoji} {label}
        </span>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <p style={{
          margin: 0, fontSize: 14, color: "#374151",
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75,
          whiteSpace: "pre-wrap",
        }}>
          {contenido}
        </p>
      </div>
    </div>
  )
}
