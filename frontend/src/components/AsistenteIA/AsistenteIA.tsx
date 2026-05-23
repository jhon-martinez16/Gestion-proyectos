import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "../../services/api"

interface Mensaje {
  role: "user" | "assistant"
  content: string
}

interface Props {
  project: any
  entregables: any[]
  compromisos: any[]
}

const PREGUNTAS_RAPIDAS = [
  "¿Cuál es el riesgo más crítico?",
  "¿Qué compromisos están por vencer?",
  "¿Cómo está el avance general?",
]

function buildContexto(project: any, entregables: any[], compromisos: any[]) {
  return {
    nombre: project?.nombre,
    estado: project?.estado,
    etapa: project?.etapa,
    fechaInicio: project?.fechaInicio,
    fechaFin: project?.fechaFin,
    lider: project?.lider?.nombre ?? project?.liderId,
    socio2: project?.socio2?.nombre ?? project?.socio2Id,
    ultimos5Entregables: entregables.slice(0, 5).map((e) => ({
      nombre: e.nombre,
      estado: e.estado,
      fechaEntrega: e.fechaEntrega,
    })),
    ultimos5Compromisos: compromisos.slice(0, 5).map((c) => ({
      descripcion: c.descripcion,
      fechaActual: c.fechaActual,
      estado: c.estado,
    })),
  }
}

export default function AsistenteIA({ project, entregables, compromisos }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState("")
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 300)
    } else {
      setMensajes([])
      setInput("")
    }
  }, [abierto])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes, cargando])

  const enviar = async (texto: string) => {
    const textoFinal = texto.trim()
    if (!textoFinal || cargando) return

    const nuevoMensaje: Mensaje = { role: "user", content: textoFinal }
    const nuevoHistorial = [...mensajes, nuevoMensaje]
    setMensajes(nuevoHistorial)
    setInput("")
    setCargando(true)

    try {
      const contextoProyecto = buildContexto(project, entregables, compromisos)
      const { data } = await api.post<string>("/ai/chat", {
        mensaje: textoFinal,
        historial: mensajes,
        contextoProyecto,
      })
      setMensajes([...nuevoHistorial, { role: "assistant", content: data }])
    } catch {
      setMensajes([
        ...nuevoHistorial,
        { role: "assistant", content: "Lo siento, ocurrió un error. Intenta de nuevo." },
      ])
    } finally {
      setCargando(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar(input)
    }
  }

  const sinMensajes = mensajes.length === 0

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setAbierto((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 20px",
          borderRadius: 50,
          border: "none",
          background: abierto ? "#1e2a3a" : "var(--primary, #f97316)",
          color: "white",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
          transition: "background 0.2s",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🤖</span>
        {abierto ? "Cerrar" : "Asistente"}
      </motion.button>

      {/* Panel lateral */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 380,
              zIndex: 999,
              background: "#1e2a3a",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-6px 0 32px rgba(0,0,0,0.28)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(249,115,22,0.18)",
                  border: "1px solid rgba(249,115,22,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  Asistente IA
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.45)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project?.nombre ?? "Proyecto"}
                </p>
              </div>
              <button
                onClick={() => setAbierto(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 20,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 4,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Área de mensajes */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 16px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {sinMensajes && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.45)",
                      textAlign: "center",
                      margin: "8px 0 12px",
                    }}
                  >
                    Hola 👋 Puedo ayudarte a analizar este proyecto.
                    <br />
                    Prueba una pregunta rápida:
                  </p>
                  {PREGUNTAS_RAPIDAS.map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => enviar(p)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(249,115,22,0.14)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                      }
                    >
                      {p}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {mensajes.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "10px 13px",
                      borderRadius:
                        m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                      background:
                        m.role === "user" ? "var(--primary, #f97316)" : "#2d3e50",
                      color: "white",
                      fontSize: 13,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {cargando && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "14px 14px 14px 3px",
                      background: "#2d3e50",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.18 }}
                        style={{
                          display: "inline-block",
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu pregunta..."
                disabled={cargando}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.07)",
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => enviar(input)}
                disabled={cargando || !input.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "none",
                  background:
                    cargando || !input.trim()
                      ? "rgba(249,115,22,0.3)"
                      : "var(--primary, #f97316)",
                  color: "white",
                  fontSize: 17,
                  cursor: cargando || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                ➤
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
