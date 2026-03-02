import { useEffect, useState } from "react"
import { api } from "../services/api"

interface Proyecto {
  id: number
}

interface Compromiso {
  id: number
  estado: string
  fechaActual: string
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          api.get("/proyectos"),
          api.get("/compromisos"),
        ])

        setProjects(pRes.data)
        setCompromisos(cRes.data)
      } catch (error) {
        console.error("Error cargando dashboard:", error)
      }
    }

    load()
  }, [])

  /* ============================
     MÉTRICAS DERIVADAS
  ============================ */

  const totalCompromisos = compromisos.length

  const cumplidos = compromisos.filter(
    (c) => c.estado === "CUMPLIDO"
  ).length

  const activos = compromisos.filter(
    (c) => c.estado !== "CUMPLIDO"
  ).length

  const vencidos = compromisos.filter(
  (c) =>
    c.estado === "PENDIENTE" &&
    new Date(c.fechaActual) <= new Date()
  ).length

  return (
    <div className="space-y-10 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER */}
      <div className="bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-[#14532D]">
          Dashboard General
        </h1>
        <p className="text-green-900/70 mt-2">
          Vista consolidada del estado de proyectos y compromisos.
        </p>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card title="Total Proyectos" value={projects.length} />
        <Card title="Total Compromisos" value={totalCompromisos} />
        <Card
          title="Compromisos Vencidos"
          value={vencidos}
          highlight="danger"
        />
      </div>

      {/* MÉTRICAS SECUNDARIAS */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card
          title="Compromisos Activos"
          value={activos}
          highlight="info"
        />

        <Card
          title="Compromisos Cerrados"
          value={cumplidos}
          highlight="success"
        />
      </div>

    </div>
  )
}

/* ============================
   COMPONENTE CARD PROFESIONAL
============================ */

function Card({
  title,
  value,
  highlight,
}: {
  title: string
  value: number
  highlight?: "danger" | "success" | "info"
}) {
  const highlightStyles = {
    danger: "border-red-200 bg-red-50 text-red-600",
    success: "border-green-200 bg-green-50 text-green-600",
    info: "border-blue-200 bg-blue-50 text-blue-600",
  }

  const style =
    highlight ? highlightStyles[highlight] : "border-green-100"

  return (
    <div
      className={`p-8 rounded-2xl border shadow-sm transition hover:shadow-md bg-white ${style}`}
    >
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p
        className={`text-4xl font-bold mt-2 ${
          highlight ? "" : "text-[#14532D]"
        }`}
      >
        {value}
      </p>
    </div>
  )
}