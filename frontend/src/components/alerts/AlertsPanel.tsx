import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

interface Alerta {
  tipo: string
  mensaje: string
  proyectoId: string
  proyectoNombre: string
  nivel: "CRITICA" | "MEDIA"
}

interface Props {
  alertas: Alerta[]
  onClose: () => void
}

export default function AlertsPanel({ alertas, onClose }: Props) {
  const navigate = useNavigate()
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set())

  const descartar = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDescartadas((prev) => new Set([...prev, key]))
  }

  const alertaKey = (a: Alerta, i: number) => `${a.tipo}-${a.proyectoId}-${i}`

  const visibles = alertas.filter((a, i) => !descartadas.has(alertaKey(a, i)))
  const criticas = visibles.filter((a) => a.nivel === "CRITICA")
  const medias   = visibles.filter((a) => a.nivel === "MEDIA")

  const handleClick = (proyectoId: string) => {
    onClose()
    navigate(`/projects/${proyectoId}`)
  }

  // Group by project
  const groupByProject = (list: Alerta[]) => {
    const map: Record<string, Alerta[]> = {}
    list.forEach((a) => {
      if (!map[a.proyectoId]) map[a.proyectoId] = []
      map[a.proyectoId].push(a)
    })
    return map
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />

        <motion.div
          key="panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25 }}
          className="fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#0B355A] text-white px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Alertas del sistema</h2>
              <p className="text-xs text-white/60 mt-0.5">{visibles.length} alerta{visibles.length !== 1 ? "s" : ""} activa{visibles.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {visibles.length === 0 && (
              <p className="text-center text-gray-400 mt-10 text-sm">No hay alertas activas.</p>
            )}

            {criticas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-red-600 tracking-wider">
                  Críticas ({criticas.length})
                </h3>
                {Object.entries(groupByProject(criticas)).map(([proyectoId, alertasProyecto]) => (
                  <div key={proyectoId} className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleClick(proyectoId)}
                      className="w-full text-left px-3 py-2 bg-red-100 hover:bg-red-200 transition"
                    >
                      <p className="text-sm font-semibold text-red-700">{alertasProyecto[0].proyectoNombre}</p>
                    </button>
                    {alertasProyecto.map((a, i) => {
                      const key = alertaKey(a, alertas.indexOf(a))
                      return (
                        <div key={i} className="flex items-start justify-between gap-2 px-3 py-2 border-t border-red-100">
                          <p className="text-xs text-red-600 flex-1">{a.mensaje}</p>
                          <button
                            onClick={(e) => descartar(key, e)}
                            className="shrink-0 text-red-400 hover:text-red-600 text-xs leading-none"
                            title="Descartar"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {medias.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-yellow-600 tracking-wider">
                  Advertencias ({medias.length})
                </h3>
                {Object.entries(groupByProject(medias)).map(([proyectoId, alertasProyecto]) => (
                  <div key={proyectoId} className="bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleClick(proyectoId)}
                      className="w-full text-left px-3 py-2 bg-yellow-100 hover:bg-yellow-200 transition"
                    >
                      <p className="text-sm font-semibold text-yellow-700">{alertasProyecto[0].proyectoNombre}</p>
                    </button>
                    {alertasProyecto.map((a, i) => {
                      const key = alertaKey(a, alertas.indexOf(a))
                      return (
                        <div key={i} className="flex items-start justify-between gap-2 px-3 py-2 border-t border-yellow-100">
                          <p className="text-xs text-yellow-600 flex-1">{a.mensaje}</p>
                          <button
                            onClick={(e) => descartar(key, e)}
                            className="shrink-0 text-yellow-400 hover:text-yellow-600 text-xs leading-none"
                            title="Descartar"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
