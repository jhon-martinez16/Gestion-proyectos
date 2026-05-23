import { useState } from "react"
import { api } from "../../services/api"
import { Sparkles, Loader2 } from "lucide-react"

interface Props {
  contextoProyecto: { nombre: string; estado: string }
  onUsar: (objetivos: string, proximosPasos: string) => void
  onCancelar: () => void
}

export default function GenerarActaModal({ contextoProyecto, onUsar, onCancelar }: Props) {
  const [resumen, setResumen] = useState("")
  const [generando, setGenerando] = useState(false)
  const [resultado, setResultado] = useState<{ objetivos: string; proximos_pasos: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerar = async () => {
    if (!resumen.trim()) return
    setGenerando(true)
    setError(null)
    setResultado(null)

    try {
      const { data } = await api.post<{ objetivos: string; proximos_pasos: string }>("/ai/generar-acta", {
        resumenInformal: resumen,
        contextoProyecto,
      })
      setResultado(data)
    } catch {
      setError("No se pudo conectar con el asistente, intenta de nuevo")
    } finally {
      setGenerando(false)
    }
  }

  return (
    /* Overlay */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar() }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 460,
          background: "white", borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid var(--card-border)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(249,115,22,0.10)",
            border: "1px solid rgba(249,115,22,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={15} color="var(--accent, #f97316)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
              Asistente IA — Generar acta
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              {contextoProyecto.nombre}
            </p>
          </div>
          <button
            onClick={onCancelar}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "var(--text-muted)", fontSize: 20, cursor: "pointer",
              lineHeight: 1, padding: 4, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Textarea resumen */}
          {!resultado && (
            <div>
              <label style={{
                fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 7,
              }}>
                ¿Qué pasó en la reunión? <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Ej: Hablamos de los entregables pendientes, el cliente pidió adelantar la fecha del informe y acordamos una reunión para el próximo viernes..."
                value={resumen}
                onChange={(e) => setResumen(e.target.value)}
                disabled={generando}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1.5px solid var(--card-border)",
                  background: "var(--content-bg)", color: "var(--text-primary)",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  outline: "none", resize: "none", lineHeight: 1.55,
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                  opacity: generando ? 0.6 : 1,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
              />
            </div>
          )}

          {/* Spinner */}
          {generando && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0" }}>
              <Loader2
                size={20}
                color="var(--accent, #f97316)"
                style={{ animation: "spin 0.9s linear infinite" }}
              />
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                Generando acta...
              </span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "#fef2f2", border: "1px solid #fecaca",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </p>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ResultadoField label="Objetivos sugeridos" value={resultado.objetivos} />
              <ResultadoField label="Próximos pasos sugeridos" value={resultado.proximos_pasos} />
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              onClick={onCancelar}
              style={{
                padding: "8px 18px", borderRadius: 10,
                border: "1.5px solid var(--card-border)",
                background: "white", color: "var(--text-secondary)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--content-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              Cancelar
            </button>

            {!resultado ? (
              <button
                onClick={handleGenerar}
                disabled={generando || !resumen.trim()}
                style={{
                  padding: "8px 18px", borderRadius: 10, border: "none",
                  background: generando || !resumen.trim() ? "rgba(249,115,22,0.35)" : "var(--accent, #f97316)",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: generando || !resumen.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "opacity 0.15s",
                }}
              >
                <Sparkles size={13} />
                Generar
              </button>
            ) : (
              <button
                onClick={() => onUsar(resultado.objetivos, resultado.proximos_pasos)}
                style={{
                  padding: "8px 18px", borderRadius: 10, border: "none",
                  background: "var(--accent, #f97316)",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Usar esto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultadoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
        fontFamily: "'DM Sans', sans-serif",
        textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px",
      }}>
        {label}
      </p>
      <div style={{
        padding: "10px 13px", borderRadius: 10,
        background: "rgba(249,115,22,0.05)",
        border: "1px solid rgba(249,115,22,0.18)",
      }}>
        <p style={{
          margin: 0, fontSize: 13, color: "var(--text-primary)",
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}>
          {value}
        </p>
      </div>
    </div>
  )
}
