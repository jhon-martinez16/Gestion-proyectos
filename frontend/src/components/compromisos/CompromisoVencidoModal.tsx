import { useState } from "react";
import { api } from "../../services/api";

interface Props {
  compromiso: any;
  onClose: () => void;
}

export default function CompromisoVencidoModal({ compromiso, onClose }: Props) {
  const [decision, setDecision] = useState<"CUMPLIDO" | "NO_CUMPLIDO" | "REPROGRAMAR" | null>(null);
  const [comentario, setComentario] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!decision) {
      setError("Debe seleccionar una decisión.");
      return;
    }

    if (decision === "NO_CUMPLIDO") {
      if (!comentario || !nuevaDescripcion || !nuevaFecha) {
        setError("Debe completar comentario, nueva descripción y nueva fecha.");
        return;
      }
    }

    if (decision === "REPROGRAMAR") {
      if (!nuevaFecha) {
        setError("Debe indicar la nueva fecha para reprogramar.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const payload: any = { decision };

      if (decision === "NO_CUMPLIDO") {
        payload.comentario = comentario;
        payload.nuevaDescripcion = nuevaDescripcion;
        payload.nuevaFecha = nuevaFecha;
      }

      if (decision === "REPROGRAMAR") {
        payload.nuevaFecha = nuevaFecha;
      }

      await api.patch(`/compromisos/${compromiso.id}/resolver`, payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al actualizar el compromiso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#16283C] rounded-3xl p-8 w-full max-w-lg text-white space-y-6 shadow-2xl border border-white/10">
        <h2 className="text-2xl font-bold">Compromiso Vencido</h2>
        <p className="text-[#9FB3C8]">{compromiso.descripcion}</p>
        <p className="text-sm text-[#9FB3C8] mt-1">
          Fecha: {new Date(compromiso.fechaActual).toLocaleDateString()}
        </p>

        {/* Opciones */}
        <div className="space-y-4 mt-4">
          <button
            onClick={() => setDecision("CUMPLIDO")}
            className={`w-full py-2 rounded-xl font-semibold ${
              decision === "CUMPLIDO" ? "bg-green-500" : "bg-green-600 hover:bg-green-400"
            }`}
          >
            Marcar como Cumplido
          </button>

          <div>
            <button
              onClick={() => setDecision("NO_CUMPLIDO")}
              className={`w-full py-2 rounded-xl font-semibold mb-2 ${
                decision === "NO_CUMPLIDO" ? "bg-red-500" : "bg-red-600 hover:bg-red-400"
              }`}
            >
              No Cumplido
            </button>
            {decision === "NO_CUMPLIDO" && (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  placeholder="Comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full p-2 rounded-xl text-black"
                />
                <input
                  type="text"
                  placeholder="Nueva descripción del compromiso"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full p-2 rounded-xl text-black"
                />
                <input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="w-full p-2 rounded-xl text-black"
                />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setDecision("REPROGRAMAR")}
              className={`w-full py-2 rounded-xl font-semibold mb-2 ${
                decision === "REPROGRAMAR" ? "bg-yellow-500" : "bg-yellow-600 hover:bg-yellow-400"
              }`}
            >
              Reprogramar
            </button>
            {decision === "REPROGRAMAR" && (
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="w-full p-2 rounded-xl text-black mt-2"
              />
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-600 hover:bg-gray-500 font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 font-semibold"
          >
            {loading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}