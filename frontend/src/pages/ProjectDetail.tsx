import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { motion } from "framer-motion";
import CrearEntregableModal from "../components/entregables/CrearEntregableModal";
import CrearCompromisoModal from "../components/compromisos/CrearCompromisoModal";
import CompromisoVencidoModal from "../components/compromisos/CompromisoVencidoModal";
import CrearReunionModal from "../components/reuniones/CrearReunionModal";
import DetalleReunionModal from "../components/reuniones/DetalleReunionModal";
import { getRolFromToken, getUserIdFromToken } from "../utils/auth";

type EstadoFactura = "PENDIENTE" | "APROBADA" | "PAGADA" | "RECHAZADA"
type TipoFeedback = "POSITIVO" | "NEGATIVO" | "MEJORA"
type PagoEstado = "PENDIENTE" | "RECIBIDO" | "VENCIDO" | "PARCIAL"

interface Factura {
  id: string
  numero: string
  concepto: string
  monto: number
  estado: EstadoFactura
  fechaEmision: string
  fechaPago?: string
  proveedor?: { id: string; nombre: string } | null
}

interface FeedbackInterno {
  id: string
  tipo: TipoFeedback
  descripcion: string
  accionesTomadas?: string
  creadoPor: string
  createdAt: string
}

interface PagoCliente {
  id: string
  numeroCuota: number
  descripcion: string
  montoEsperado: number
  montoRecibido?: number
  fechaEsperada: string
  fechaRecibido?: string
  estado: PagoEstado
  observaciones?: string
}

interface CronogramaVersion {
  id: string
  version: number
  descripcionCambios: string
  aprobadoCliente: boolean
  fechaAprobacion?: string
  createdAt: string
}

const FACTURA_ESTADO_STYLES: Record<EstadoFactura, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA:  "bg-blue-100 text-blue-700",
  PAGADA:    "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
}

const ACCION_LABELS: Record<string, string> = {
  CREACION: "Creación del proyecto",
  ACTUALIZACION: "Actualización",
  CONTRATO_FIRMADO: "Contrato firmado",
  KICKOFF_REALIZADO: "Kick-off realizado",
  PROYECTO_CERRADO: "Proyecto cerrado",
  CIERRE_FORMAL: "Cierre formal del proyecto",
  PROPUESTA_APROBADA: "Propuesta aprobada",
  POLIZA_CONTRATADA: "Póliza contratada",
  EVALUACION_AUTOMATICA: "Evaluación automática de estado",
  COMPROMISO_CREADO: "Compromiso creado",
  COMPROMISO_CUMPLIDO: "Compromiso cumplido",
  COMPROMISO_NO_CUMPLIDO: "Compromiso no cumplido",
  COMPROMISO_REPROGRAMADO: "Compromiso reprogramado",
  COMPROMISO_ELIMINADO: "Compromiso eliminado",
  ENTREGABLE_CREADO: "Entregable creado",
  ENTREGABLE_ACTUALIZADO: "Entregable actualizado",
  ENTREGABLE_ELIMINADO: "Entregable eliminado",
  REVISION_INTERNA_APROBADA: "Revisión interna aprobada",
  CLIENTE_APROBO: "Cliente aprobó entregable",
  CLIENTE_DEVOLVIO: "Cliente devolvió entregable",
  REUNION_CREADA: "Reunión de seguimiento creada",
  REUNION_CALIDAD_APROBADA: "Calidad de reunión aprobada",
  ENTREGABLE_VENCIDO_AUTO: "Entregable vencido (automático)",
  ENTREGABLE_URGENTE_AUTO: "Entregable urgente (automático)",
}

const ETAPA_LABELS: Record<string, string> = {
  PROPUESTA:    "Propuesta",
  KICK_OFF:     "Kick-off",
  EN_EJECUCION: "En Ejecución",
  CIERRE:       "Cierre",
}

const ETAPA_BADGES: Record<string, string> = {
  PROPUESTA:    "bg-purple-100 text-purple-700",
  KICK_OFF:     "bg-blue-100 text-blue-700",
  EN_EJECUCION: "bg-green-100 text-green-700",
  CIERRE:       "bg-gray-100 text-gray-600",
}

const ESTADO_PROYECTO_STYLES: Record<string, string> = {
  EN_CURSO:    "bg-green-100 text-green-700",
  ADVERTENCIA: "bg-yellow-100 text-yellow-700",
  EN_RIESGO:   "bg-red-100 text-red-700",
  FINALIZADO:  "bg-gray-100 text-gray-600",
}

const COMPROMISO_ESTADO_STYLES: Record<string, string> = {
  PENDIENTE:    "bg-yellow-100 text-yellow-700",
  CUMPLIDO:     "bg-green-100 text-green-700",
  NO_CUMPLIDO:  "bg-red-100 text-red-700",
  REPROGRAMADO: "bg-blue-100 text-blue-700",
}

const ENTREGABLE_COLOR: Record<string, string> = {
  COMPLETADO: "#16A34A",
  URGENTE:    "#F59E0B",
  VENCIDO:    "#EF4444",
  ADVERTENCIA:"#F97316",
  PENDIENTE:  "#9CA3AF",
}

