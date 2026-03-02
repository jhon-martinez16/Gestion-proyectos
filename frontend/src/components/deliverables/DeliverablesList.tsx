import Badge from "../ui/Badge"

type Estado =
  | "COMPLETADO"
  | "PENDIENTE"
  | "URGENTE"
  | "VENCIDO"

interface Deliverable {
  id: number
  nombre: string
  estado: Estado
  fechaEntrega: string
}

interface Props {
  entregables: Deliverable[]
}

export default function DeliverablesList({
  entregables,
}: Props) {
  return (
    <div className="space-y-4">
      {entregables.map((e) => {
        const variant: "success" | "warning" | "danger" | "info" =
          e.estado === "COMPLETADO"
            ? "success"
            : e.estado === "PENDIENTE"
            ? "warning"
            : e.estado === "URGENTE" || e.estado === "VENCIDO"
            ? "danger"
            : "info"

        return (
          <div
            key={e.id}
            className="bg-white p-4 rounded shadow"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{e.nombre}</h3>

              <Badge variant={variant}>
                {e.estado}
              </Badge>
            </div>

            <p className="text-sm mt-2 text-gray-500">
              {new Date(e.fechaEntrega).toLocaleDateString("es-CO")}
            </p>
          </div>
        )
      })}
    </div>
  )
}