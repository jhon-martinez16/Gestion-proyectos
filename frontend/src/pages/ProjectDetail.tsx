import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { motion } from "framer-motion";
import CrearEntregableModal from "../components/entregables/CrearEntregableModal";
import CrearCompromisoModal from "../components/compromisos/CrearCompromisoModal";
import CompromisoVencidoModal from "../components/compromisos/CompromisoVencidoModal";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [entregables, setEntregables] = useState<any[]>([]);
  const [compromisos, setCompromisos] = useState<any[]>([]);
  const [advertencias, setAdvertencias] = useState<any[]>([]);

  const [showEntregableModal, setShowEntregableModal] = useState(false);
  const [showCompromisoModal, setShowCompromisoModal] = useState(false);
  const [vencidoModal, setVencidoModal] = useState<any>(null);

  const loadData = async () => {
    try {
      const [p, e, c, a] = await Promise.all([
        api.get(`/proyectos/${id}`),
        api.get(`/entregables/proyecto/${id}`),
        api.get(`/compromisos/proyecto/${id}`),
        api.get(`/proyectos/${id}/advertencias`),
      ]);

      setProject(p.data);
      setEntregables(e.data);
      setCompromisos(c.data);

      // ordenar advertencias: CRITICA primero
      const orden = { CRITICA: 1, MEDIA: 2, BAJA: 3 };
      const ordenadas = a.data.sort(
        (x: any, y: any) =>
          orden[x.nivel as keyof typeof orden] -
          orden[y.nivel as keyof typeof orden]
      );

      setAdvertencias(ordenadas);
    } catch (error) {
      console.error("Error cargando datos del proyecto:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const esVencidoOCumpleHoy = (fechaCompromiso: string) => {
    const fecha = new Date(fechaCompromiso);
    const now = new Date();
    const offset = -5 * 60;

    const fechaLocal = new Date(fecha.getTime() + offset * 60 * 1000);
    const hoyLocal = new Date(now.getTime() + offset * 60 * 1000);

    return (
      fechaLocal.getFullYear() < hoyLocal.getFullYear() ||
      (fechaLocal.getFullYear() === hoyLocal.getFullYear() &&
        fechaLocal.getMonth() < hoyLocal.getMonth()) ||
      (fechaLocal.getFullYear() === hoyLocal.getFullYear() &&
        fechaLocal.getMonth() === hoyLocal.getMonth() &&
        fechaLocal.getDate() <= hoyLocal.getDate())
    );
  };

  useEffect(() => {
    if (compromisos.length === 0) return;

    const vencidos = compromisos.filter(
      (c) => c.estado === "PENDIENTE" && esVencidoOCumpleHoy(c.fechaActual)
    );

    if (vencidos.length > 0) setVencidoModal(vencidos[0]);
  }, [compromisos]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3FBF6] text-gray-700">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3FBF6] p-10 space-y-10 text-gray-800">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        Proyectos &gt; {project.nombre}
      </div>

      <button
        onClick={() => navigate("/projects")}
        className="text-sm text-[#16A34A] hover:text-[#15803D] font-medium mb-4"
      >
        ← Volver a Proyectos
      </button>

      {/* 🔴 ADVERTENCIAS */}
      {advertencias.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border rounded-2xl p-6 shadow-md space-y-3"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            Advertencias del Proyecto
          </h3>

          {advertencias.map((a, i) => {
            const color =
              a.nivel === "CRITICA"
                ? "border-red-500 bg-red-50 text-red-700"
                : a.nivel === "MEDIA"
                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                : "border-blue-400 bg-blue-50 text-blue-700";

            return (
              <div
                key={i}
                className={`border-l-4 ${color} p-3 rounded-lg text-sm`}
              >
                {a.mensaje}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* INFORMACIÓN GENERAL */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-3xl p-8 shadow-lg space-y-6 border border-[#DDF7E6]"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {project.nombre}
          </h1>
        </div>

        <p className="text-gray-600">{project.descripcion}</p>

        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <Info label="Categoría" value={project.categoria?.nombre} />
          <Info label="Líder" value={project.lider?.nombre} />
          <Info label="Socio 2" value={project.socio2?.nombre} />
          <Info
            label="Fecha Inicio"
            value={new Date(project.fechaInicio).toLocaleDateString()}
          />
          <Info
            label="Fecha Fin"
            value={new Date(project.fechaFin).toLocaleDateString()}
          />
        </div>
      </motion.div>

      {/* ENTREGABLES */}
      <Section
        title="Entregables"
        buttonText="+ Crear Entregable"
        onClick={() => setShowEntregableModal(true)}
      >
        {entregables.length === 0 ? (
          <p className="text-gray-500">
            No hay entregables registrados.
          </p>
        ) : (
          <ul className="space-y-3">
            {entregables.map((e) => (
              <li
                key={e.id}
                className="p-4 border-l-4 border-[#16A34A] bg-[#DDF7E6] rounded-xl shadow-sm"
              >
                <p className="font-semibold">{e.nombre}</p>
                <p className="text-sm text-gray-600">
                  {new Date(e.fechaEntrega).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {e.descripcion}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* COMPROMISOS */}
      <Section
        title="Compromisos Internos"
        buttonText="+ Nuevo Compromiso"
        onClick={() => setShowCompromisoModal(true)}
      >
        {compromisos.length === 0 ? (
          <p className="text-gray-500">
            No hay compromisos registrados.
          </p>
        ) : (
          <ul className="space-y-3">
            {compromisos.map((c) => (
              <li
                key={c.id}
                className="p-4 border border-[#DDF7E6] bg-white rounded-xl shadow-sm"
              >
                <p className="font-semibold">{c.descripcion}</p>
                <p className="text-sm text-gray-600">
                  {new Date(c.fechaActual).toLocaleDateString()}
                </p>
                <p className="text-xs mt-1">
                  Estado: {c.estado}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* MODALES */}
      {showEntregableModal && (
        <CrearEntregableModal
          proyectoId={project.id}
          onClose={() => {
            setShowEntregableModal(false);
            loadData();
          }}
        />
      )}

      {showCompromisoModal && (
        <CrearCompromisoModal
          proyectoId={project.id}
          onClose={() => {
            setShowCompromisoModal(false);
            loadData();
          }}
        />
      )}

      {vencidoModal && (
        <CompromisoVencidoModal
          compromiso={vencidoModal}
          onClose={() => {
            setVencidoModal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

/* COMPONENTES AUXILIARES */

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

function Section({ title, buttonText, onClick, children }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-lg border border-[#DDF7E6] space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <button
          onClick={onClick}
          className="bg-[#16A34A] px-4 py-2 rounded-xl font-semibold text-white hover:bg-[#15803D] transition"
        >
          {buttonText}
        </button>
      </div>
      {children}
    </div>
  );
}