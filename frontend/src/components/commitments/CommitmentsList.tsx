import Badge from "../ui/Badge"
import { isCompromisoVencido } from "../../utils/statusHelpers"

interface Props {
  commitments: any[]
}

export default function CommitmentsList({ commitments }: Props) {
  return (
    <div className="space-y-4">
      {commitments.map((c) => {
        const vencido = isCompromisoVencido(
          c.fechaActual,
          c.estado
        )

        let variant: "success" | "warning" | "danger" | "info" = "info"

        if (c.estado === "CUMPLIDO") variant = "success"
        else if (vencido) variant = "danger"
        else if (c.estado === "REPROGRAMADO") variant = "warning"

        return (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                {c.descripcion}
              </h3>

              <Badge variant={variant}>
                {vencido ? "VENCIDO" : c.estado}
              </Badge>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Fecha actual:{" "}
              {new Date(c.fechaActual).toLocaleDateString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}