const FEEDBACK_STYLES: Record<TipoFeedback, { badge: string; label: string }> = {
  POSITIVO: { badge: "bg-green-100 text-green-700", label: "Positivo" },
  NEGATIVO: { badge: "bg-red-100 text-red-700",   label: "Negativo" },
  MEJORA:   { badge: "bg-blue-100 text-blue-700", label: "Mejora" },
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rol = getRolFromToken();
  const userId = getUserIdFromToken();
  const esAdmin = rol === "ADMIN";
  const esFinanciero = rol === "ADMIN" || rol === "ADMINISTRATIVO";
  const esSocioOAdmin = rol === "ADMIN" || rol === "SOCIO";

  const [project, setProject] = useState<any>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [entregables, setEntregables] = useState<any[]>([]);
  const [compromisos, setCompromisos] = useState<any[]>([]);
  const [advertencias, setAdvertencias] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackInterno[]>([]);
  const [pagosCliente, setPagosCliente] = useState<PagoCliente[]>([]);
  const [nota, setNota] = useState<string>("");
  const [notaSaving, setNotaSaving] = useState(false);
  const [cronogramaVersiones, setCronogramaVersiones] = useState<CronogramaVersion[]>([]);
  const [nuevaVersionDesc, setNuevaVersionDesc] = useState("");
  const [showCuotaModal, setShowCuotaModal] = useState(false);
  const [notasOpen, setNotasOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reuniones, setReuniones] = useState<any[]>([]);
  const [obsMap, setObsMap] = useState<Record<string, string>>({});
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [showEntregableModal, setShowEntregableModal] = useState(false);
  const [showCompromisoModal, setShowCompromisoModal] = useState(false);
  const [showReunionModal, setShowReunionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reunionDetalle, setReunionDetalle] = useState<any>(null);
  const [vencidoModal, setVencidoModal] = useState<any>(null);
  const [entregableEditando, setEntregableEditando] = useState<any>(null);
  const [reunionEditando, setReunionEditando] = useState<any>(null);
  const [cierreError, setCierreError] = useState<string | null>(null);
  const [tooltipEntregable, setTooltipEntregable] = useState<string | null>(null);

  // Is current user the lider or socio2 of this project?
  const esParteDelProyecto = project
    ? project.liderId === userId || project.socio2Id === userId
    : false;

  const loadData = async () => {
    setLoadError(null);
    try {
      const [p, e, c, a, r] = await Promise.all([
        api.get(`/proyectos/${id}`),
        api.get(`/entregables/proyecto/${id}`),
        api.get(`/compromisos/proyecto/${id}`),
        api.get(`/proyectos/${id}/advertencias`),
        api.get(`/reuniones/proyecto/${id}`),
      ]);

      setProject(p.data);
      setEntregables(e.data);
      setCompromisos(c.data);
      setReuniones(r.data);

      if (esFinanciero) {
        try {
          const fRes = await api.get(`/facturas/proyecto/${id}`);
          setFacturas(fRes.data);
        } catch { /* non-financial roles get 403 */ }
      }

      if (esSocioOAdmin) {
        try {
          const fbRes = await api.get(`/feedback/proyecto/${id}`);
          setFeedbacks(fbRes.data);
        } catch { /* ignore */ }
      }

      // Pagos cliente (todos los roles pueden ver)
      try {
        const pcRes = await api.get(`/pagos-cliente/proyecto/${id}`);
        setPagosCliente(pcRes.data);
      } catch { /* ignore */ }

      // Nota del proyecto
      try {
        const notaRes = await api.get(`/notas/proyecto/${id}`);
        setNota(notaRes.data?.contenido ?? "");
      } catch { /* ignore */ }

      // Cronograma versiones
      try {
        const cronRes = await api.get(`/cronograma/proyecto/${id}`);
        setCronogramaVersiones(cronRes.data);
      } catch { /* ignore */ }

      const orden = { CRITICA: 1, MEDIA: 2, BAJA: 3 };
      const ordenadas = a.data.sort(
        (x: any, y: any) =>
          orden[x.nivel as keyof typeof orden] -
          orden[y.nivel as keyof typeof orden]
      );
      setAdvertencias(ordenadas);
    } catch {
      setLoadError("Error al cargar datos. Intenta de nuevo.");
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

  const patchEntregable = async (entregableId: string, payload: Record<string, unknown>) => {
    try {
      await api.patch(`/entregables/${entregableId}`, payload);
      await loadData();
    } catch (err) {
      console.error("Error actualizando entregable", err);
    }
  };

  const patchProyecto = async (payload: Record<string, unknown>) => {
    setUpdatingEstado(true);
    setCierreError(null);
    try {
      await api.patch(`/proyectos/${id}`, payload);
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg) {
        setCierreError(Array.isArray(msg) ? msg.join(". ") : msg);
      }
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleCumplido = async (compromisoId: string) => {
    try {
      await api.patch(`/compromisos/${compromisoId}/resolver`, { decision: "CUMPLIDO" });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al marcar cumplido");
    }
  };

  const handleEliminarCompromiso = async (compromisoId: string) => {
    if (!window.confirm("¿Eliminar este compromiso?")) return;
    try {
      await api.delete(`/compromisos/${compromisoId}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar el compromiso");
    }
  };

  const handleEliminarEntregable = async (entregableId: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar el entregable "${nombre}"?`)) return;
    try {
      await api.delete(`/entregables/${entregableId}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar el entregable");
    }
  };

  const handleEliminarReunion = async (reunionId: string) => {
    if (!window.confirm("¿Eliminar esta reunión?")) return;
    try {
      await api.delete(`/reuniones/${reunionId}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar la reunión");
    }
  };

  const handleEliminarFeedback = async (feedbackId: string) => {
    if (!window.confirm("¿Eliminar este feedback?")) return;
    try {
      await api.delete(`/feedback/${feedbackId}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar feedback");
    }
  };

  const notaTimerRef = useRef<ReturnType<typeof setTimeout>>(0 as ReturnType<typeof setTimeout>);
  const handleNotaChange = (valor: string) => {
    setNota(valor);
    clearTimeout(notaTimerRef.current);
    notaTimerRef.current = setTimeout(async () => {
      setNotaSaving(true);
      try {
        await api.put(`/notas/proyecto/${id}`, { contenido: valor });
      } catch { /* ignore */ }
      finally { setNotaSaving(false); }
    }, 1200);
  };

  const handleCrearVersion = async () => {
    if (!nuevaVersionDesc.trim()) return;
    try {
      await api.post(`/cronograma/proyecto/${id}`, { descripcionCambios: nuevaVersionDesc });
      setNuevaVersionDesc("");
      const cronRes = await api.get(`/cronograma/proyecto/${id}`);
      setCronogramaVersiones(cronRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al crear versión");
    }
  };

  const handleAprobarVersionCliente = async (versionId: string) => {
    try {
      await api.patch(`/cronograma/${versionId}/aprobar-cliente`);
      const cronRes = await api.get(`/cronograma/proyecto/${id}`);
      setCronogramaVersiones(cronRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al aprobar versión");
    }
  };

  const handleMarcarCuotaRecibida = async (cuotaId: string, monto: number) => {
    try {
      await api.patch(`/pagos-cliente/${cuotaId}/marcar-recibido`, {
        montoRecibido: monto,
        fechaRecibido: new Date().toISOString(),
      });
      const pcRes = await api.get(`/pagos-cliente/proyecto/${id}`);
      setPagosCliente(pcRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al marcar cuota");
    }
  };

  useEffect(() => {
    if (compromisos.length === 0) return;
    const vencidos = compromisos.filter(
      (c) => c.estado === "PENDIENTE" && esVencidoOCumpleHoy(c.fechaActual)
    );
    if (vencidos.length > 0) setVencidoModal(vencidos[0]);
  }, [compromisos]);

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3FBF6] gap-4">
        <p className="text-red-500 font-medium">{loadError}</p>
        <button onClick={loadData} className="px-5 py-2 bg-[#16A34A] text-white rounded-xl font-medium hover:bg-[#15803D] transition">
          Reintentar
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3FBF6] text-gray-700">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3FBF6] p-10 space-y-10 text-gray-800">

      {/* Breadcrumb + back */}
      <div className="text-sm text-gray-500">Proyectos &gt; {project.nombre}</div>
      <button onClick={() => navigate("/projects")} className="text-sm text-[#16A34A] hover:text-[#15803D] font-medium mb-4">
        ← Volver a Proyectos
      </button>

      {/* HEADER MEJORADO */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-lg space-y-5 border border-[#DDF7E6]">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-3xl font-bold text-gray-800 flex-1 min-w-0">{project.nombre}</h1>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ESTADO_PROYECTO_STYLES[project.estado] ?? "bg-gray-100 text-gray-600"}`}>
              {project.estado?.replace(/_/g, " ")}
            </span>
            {project.etapa && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ETAPA_BADGES[project.etapa] ?? "bg-gray-100 text-gray-600"}`}>
                {ETAPA_LABELS[project.etapa] ?? project.etapa}
              </span>
            )}
          </div>
        </div>

        {project.descripcion && <p className="text-gray-600">{project.descripcion}</p>}

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {project.categoria && <span className="text-gray-600"><span className="font-semibold text-gray-500">Categoría:</span> {project.categoria.nombre}</span>}
          {project.lider && <span className="text-gray-600"><span className="font-semibold text-gray-500">Líder:</span> {project.lider.nombre}</span>}
          {project.socio2 && <span className="text-gray-600"><span className="font-semibold text-gray-500">Socio 2:</span> {project.socio2.nombre}</span>}
          <span className="text-gray-600"><span className="font-semibold text-gray-500">Inicio:</span> {new Date(project.fechaInicio).toLocaleDateString("es-CO")}</span>
          <span className="text-gray-600"><span className="font-semibold text-gray-500">Fin:</span> {new Date(project.fechaFin).toLocaleDateString("es-CO")}</span>
        </div>

        {entregables.length > 0 && (() => {
          const aprobados = entregables.filter((e) => e.clienteAprobado).length
          const pct = Math.round((aprobados / entregables.length) * 100)
          return (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Entregables aprobados por cliente</span>
                <span className="font-semibold">{aprobados}/{entregables.length} ({pct}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })()}
      </motion.div>

      {/* ADVERTENCIAS */}
      {advertencias.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border rounded-2xl p-6 shadow-md space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Advertencias del Proyecto</h3>
          {advertencias.map((a, i) => {
            const color = a.nivel === "CRITICA" ? "border-red-500 bg-red-50 text-red-700" : a.nivel === "MEDIA" ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-blue-400 bg-blue-50 text-blue-700";
            return <div key={i} className={`border-l-4 ${color} p-3 rounded-lg text-sm`}>{a.mensaje}</div>;
          })}
        </motion.div>
      )}

      {/* ESTADO DEL PROYECTO */}
      <CollapsibleSection title="Estado del Proyecto" sectionId="estado" projectId={project.id}>
        {esAdmin && project.etapa === "EN_EJECUCION" && (
          <div className="flex justify-end flex-col items-end gap-2 mb-2">
            <button
              disabled={updatingEstado}
              onClick={() => { if (window.confirm("¿Cerrar este proyecto? Se marcará como FINALIZADO y no podrá revertirse fácilmente.")) patchProyecto({ etapa: "CIERRE", estado: "FINALIZADO" }); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-800 text-white hover:bg-gray-900 transition disabled:opacity-50"
            >
              Cerrar proyecto
            </button>
            {cierreError && <p className="text-sm text-red-600 font-medium max-w-xs text-right">{cierreError}</p>}
          </div>
        )}
        <StepperEtapa etapa={project.etapa ?? "PROPUESTA"} />
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
            <div>
              <p className="font-semibold text-gray-700 text-sm">Contrato firmado</p>
              <p className="text-xs text-gray-400 mt-0.5">Requisito previo al Kick-off</p>
            </div>
            {project.contratoFirmado ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Firmado</span>
            ) : (
              <button disabled={updatingEstado} onClick={() => patchProyecto({ contratoFirmado: true, etapa: "KICK_OFF" })} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition disabled:opacity-50">
                Marcar firmado
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
            <div>
              <p className="font-semibold text-gray-700 text-sm">Kick-off realizado</p>
              {project.kickoffRealizado && project.kickoffFecha ? (
                <p className="text-xs text-gray-400 mt-0.5">{new Date(project.kickoffFecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Inicia la fase de ejecución</p>
              )}
            </div>
            {project.kickoffRealizado ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Realizado</span>
            ) : (
              <button disabled={updatingEstado || !project.contratoFirmado} onClick={() => patchProyecto({ kickoffRealizado: true, kickoffFecha: new Date().toISOString(), etapa: "EN_EJECUCION" })} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition disabled:opacity-50" title={!project.contratoFirmado ? "Primero firma el contrato" : undefined}>
                Marcar realizado
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 col-span-full sm:col-span-1">
            <div>
              <p className="font-semibold text-gray-700 text-sm">Póliza</p>
              <p className="text-xs text-gray-400 mt-0.5">{project.requierePoliza ? "Requerida" : "No requerida"}</p>
            </div>
            <div className="flex items-center gap-2">
              {esAdmin && (
                <button disabled={updatingEstado} onClick={() => patchProyecto({ requierePoliza: !project.requierePoliza })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${project.requierePoliza ? "bg-[#16A34A]" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${project.requierePoliza ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              )}
              {project.requierePoliza && (
                project.polizaContratada ? (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Contratada</span>
                ) : esAdmin ? (
                  <button disabled={updatingEstado} onClick={() => patchProyecto({ polizaContratada: true })} className="px-2 py-1 rounded-xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50">
                    Marcar contratada
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Pendiente</span>
                )
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* GESTIÓN DE PROPUESTA */}
      {(project.etapa === "PROPUESTA" || esAdmin) && (
        <CollapsibleSection title="Gestión de Propuesta" sectionId="propuesta" projectId={project.id}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div>
                <p className="font-semibold text-gray-700 text-sm">Propuesta aprobada</p>
                <p className="text-xs text-gray-400 mt-0.5">Aprobación interna de la propuesta</p>
              </div>
              <div className="flex items-center gap-2">
                {esAdmin ? (
                  <button disabled={updatingEstado} onClick={() => patchProyecto({ propuestaAprobada: !project.propuestaAprobada })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${project.propuestaAprobada ? "bg-[#16A34A]" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${project.propuestaAprobada ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${project.propuestaAprobada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {project.propuestaAprobada ? "Aprobada" : "Pendiente"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div>
                <p className="font-semibold text-gray-700 text-sm">¿Requiere contrato?</p>
                <p className="text-xs text-gray-400 mt-0.5">Formalización contractual</p>
              </div>
              {esAdmin ? (
                <button disabled={updatingEstado} onClick={() => patchProyecto({ requiereContrato: !project.requiereContrato })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${project.requiereContrato ? "bg-[#16A34A]" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${project.requiereContrato ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${project.requiereContrato ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                  {project.requiereContrato ? "Sí" : "No"}
                </span>
              )}
            </div>
          </div>
          {esAdmin && project.propuestaAprobada && (
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50">
              <p className="text-sm font-semibold text-blue-800 mb-2">Propuesta aprobada</p>
              <p className="text-xs text-blue-600">La propuesta ha sido aprobada. Continúa con la firma del contrato y el proceso de póliza si aplica.</p>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* CRONOGRAMA VISUAL */}
      {entregables.length > 0 && (
        <CollapsibleSection title="Cronograma" sectionId="cronograma" projectId={project.id}>
          <CronogramaTimeline fechaInicio={project.fechaInicio} fechaFin={project.fechaFin} entregables={entregables} tooltipId={tooltipEntregable} onTooltip={setTooltipEntregable} />
        </CollapsibleSection>
      )}

      {/* ENTREGABLES */}
      <CollapsibleSection title="Entregables" sectionId="entregables" projectId={project.id} buttonText="+ Crear Entregable" onClick={() => setShowEntregableModal(true)}>
        {entregables.length === 0 ? (
          <p className="text-gray-500">No hay entregables registrados.</p>
        ) : (
          <ul className="space-y-4">
            {entregables.map((e) => (
              <li key={e.id} className={`rounded-2xl border shadow-sm overflow-hidden ${e.clienteAprobado ? "border-green-300" : e.observacionesCliente ? "border-red-200" : "border-gray-100"}`}>
                <div className={`px-5 py-4 border-b ${e.clienteAprobado ? "bg-green-50 border-green-200" : e.observacionesCliente ? "bg-red-50 border-red-100" : "bg-[#DDF7E6] border-green-100"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{e.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Entrega: {new Date(e.fechaEntrega).toLocaleDateString("es-CO")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!e.clienteAprobado && (
                        <button onClick={() => setEntregableEditando(e)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition">Editar</button>
                      )}
                      <button onClick={() => handleEliminarEntregable(e.id, e.nombre)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition">Eliminar</button>
                    </div>
                    {e.clienteAprobado && (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        Aprobado por cliente{e.fechaAprobacionCliente && <span className="ml-1 text-green-500">· {new Date(e.fechaAprobacionCliente).toLocaleDateString("es-CO")}</span>}
                      </span>
                    )}
                  </div>
                  {e.descripcion && <p className="text-sm text-gray-600 mt-1">{e.descripcion}</p>}
                  {e.observacionesCliente && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-100 border border-red-200">
                      <p className="text-xs font-semibold text-red-600 mb-0.5">Observaciones del cliente</p>
                      <p className="text-sm text-red-700">{e.observacionesCliente}</p>
                    </div>
                  )}
                </div>
                {!e.clienteAprobado && (
                  <div className="px-5 py-4 bg-white space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${e.revisionInternaAprobada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${e.revisionInternaAprobada ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}>{e.revisionInternaAprobada ? "✓" : "1"}</span>
                        Revisión interna
                      </div>
                      <div className={`flex-1 h-0.5 ${e.revisionInternaAprobada ? "bg-green-300" : "bg-gray-200"}`} />
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${e.revisionInternaAprobada ? "bg-gray-100 text-gray-500" : "bg-gray-50 text-gray-300"}`}>
                        <span className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-[10px] font-bold">2</span>
                        Aprobación cliente
                      </div>
                    </div>
                    {!e.revisionInternaAprobada ? (
                      <button onClick={() => patchEntregable(e.id, { revisionInternaAprobada: true })} className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition">Aprobar revisión interna</button>
                    ) : (
                      <div className="space-y-3">
                        <textarea rows={2} placeholder="Observaciones del cliente (opcional para devolución)..." value={obsMap[e.id] ?? ""} onChange={(ev) => setObsMap((prev) => ({ ...prev, [e.id]: ev.target.value }))} className="w-full p-3 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#16A34A]" />
                        <div className="flex gap-3">
                          <button onClick={() => patchEntregable(e.id, { clienteAprobado: true, fechaAprobacionCliente: new Date().toISOString() })} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition">Cliente aprobó</button>
                          <button disabled={!(obsMap[e.id] ?? "").trim()} onClick={() => patchEntregable(e.id, { observacionesCliente: obsMap[e.id], estado: "PENDIENTE" })} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-40">Cliente devolvió</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {/* COMPROMISOS */}
      <CollapsibleSection title="Compromisos Internos" sectionId="compromisos" projectId={project.id} buttonText="+ Nuevo Compromiso" onClick={() => setShowCompromisoModal(true)}>
        {compromisos.length === 0 ? (
          <p className="text-gray-500">No hay compromisos registrados.</p>
        ) : (
          <ul className="space-y-3">
            {compromisos.map((c) => {
              const vencido = c.estado === "PENDIENTE" && esVencidoOCumpleHoy(c.fechaActual);
              return (
                <li key={c.id} className={`p-4 border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${vencido ? "border-red-200 bg-red-50" : "border-[#DDF7E6] bg-white"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{c.descripcion}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${COMPROMISO_ESTADO_STYLES[c.estado] ?? "bg-gray-100 text-gray-600"}`}>{c.estado}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Fecha: {new Date(c.fechaActual).toLocaleDateString("es-CO")}
                      {vencido && <span className="ml-2 text-red-600 font-semibold">· Vencido</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.estado === "PENDIENTE" && !vencido && <button onClick={() => handleCumplido(c.id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 transition">Cumplido</button>}
                    {c.estado === "PENDIENTE" && <button onClick={() => setVencidoModal(c)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition">Resolver</button>}
                    <button onClick={() => handleEliminarCompromiso(c.id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition">Eliminar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      {/* REUNIONES */}
      <CollapsibleSection title="Reuniones de Seguimiento" sectionId="reuniones" projectId={project.id} buttonText="+ Nueva Reunión" onClick={() => setShowReunionModal(true)}>
        {reuniones.length === 0 ? (
          <p className="text-gray-500">No hay reuniones registradas.</p>
        ) : (
          <ul className="space-y-3">
            {reuniones.map((r) => (
              <li key={r.id} className="p-4 border border-[#DDF7E6] bg-white rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{new Date(r.fecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{r.objetivos.length > 90 ? r.objetivos.slice(0, 90) + "…" : r.objetivos}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.calidadAprobada ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Calidad aprobada</span>
                  ) : (
                    <button onClick={async () => { await api.patch(`/reuniones/${r.id}`, { calidadAprobada: true }); loadData(); }} className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition border border-orange-200">Aprobar calidad</button>
                  )}
                  <button onClick={() => setReunionDetalle(r)} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition">Ver detalle</button>
                  <button onClick={() => setReunionEditando(r)} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition">Editar</button>
                  <button onClick={() => handleEliminarReunion(r.id)} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {/* FEEDBACK INTERNO */}
      {esSocioOAdmin && (
        <CollapsibleSection title="Feedback Interno" sectionId="feedback" projectId={project.id} buttonText="+ Nuevo Feedback" onClick={() => setShowFeedbackModal(true)}>
          {feedbacks.length === 0 ? (
            <p className="text-gray-500">No hay feedback registrado.</p>
          ) : (
            <ul className="space-y-3">
              {feedbacks.map((fb) => (
                <li key={fb.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${FEEDBACK_STYLES[fb.tipo].badge}`}>{FEEDBACK_STYLES[fb.tipo].label}</span>
                        <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString("es-CO")}</span>
                      </div>
                      <p className="text-sm text-gray-700">{fb.descripcion}</p>
                      {fb.accionesTomadas && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Acciones:</span> {fb.accionesTomadas}</p>}
                    </div>
                    {esAdmin && <button onClick={() => handleEliminarFeedback(fb.id)} className="shrink-0 px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition">Eliminar</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      )}

      {/* CUOTAS DEL CLIENTE */}
      {esFinanciero && (
        <CollapsibleSection title="Cuotas del Cliente" sectionId="cuotas" projectId={project.id} buttonText="+ Nueva cuota" onClick={() => setShowCuotaModal(true)}>
          {pagosCliente.length === 0 ? (
            <p className="text-gray-500">No hay cuotas registradas.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Esperado</th>
                    <th className="px-4 py-3 text-right">Recibido</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-left">Fecha esperada</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pagosCliente.map((pc) => {
                    const estadoStyle = { PENDIENTE: "bg-yellow-100 text-yellow-700", RECIBIDO: "bg-green-100 text-green-700", VENCIDO: "bg-red-100 text-red-700", PARCIAL: "bg-blue-100 text-blue-700" }[pc.estado] ?? "bg-gray-100 text-gray-600"
                    return (
                      <tr key={pc.id} className="bg-white hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono font-semibold text-gray-600">{pc.numeroCuota}</td>
                        <td className="px-4 py-3 text-gray-700">{pc.descripcion}</td>
                        <td className="px-4 py-3 text-right">${Number(pc.montoEsperado).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3 text-right">{pc.montoRecibido != null ? `$${Number(pc.montoRecibido).toLocaleString("es-CO")}` : "—"}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoStyle}`}>{pc.estado}</span></td>
                        <td className="px-4 py-3 text-gray-500">{new Date(pc.fechaEsperada).toLocaleDateString("es-CO")}</td>
                        <td className="px-4 py-3">
                          {pc.estado !== "RECIBIDO" && <button onClick={() => handleMarcarCuotaRecibida(pc.id, pc.montoEsperado)} className="px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition">Marcar recibida</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-600">Total</td>
                    <td className="px-4 py-3 text-right font-bold">${pagosCliente.reduce((s, p) => s + Number(p.montoEsperado), 0).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">${pagosCliente.reduce((s, p) => s + Number(p.montoRecibido ?? 0), 0).toLocaleString("es-CO")}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* FACTURAS */}
      {esFinanciero && (
        <CollapsibleSection title="Facturas del Proyecto" sectionId="facturas" projectId={project.id}>
          {facturas.length === 0 ? (
            <p className="text-gray-500">No hay facturas registradas para este proyecto.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">N°</th>
                    <th className="px-4 py-3 text-left">Concepto</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-left">Emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facturas.map((f) => (
                    <tr key={f.id} className="bg-white hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-700">{f.numero}</td>
                      <td className="px-4 py-3 text-gray-700">{f.concepto}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{f.proveedor?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">${Number(f.monto).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${FACTURA_ESTADO_STYLES[f.estado]}`}>{f.estado}</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(f.fechaEmision).toLocaleDateString("es-CO")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-600">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">${facturas.reduce((s, f) => s + Number(f.monto), 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* CRONOGRAMA VERSIONES */}
      {esSocioOAdmin && (
        <CollapsibleSection title="Cronograma — Versiones" sectionId="cronograma-versiones" projectId={project.id}>
          {esAdmin && (
            <div className="flex gap-3">
              <input type="text" value={nuevaVersionDesc} onChange={(e) => setNuevaVersionDesc(e.target.value)} placeholder="Descripción del cambio en el cronograma..." className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]" />
              <button onClick={handleCrearVersion} disabled={!nuevaVersionDesc.trim()} className="px-4 py-2 bg-[#16A34A] text-white rounded-xl text-sm font-semibold hover:bg-[#15803D] transition disabled:opacity-40">Registrar versión</button>
            </div>
          )}
          {cronogramaVersiones.length === 0 ? (
            <p className="text-gray-500">No hay versiones registradas.</p>
          ) : (
            <ul className="space-y-3">
              {cronogramaVersiones.map((v) => (
                <li key={v.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">v{v.version}</span>
                      <span className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString("es-CO")}</span>
                      {v.aprobadoCliente && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Cliente aprobó {v.fechaAprobacion ? `· ${new Date(v.fechaAprobacion).toLocaleDateString("es-CO")}` : ""}</span>}
                    </div>
                    <p className="text-sm text-gray-700">{v.descripcionCambios}</p>
                  </div>
                  {!v.aprobadoCliente && esAdmin && <button onClick={() => handleAprobarVersionCliente(v.id)} className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 transition">Cliente aprobó</button>}
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      )}

      {/* HISTORIAL (colapsado por defecto) */}
      {project.historial?.length > 0 && (
        <CollapsibleSection title="Historial" sectionId="historial" projectId={project.id} defaultOpen={false}>
          <ul className="space-y-3">
            {[...project.historial]
              .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .map((h: any) => (
                <li key={h.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${h.accion === "CREACION" ? "bg-green-100 text-green-700" : h.accion === "ACTUALIZACION" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {ACCION_LABELS[h.accion] ?? h.accion}
                  </span>
                  <div className="flex-1 min-w-0"><p className="text-sm text-gray-700">{h.detalle}</p></div>
                  <span className="shrink-0 text-xs text-gray-400">{new Date(h.fecha).toLocaleString()}</span>
                </li>
              ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* NOTAS — DRAWER FLOTANTE */}
      {esSocioOAdmin && (
        <>
          <button
            onClick={() => setNotasOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold text-sm transition"
          >
            <span>📝</span>
            <span>Notas</span>
            {nota && <span className="w-2 h-2 rounded-full bg-white/60" />}
          </button>

          {notasOpen && (
            <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setNotasOpen(false)}>
              <div className="absolute inset-y-0 right-0 w-full max-w-[400px] bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">Notas del Proyecto</h3>
                  <div className="flex items-center gap-3">
                    {notaSaving && <span className="text-xs text-gray-400">Guardando...</span>}
                    {!notaSaving && nota && <span className="text-xs text-green-500">Guardado</span>}
                    <button onClick={() => setNotasOpen(false)} className="text-gray-400 hover:text-gray-600 transition text-xl leading-none">✕</button>
                  </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto">
                  <textarea
                    rows={20}
                    value={nota}
                    onChange={(e) => handleNotaChange(e.target.value)}
                    placeholder="Escribe notas internas del proyecto... (se guardan automáticamente)"
                    className="w-full min-h-[400px] p-4 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALES */}
      {showEntregableModal && <CrearEntregableModal proyectoId={project.id} onClose={() => { setShowEntregableModal(false); loadData(); }} />}
      {showCompromisoModal && <CrearCompromisoModal proyectoId={project.id} onClose={() => { setShowCompromisoModal(false); loadData(); }} />}
      {vencidoModal && <CompromisoVencidoModal compromiso={vencidoModal} onClose={() => { setVencidoModal(null); loadData(); }} />}
      {showReunionModal && <CrearReunionModal proyectoId={project.id} onClose={() => { setShowReunionModal(false); loadData(); }} />}
      {reunionDetalle && <DetalleReunionModal reunion={reunionDetalle} onClose={() => setReunionDetalle(null)} onUpdate={() => { setReunionDetalle(null); loadData(); }} />}
      {entregableEditando && <CrearEntregableModal proyectoId={project.id} entregable={entregableEditando} onClose={() => { setEntregableEditando(null); loadData(); }} />}
      {reunionEditando && <CrearReunionModal proyectoId={project.id} reunion={reunionEditando} onClose={() => { setReunionEditando(null); loadData(); }} />}
      {showFeedbackModal && <FeedbackModal proyectoId={project.id} onClose={() => { setShowFeedbackModal(false); loadData(); }} />}
      {showCuotaModal && <CuotaModal proyectoId={project.id} nextCuota={pagosCliente.length + 1} onClose={() => { setShowCuotaModal(false); loadData(); }} />}
    </div>
  );
}

/* ─── MODAL NUEVA CUOTA ─────────────────────────────────────── */
function CuotaModal({ proyectoId, nextCuota, onClose }: { proyectoId: string; nextCuota: number; onClose: () => void }) {
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!descripcion.trim()) { setError("La descripción es obligatoria."); return }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) { setError("El monto debe ser un número positivo."); return }
    if (!fecha) { setError("La fecha esperada es obligatoria."); return }
    setLoading(true)
    try {
      await api.post("/pagos-cliente", {
        proyectoId,
        numeroCuota: nextCuota,
        descripcion,
        montoEsperado: Number(monto),
        fechaEsperada: new Date(fecha).toISOString(),
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear la cuota.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">Nueva cuota #{nextCuota}</h2>

        <div>
          <label className="text-sm font-medium text-gray-600">Descripción *</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Cuota inicial, Segunda cuota..."
            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Monto esperado (COP) *</label>
          <input
            type="number"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0"
            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Fecha esperada *</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium transition">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear cuota"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── CRONOGRAMA VISUAL ──────────────────────────────────────── */
function CronogramaTimeline({
  fechaInicio,
  fechaFin,
  entregables,
  tooltipId,
  onTooltip,
}: {
  fechaInicio: string
  fechaFin: string
  entregables: any[]
  tooltipId: string | null
  onTooltip: (id: string | null) => void
}) {
  const inicio = new Date(fechaInicio).getTime()
  const fin    = new Date(fechaFin).getTime()
  const rango  = fin - inicio || 1

  const posicion = (fecha: string) => {
    const t = new Date(fecha).getTime()
    const pct = Math.max(0, Math.min(100, ((t - inicio) / rango) * 100))
    return pct
  }

  const ESTADO_ENTREGABLE_LABEL: Record<string, string> = {
    COMPLETADO: "Completado",
    URGENTE:    "Urgente",
    VENCIDO:    "Vencido",
    ADVERTENCIA:"Advertencia",
    PENDIENTE:  "Pendiente",
  }

  return (
    <div className="relative pt-6 pb-4 px-2">
      {/* Eje horizontal */}
      <div className="relative h-1 bg-gray-200 rounded-full mx-4">
        {/* Punto inicio */}
        <div className="absolute left-0 -top-2.5 flex flex-col items-center" style={{ transform: "translateX(-50%)" }}>
          <div className="w-5 h-5 rounded-full bg-[#16A34A] border-2 border-white shadow" />
        </div>
        {/* Punto fin */}
        <div className="absolute right-0 -top-2.5 flex flex-col items-center" style={{ transform: "translateX(50%)" }}>
          <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white shadow" />
        </div>

        {/* Entregables */}
        {entregables.map((e) => {
          const pct = posicion(e.fechaEntrega)
          const color = ENTREGABLE_COLOR[e.estado] ?? "#9CA3AF"
          return (
            <div
              key={e.id}
              className="absolute -top-3 cursor-pointer"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              onMouseEnter={() => onTooltip(e.id)}
              onMouseLeave={() => onTooltip(null)}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                style={{ background: color }}
              />
              {tooltipId === e.id && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-20 shadow-xl">
                  <p className="font-semibold">{e.nombre}</p>
                  <p>{new Date(e.fechaEntrega).toLocaleDateString("es-CO")}</p>
                  <p>{ESTADO_ENTREGABLE_LABEL[e.estado] ?? e.estado}</p>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Etiquetas */}
      <div className="flex justify-between text-xs text-gray-400 mt-3 px-4">
        <span>{new Date(fechaInicio).toLocaleDateString("es-CO")}</span>
        <span>{new Date(fechaFin).toLocaleDateString("es-CO")}</span>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(ENTREGABLE_COLOR).map(([estado, color]) => (
          <div key={estado} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500">{estado.charAt(0) + estado.slice(1).toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── FEEDBACK MODAL ─────────────────────────────────────────── */
function FeedbackModal({ proyectoId, onClose }: { proyectoId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState<TipoFeedback>("POSITIVO")
  const [descripcion, setDescripcion] = useState("")
  const [acciones, setAcciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!descripcion.trim()) { setError("La descripción es obligatoria."); return }
    setLoading(true)
    try {
      await api.post("/feedback", {
        proyectoId,
        tipo,
        descripcion,
        accionesTomadas: acciones.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar feedback.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">Nuevo Feedback Interno</h2>

        <div>
          <label className="text-sm font-medium text-gray-600">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoFeedback)}
            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] bg-white"
          >
            <option value="POSITIVO">Positivo</option>
            <option value="NEGATIVO">Negativo</option>
            <option value="MEJORA">Mejora</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Descripción *</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Acciones tomadas <span className="text-gray-400">(opcional)</span></label>
          <textarea
            rows={2}
            value={acciones}
            onChange={(e) => setAcciones(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium transition">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── COMPONENTES AUXILIARES ────────────────────────────────── */
const ETAPAS = [
  { key: "PROPUESTA",    label: "Propuesta" },
  { key: "KICK_OFF",     label: "Kick-off" },
  { key: "EN_EJECUCION", label: "En Ejecución" },
  { key: "CIERRE",       label: "Cierre" },
]

function StepperEtapa({ etapa }: { etapa: string }) {
  const currentIdx = ETAPAS.findIndex((e) => e.key === etapa)
  return (
    <div className="relative flex items-start">
      <div className="absolute top-[18px] left-[12.5%] right-[12.5%] h-0.5 bg-gray-200" />
      <div className="absolute top-[18px] left-[12.5%] h-0.5 bg-[#16A34A] transition-all duration-500" style={{ width: `${currentIdx * 25}%` }} />
      {ETAPAS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold z-10 relative ${done ? "bg-[#16A34A] text-white" : active ? "bg-[#16A34A] text-white ring-4 ring-green-100" : "bg-white border-2 border-gray-300 text-gray-400"}`}>
              {done ? "✓" : idx + 1}
            </div>
            <span className={`text-xs font-semibold text-center leading-tight ${active ? "text-[#16A34A]" : done ? "text-green-600" : "text-gray-400"}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function useCollapsed(projectId: string, sectionId: string, defaultOpen = true) {
  const key = `pd-${projectId}-${sectionId}`
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? defaultOpen : stored === "true"
    } catch {
      return defaultOpen
    }
  })
  const toggle = () => {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(key, String(next)) } catch { /* ignore */ }
  }
  return [open, toggle] as const
}

function CollapsibleSection({
  title, sectionId, projectId, buttonText, onClick, defaultOpen = true, children
}: {
  title: string; sectionId: string; projectId: string
  buttonText?: string; onClick?: () => void
  defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, toggle] = useCollapsed(projectId, sectionId, defaultOpen)
  return (
    <div className="bg-white p-8 rounded-3xl shadow-lg border border-[#DDF7E6]">
      <div className="flex justify-between items-center">
        <button className="flex items-center gap-2" onClick={toggle}>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <span className={`text-gray-400 text-sm transition-transform duration-200 ${open ? "" : "-rotate-90"}`}>▼</span>
        </button>
        {buttonText && onClick && (
          <button onClick={onClick} className="bg-[#16A34A] px-4 py-2 rounded-xl font-semibold text-white hover:bg-[#15803D] transition">
            {buttonText}
          </button>
        )}
      </div>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  )
}

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  )
}
