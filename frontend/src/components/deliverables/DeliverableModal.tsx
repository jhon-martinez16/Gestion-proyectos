import { useState } from "react"
import Modal from "../ui/Modal"
import { api } from "../../services/api"

export default function DeliverableModal({
  proyectoId,
  onClose,
}: any) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] =
    useState("")
  const [fecha, setFecha] = useState("")

  const handleSubmit = async () => {
    await api.post("/entregables", {
      nombre,
      descripcion,
      fechaEntrega: fecha,
      proyectoId,
    })

    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">
        Nuevo Entregable
      </h2>

      <input
        placeholder="Nombre"
        className="w-full border p-2 mb-3"
        value={nombre}
        onChange={(e) =>
          setNombre(e.target.value)
        }
      />

      <textarea
        placeholder="Descripción"
        className="w-full border p-2 mb-3"
        value={descripcion}
        onChange={(e) =>
          setDescripcion(e.target.value)
        }
      />

      <input
        type="date"
        className="w-full border p-2 mb-4"
        value={fecha}
        onChange={(e) =>
          setFecha(e.target.value)
        }
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Crear
      </button>
    </Modal>
  )
}