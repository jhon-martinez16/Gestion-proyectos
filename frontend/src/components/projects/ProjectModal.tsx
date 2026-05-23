import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check, FolderOpen, Users, CalendarDays,
  FileText, Calculator, AlertCircle, ChevronLeft,
  ChevronRight, X, Pencil,
} from "lucide-react"
import { api } from "../../services/api"
import SmartToggle from "../ui/SmartToggle"

interface ProyectoEditable {
  id: string; nombre: string; descripcion: string; fechaFin: string
}

interface Props {
  onClose: () => void
  proyecto?: ProyectoEditable
}

// ── Helpers ────────────────────────────────────────────────────────
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function formatDateLabel(isoStr: string) {
  if (!isoStr) return "—"
  return new Date(isoStr + "T00:00:00").toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function avatarBg(name: string) {
  const colors = ["#6366F1","#0EA5E9","#10B981","#F59E0B","#EC4899","#8B5CF6"]
  return colors[name.charCodeAt(0) % colors.length]
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

// ── Step Indicator ─────────────────────────────────────────────────
const STEPS = ["Información básica", "Equipo y fechas", "Confirmación"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 0, padding: "20px 24px 0",
    }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <motion.div
              animate={{
                background: i < current ? "var(--primary)" : i === current ? "var(--navy)" : "#e2e8f0",
                border: i === current ? "2px solid var(--navy)" : "2px solid transparent",
              }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: i <= current ? "white" : "#94a3b8",
                fontSize: 13, fontWeight: 700,
                transition: "all 0.2s ease",
              }}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </motion.div>
            <span style={{
              fontSize: 11, fontWeight: i === current ? 600 : 400,
              color: i === current ? "var(--navy)" : i < current ? "var(--primary)" : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <motion.div
              animate={{ background: i < current ? "var(--primary)" : "#e2e8f0" }}
              style={{ width: 64, height: 2, margin: "0 8px", marginBottom: 20, transition: "background 0.3s ease" }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Form Field ─────────────────────────────────────────────────────
function FormField({
  label, required, optional, children, hint,
}: {
  label: string; required?: boolean; optional?: boolean
  children: React.ReactNode; hint?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 13, fontWeight: 500, color: "var(--text-secondary)",
        marginBottom: 6,      }}>
        {label}
        {required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
        {optional && (
          <span style={{
            fontSize: 11, fontWeight: 400, color: "#9ca3af",
            background: "#f3f4f6", padding: "1px 6px", borderRadius: 4,
          }}>
            opcional
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p style={{
          fontSize: 11, color: "var(--text-muted)", marginTop: 4,
        }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ── Calculated Date Field ──────────────────────────────────────────
function CalculatedDateField({
  value, manual, onToggleManual, onManualChange,
}: {
  value: string; manual: boolean
  onToggleManual: () => void; onManualChange: (v: string) => void
}) {
  return (
    <div>
      {!manual ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          background: "#f8fafc", border: "1.5px solid #e2e8f0",
          borderRadius: "var(--radius-md)",
        }}>
          <Calculator size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: 14, fontWeight: 500, color: "var(--text-primary)",
            }}>
              {value ? formatDateLabel(value) : "—"}
            </span>
            <p style={{
              fontSize: 11, color: "var(--text-muted)", marginTop: 1,
            }}>
              Calculado: 6 meses después del inicio
            </p>
          </div>
          <button
            onClick={onToggleManual}
            style={{
              fontSize: 12, fontWeight: 600, color: "var(--navy)",
              background: "rgba(30,58,110,0.08)",
              border: "none", borderRadius: 6,
              padding: "5px 10px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <Pencil size={11} /> Ajustar
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 6, padding: "6px 10px",
            background: "var(--warning-light)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "var(--radius-sm)",
          }}>
            <AlertCircle size={13} color="var(--warning)" />
            <span style={{
              fontSize: 11, color: "#92400e",
            }}>
              Usando fecha personalizada
            </span>
            <button
              onClick={onToggleManual}
              style={{
                marginLeft: "auto", fontSize: 11, color: "var(--warning)",
                background: "none", border: "none", cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Restaurar automático
            </button>
          </div>
          <input
            type="date"
            value={value}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => onManualChange(e.target.value)}
            className="form-input"
          />
        </div>
      )}
    </div>
  )
}

// ── Summary Card ───────────────────────────────────────────────────
function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start",
      padding: "10px 0",
      borderBottom: "1px solid var(--card-border)",
    }}>
      <span style={{
        width: 140, fontSize: 12, color: "var(--text-muted)", flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1,
        fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
      }}>
        {value || "—"}
      </span>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export default function ProjectModal({ onClose, proyecto }: Props) {
  const editando = !!proyecto

  // ── Form state ──
  const [nombre,      setNombre]      = useState(proyecto?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion ?? "")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin,    setFechaFin]    = useState(proyecto?.fechaFin ? proyecto.fechaFin.slice(0, 10) : "")
  const [categoriaId, setCategoriaId] = useState("")
  const [liderId,     setLiderId]     = useState("")
  const [socio2Id,    setSocio2Id]    = useState("")
  const [contrato,    setContrato]    = useState(false)
  const [poliza,      setPoliza]      = useState(false)
  const [manualDate,  setManualDate]  = useState(false)

  // ── Data ──
  const [categorias, setCategorias] = useState<any[]>([])
  const [usuarios,   setUsuarios]   = useState<any[]>([])
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)

  // ── Wizard ──
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (editando) return
    Promise.all([api.get("/categorias"), api.get("/usuarios/asignables")]).then(([cat, usr]) => {
      setCategorias(cat.data); setUsuarios(usr.data)
    })
  }, [editando])

  // Auto-calculate fechaFin (+6 months) unless manual override
  useEffect(() => {
    if (editando || !fechaInicio || manualDate) return
    setFechaFin(addMonths(fechaInicio, 6))
  }, [fechaInicio, manualDate, editando])

  // ── Validation per step ──
  const today = new Date().toISOString().split("T")[0]
  const step1Valid = nombre.trim() && (editando || categoriaId)
  const step2Valid = editando
    ? !!fechaFin && fechaFin >= today
    : (!!fechaInicio && fechaInicio >= today && !!fechaFin && fechaFin >= fechaInicio && !!liderId && !!socio2Id)

  // ── Submit ──
  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      if (editando) {
        await api.patch(`/proyectos/${proyecto!.id}`, { nombre, descripcion, fechaFin })
      } else {
        await api.post("/proyectos", {
          nombre, descripcion, fechaInicio, fechaFin, categoriaId, liderId, socio2Id,
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el proyecto.")
      if (!editando) setStep(0)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived for summary ──
  const categoriaLabel  = categorias.find(c => c.id === categoriaId)?.nombre ?? "—"
  const liderObj        = usuarios.find(u => u.id === liderId)
  const socio2Obj       = usuarios.find(u => u.id === socio2Id)

  // ── EDIT MODE (simple form, no wizard) ──
  if (editando) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
      }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 4 }}
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
          style={{
            background: "white", borderRadius: "var(--radius-xl)",
            width: "min(520px, calc(100vw - 32px))",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 24px 80px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}
        >
          {/* Accent bar orange = edit */}
          <div style={{ height: 4, background: "linear-gradient(90deg, var(--accent), #fb923c)" }} />

          <div style={{ padding: "24px 24px 8px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "var(--accent-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Pencil size={17} color="var(--accent)" />
                </div>
                <h2 style={{
                  fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
                  margin: 0,
                }}>
                  Editar Proyecto
                </h2>
              </div>
              <button onClick={onClose} style={{
                width: 30, height: 30, borderRadius: 7,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-muted)",
              }}>
                <X size={14} />
              </button>
            </div>

            <FormField label="Nombre del proyecto" required>
              <input value={nombre} onChange={e => setNombre(e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Descripción" optional>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="form-input" rows={3} />
            </FormField>
            <FormField label="Fecha estimada de finalización" required>
              <input type="date" value={fechaFin} min={new Date().toISOString().split("T")[0]} onChange={e => setFechaFin(e.target.value)} className="form-input" />
            </FormField>
          </div>

          <div style={{ padding: "16px 24px 24px", borderTop: "1px solid var(--card-border)", marginTop: 8 }}>
            {error && (
              <p style={{ fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>
                {error}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={onClose} className="btn-secondary">Cancelar</button>
              <button
                onClick={handleSubmit}
                disabled={loading || !nombre.trim() || !fechaFin}
                className="btn-primary"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── CREATE WIZARD ──────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
    }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 4 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        style={{
          background: "white",
          borderRadius: "var(--radius-xl)",
          width: "min(580px, calc(100vw - 32px))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 32px 100px rgba(0,0,0,0.22)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Accent bar — navy = create */}
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--navy), var(--navy-light, #2d4f8e))", flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(30,58,110,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FolderOpen size={17} color="var(--navy)" />
            </div>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
              margin: 0,
            }}>
              Nuevo Proyecto
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 7,
            background: "var(--content-bg)", border: "1px solid var(--card-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--text-muted)",
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Basic info ── */}
            {step === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <FormField label="Nombre del proyecto" required>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="form-input"
                    placeholder="Ej: Plataforma digital corporativa"
                    autoFocus
                  />
                </FormField>

                <FormField label="Descripción" optional>
                  <textarea
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="form-input"
                    placeholder="Contexto del proyecto, objetivos principales…"
                    rows={3}
                  />
                </FormField>

                <FormField label="Categoría" required>
                  <select
                    value={categoriaId}
                    onChange={e => setCategoriaId(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: 36 }}
                  >
                    <option value="">Seleccionar categoría…</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </FormField>

                {/* Toggles */}
                <div style={{
                  marginTop: 20, padding: "16px",
                  background: "var(--content-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-md)",
                  display: "flex", flexDirection: "column", gap: 16,
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: -4,
                  }}>
                    Requerimientos iniciales
                  </p>
                  <SmartToggle
                    checked={contrato}
                    onChange={setContrato}
                    labelOn="Requiere contrato"
                    labelOff="Sin contrato requerido"
                    description="Se requerirá firma antes del Kick-off"
                  />
                  <AnimatePresence>
                    {contrato && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          overflow: "hidden",
                          margin: "-8px 0",
                        }}
                      >
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 8,
                          padding: "10px 12px",
                          background: "rgba(30,58,110,0.06)",
                          border: "1px solid rgba(30,58,110,0.15)",
                          borderRadius: "var(--radius-sm)",
                          marginTop: 4,
                        }}>
                          <AlertCircle size={13} color="var(--navy)" style={{ marginTop: 1, flexShrink: 0 }} />
                          <span style={{
                            fontSize: 12, color: "var(--navy)",
                          }}>
                            El proyecto no avanzará a Kick-off sin contrato firmado.
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ height: 1, background: "var(--card-border)" }} />

                  <SmartToggle
                    checked={poliza}
                    onChange={setPoliza}
                    labelOn="Requiere póliza"
                    labelOff="Sin póliza requerida"
                    description="Documento de garantía o seguro del proyecto"
                  />
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Team + Dates ── */}
            {step === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <FormField label="Líder del proyecto" required>
                    <select
                      value={liderId}
                      onChange={e => setLiderId(e.target.value)}
                      className="form-input"
                      style={{ paddingRight: 36 }}
                    >
                      <option value="">Seleccionar líder…</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Socio 2" required>
                    <select
                      value={socio2Id}
                      onChange={e => setSocio2Id(e.target.value)}
                      className="form-input"
                      style={{ paddingRight: 36 }}
                    >
                      <option value="">Seleccionar Socio 2…</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Selected team preview */}
                {(liderId || socio2Id) && (
                  <div style={{
                    display: "flex", gap: 8, marginBottom: 16, marginTop: -4,
                  }}>
                    {[liderObj, socio2Obj].filter(Boolean).map((u: any, i) => (
                      <div key={u.id} style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "5px 10px",
                        background: "var(--content-bg)",
                        border: "1px solid var(--card-border)",
                        borderRadius: 20,
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: avatarBg(u.nombre),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 700, color: "white",
                        }}>
                          {initials(u.nombre)}
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 500, color: "var(--text-primary)",
                        }}>
                          {u.nombre}
                        </span>
                        <span style={{
                          fontSize: 10, color: "var(--text-muted)",
                        }}>
                          {i === 0 ? "Líder" : "Socio 2"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <FormField label="Fecha de inicio" required>
                  <input
                    type="date"
                    value={fechaInicio}
                    min={today}
                    onChange={e => { setFechaInicio(e.target.value); setManualDate(false) }}
                    className="form-input"
                  />
                </FormField>

                <FormField
                  label="Fecha estimada de finalización"
                  hint={!manualDate ? "Calculada automáticamente a partir del inicio." : undefined}
                >
                  <CalculatedDateField
                    value={fechaFin}
                    manual={manualDate}
                    onToggleManual={() => setManualDate(v => !v)}
                    onManualChange={setFechaFin}
                  />
                </FormField>
              </motion.div>
            )}

            {/* ── STEP 3: Confirmation ── */}
            {step === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{
                  background: "rgba(30,58,110,0.04)",
                  border: "1px solid rgba(30,58,110,0.12)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 18px",
                  marginBottom: 16,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                  }}>
                    <FolderOpen size={16} color="var(--navy)" />
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: "var(--navy)",
                    }}>
                      {nombre}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(30,58,110,0.1)", paddingTop: 12 }}>
                    <SummaryRow label="Categoría" value={categoriaLabel} />
                    <SummaryRow label="Líder" value={liderObj?.nombre ?? "—"} />
                    <SummaryRow label="Socio 2" value={socio2Obj?.nombre ?? "—"} />
                    <SummaryRow label="Inicio" value={formatDateLabel(fechaInicio)} mono />
                    <SummaryRow label="Fin estimado" value={formatDateLabel(fechaFin)} mono />
                    {descripcion && <SummaryRow label="Descripción" value={descripcion} />}
                    {contrato && <SummaryRow label="Contrato" value="✓ Requerido" />}
                    {poliza && <SummaryRow label="Póliza" value="✓ Requerida" />}
                  </div>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px",
                  background: "var(--primary-light)",
                  border: "1px solid rgba(22,163,74,0.2)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <Check size={14} color="var(--primary)" />
                  <span style={{
                    fontSize: 12, color: "var(--primary-dark)",
                  }}>
                    Todo listo. Haz clic en "Crear Proyecto" para continuar.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with navigation */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--card-border)",
          background: "white",
          flexShrink: 0,
        }}>
          {error && (
            <p style={{
              fontSize: 13, color: "var(--danger)", marginBottom: 12,
            }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <button
              onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
              className="btn-secondary"
              style={{ gap: 5, display: "flex", alignItems: "center" }}
            >
              {step === 0 ? (
                "Cancelar"
              ) : (
                <><ChevronLeft size={14} /> Anterior</>
              )}
            </button>

            {step < 2 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !step1Valid : !step2Valid}
                className="btn-primary"
                style={{
                  background: "var(--navy, #1e3a6e)",
                  display: "flex", alignItems: "center", gap: 5,
                  opacity: (step === 0 ? !step1Valid : !step2Valid) ? 0.5 : 1,
                  cursor: (step === 0 ? !step1Valid : !step2Valid) ? "not-allowed" : "pointer",
                  transform: "none",
                  boxShadow: "none",
                }}
              >
                Siguiente <ChevronRight size={14} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(22,163,74,0.35)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {loading ? "Creando…" : (
                  <><Check size={14} /> Crear Proyecto</>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
