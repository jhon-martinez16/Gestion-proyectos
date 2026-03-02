import clsx from "clsx"

interface Props {
  estado: "PENDIENTE" | "CUMPLIDO" | "NO_CUMPLIDO" | "REPROGRAMADO"
}

export default function CommitmentBadge({ estado }: Props) {
  const styles = {
    PENDIENTE: "bg-gray-100 text-gray-700",
    CUMPLIDO: "bg-emerald-100 text-emerald-700",
    NO_CUMPLIDO: "bg-red-100 text-red-700",
    REPROGRAMADO: "bg-yellow-100 text-yellow-800",
  }

  return (
    <span
      className={clsx(
        "px-3 py-1 text-xs rounded-full font-semibold shadow-sm transition-all",
        styles[estado]
      )}
    >
      {estado.replace("_", " ")}
    </span>
  )
}