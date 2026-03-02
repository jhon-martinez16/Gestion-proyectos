import Modal from "../ui/Modal"

export default function CompromisoUrgenteModal({
  compromiso,
}: any) {
  return (
    <Modal onClose={() => {}}>
      <h2 className="text-xl font-bold text-red-600">
        Compromiso vencido
      </h2>

      <p className="mt-4">
        {compromiso.descripcion}
      </p>

      <p className="text-sm mt-2">
        Debe resolverse antes de continuar.
      </p>
    </Modal>
  )
}