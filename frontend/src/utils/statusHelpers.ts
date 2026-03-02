export function isCompromisoVencido(
  fechaActual: string,
  estado: string
) {
  if (estado === "CUMPLIDO") return false

  return new Date(fechaActual) < new Date()
}

export function calcularProgresoEntregables(
  entregables: any[]
) {
  if (!entregables.length) return 0

  const completados = entregables.filter(
    (e) => e.estado === "COMPLETADO"
  ).length

  return Math.round(
    (completados / entregables.length) * 100
  )
}