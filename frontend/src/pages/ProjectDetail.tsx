import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import CrearEntregableModal from "../components/entregables/CrearEntregableModal";
import EntregableVencidoModal from "../components/entregables/EntregableVencidoModal";
import CrearCompromisoModal from "../components/compromisos/CrearCompromisoModal";
import CompromisoVencidoModal from "../components/compromisos/CompromisoVencidoModal";
import CrearReunionModal from "../components/reuniones/CrearReunionModal";
import DetalleReunionModal from "../components/reuniones/DetalleReunionModal";
import FileUploadButton from "../components/ui/FileUploadButton";
import Modal from "../components/ui/Modal";
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
  archivoFacturaPath?: string | null
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
  archivoComprobantePath?: string | null
}

interface FeedbackCliente {
  id: string
  calificacion: number
  comentario: string
  fechaFeedback: string
  registradoPorId: string
  entregable?: { id: string; nombre: string } | null
}

const FACTURA_ESTADO_STYLES: Record<EstadoFactura, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA:  "bg-blue-100 text-blue-700",
  PAGADA:    "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
}

const FACTURA_ESTADO_LABELS: Record<EstadoFactura, string> = {
  PENDIENTE: "Pendiente",
  APROBADA:  "Aprobada",
  PAGADA:    "Pagada",
  RECHAZADA: "Rechazada",
}

const PAGO_ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente de confirmar",
  RECIBIDO:  "Confirmado",
  VENCIDO:   "Vencido",
  PARCIAL:   "Parcial",
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
  ENTREGABLE_COMPLETADO: "Entregable completado",
  ENTREGABLE_REPROGRAMADO: "Entregable reprogramado",
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
  REPROGRAMADO: "bg-yellow-100 text-yellow-700",
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

const ESTADO_GRADIENT: Record<string, string> = {
  EN_CURSO:    "linear-gradient(90deg, #16a34a 0%, #4ade80 100%)",
  ADVERTENCIA: "linear-gradient(90deg, #d97706 0%, #fbbf24 100%)",
  EN_RIESGO:   "linear-gradient(90deg, #dc2626 0%, #f87171 100%)",
  FINALIZADO:  "linear-gradient(90deg, #475569 0%, #94a3b8 100%)",
  PROPUESTA:   "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
}

const ESTADO_BG: Record<string, string> = {
  EN_CURSO:    "#f0fdf4",
  ADVERTENCIA: "#fffbeb",
  EN_RIESGO:   "#fef2f2",
  FINALIZADO:  "#f8fafc",
  PROPUESTA:   "#f5f3ff",
}

const ESTADO_COLOR: Record<string, string> = {
  EN_CURSO:    "#15803d",
  ADVERTENCIA: "#b45309",
  EN_RIESGO:   "#dc2626",
  FINALIZADO:  "#475569",
  PROPUESTA:   "#7c3aed",
}

const ESTADO_LABEL: Record<string, string> = {
  EN_CURSO:    "En curso",
  ADVERTENCIA: "Advertencia",
  EN_RIESGO:   "En riesgo",
  FINALIZADO:  "Finalizado",
  PROPUESTA:   "Propuesta",
}

const ETAPA_BG: Record<string, string> = {
  PROPUESTA:    "#f5f3ff",
  KICK_OFF:     "#eff6ff",
  EN_EJECUCION: "#f0fdf4",
  CIERRE:       "#f8fafc",
}

const ETAPA_COLOR: Record<string, string> = {
  PROPUESTA:    "#7c3aed",
  KICK_OFF:     "#1d4ed8",
  EN_EJECUCION: "#15803d",
  CIERRE:       "#475569",
}

function getDaysRemaining(fechaFin: string): number {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fin = new Date(fechaFin); fin.setHours(0, 0, 0, 0)
  return Math.floor((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function initials(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
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
const [showCuotaModal, setShowCuotaModal] = useState(false);
  const [notasOpen, setNotasOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
const [feedbacksCliente, setFeedbacksCliente] = useState<FeedbackCliente[]>([]);
  const [showFeedbackClienteForm, setShowFeedbackClienteForm] = useState(false);
  const [vencidoDismissed, setVencidoDismissed] = useState<Set<string>>(new Set());
  const [entregableVencidoModal, setEntregableVencidoModal] = useState<any>(null);
  const [vencidoDismissedEntregables, setVencidoDismissedEntregables] = useState<Set<string>>(new Set());
  const [bannerVencidosOpen, setBannerVencidosOpen] = useState(true);

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
  const [tooltipEntregable, setTooltipEntregable] = useState<string | null>(null);
  const [cuotaARecibir, setCuotaARecibir] = useState<PagoCliente | null>(null);
  const [forzarCuotaRecibida, setForzarCuotaRecibida] = useState(false);
  const [cuotaRecibirPath, setCuotaRecibirPath] = useState("");

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

// Feedback del cliente (ADMIN y SOCIO)
      if (esSocioOAdmin) {
        try {
          const fcRes = await api.get(`/feedback-cliente/proyecto/${id}`);
          setFeedbacksCliente(fcRes.data);
        } catch { /* ignore */ }
      }

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

  const calcDiasRetraso = (fecha: string): number => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha); f.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((hoy.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)));
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

const handleAdjuntarFactura = async (facturaId: string, path: string) => {
    try {
      await api.patch(`/facturas/${facturaId}/adjuntar`, { archivoFacturaPath: path });
      const fRes = await api.get(`/facturas/proyecto/${id}`);
      setFacturas(fRes.data);
    } catch { /* ignore */ }
  };

  const handleAdjuntarCuota = async (cuotaId: string, path: string) => {
    try {
      await api.patch(`/pagos-cliente/${cuotaId}/adjuntar`, { archivoComprobantePath: path });
      const pcRes = await api.get(`/pagos-cliente/proyecto/${id}`);
      setPagosCliente(pcRes.data);
    } catch { /* ignore */ }
  };

const handleEliminarFeedbackCliente = async (fbId: string) => {
    if (!window.confirm("¿Eliminar este feedback?")) return;
    try {
      await api.delete(`/feedback-cliente/${fbId}`);
      setFeedbacksCliente(prev => prev.filter(f => f.id !== fbId));
    } catch { /* ignore */ }
  };

  const avgCalificacion = feedbacksCliente.length > 0
    ? (feedbacksCliente.reduce((s, f) => s + f.calificacion, 0) / feedbacksCliente.length).toFixed(1)
    : null;

const handleMarcarCuotaRecibida = async (cuotaId: string, monto: number, forzar: boolean) => {
    try {
      await api.patch(`/pagos-cliente/${cuotaId}/marcar-recibido`, {
        montoRecibido: monto,
        fechaRecibido: new Date().toISOString(),
        ...(forzar ? { forzarRecibido: true } : {}),
      });
      const pcRes = await api.get(`/pagos-cliente/proyecto/${id}`);
      setPagosCliente(pcRes.data);
      setCuotaARecibir(null);
      setForzarCuotaRecibida(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al marcar cuota");
    }
  };

  useEffect(() => {
    if (compromisos.length === 0 || vencidoModal) return;
    const vencidos = compromisos.filter(
      (c) => c.estado === "PENDIENTE" && esVencidoOCumpleHoy(c.fechaActual) && !vencidoDismissed.has(c.id)
    );
    if (vencidos.length > 0) setVencidoModal(vencidos[0]);
  }, [compromisos]);

  useEffect(() => {
    if (entregables.length === 0 || entregableVencidoModal || vencidoModal) return;
    const vencidos = entregables.filter(
      (e) => e.estado === "VENCIDO" && !vencidoDismissedEntregables.has(e.id)
    );
    if (vencidos.length > 0) setEntregableVencidoModal(vencidos[0]);
  }, [entregables, vencidoModal]);

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

      {/* PROJECT HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ borderRadius: 18, overflow: "hidden", background: "white", boxShadow: "var(--card-shadow)", border: "1px solid var(--card-border)" }}
      >
        {/* 6px gradient status band */}
        <div style={{ height: 6, background: ESTADO_GRADIENT[project.estado] ?? "linear-gradient(90deg, #94a3b8, #cbd5e1)" }} />

        <div style={{ padding: "24px 28px 20px" }}>
          {/* Title + badges row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 26, fontWeight: 400, color: "var(--text-primary)",
                margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
              }}>
                {project.nombre}
              </h1>
              {project.descripcion && (
                <p style={{
                  fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0",
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
                }}>
                  {project.descripcion}
                </p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <span style={{
                padding: "5px 12px", borderRadius: 99,
                background: ESTADO_BG[project.estado] ?? "#f1f5f9",
                color: ESTADO_COLOR[project.estado] ?? "#64748b",
                fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
              }}>
                {ESTADO_LABEL[project.estado] ?? project.estado?.replace(/_/g, " ")}
              </span>
              {project.etapa && (
                <span style={{
                  padding: "4px 10px", borderRadius: 99,
                  background: ETAPA_BG[project.etapa] ?? "#f1f5f9",
                  color: ETAPA_COLOR[project.etapa] ?? "#64748b",
                  fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {ETAPA_LABELS[project.etapa] ?? project.etapa}
                </span>
              )}
            </div>
          </div>

          {/* Metadata chips row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
            {project.categoria && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 8,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
                fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: project.categoria.color ?? "var(--navy, #1e3a6e)", flexShrink: 0 }} />
                {project.categoria.nombre}
              </div>
            )}
            {project.lider && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "3px 10px 3px 4px", borderRadius: 99,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 99,
                  background: "var(--navy, #1e3a6e)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  flexShrink: 0,
                }}>
                  {initials(project.lider.nombre)}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
                  {project.lider.nombre}
                </span>
              </div>
            )}
            {project.socio2 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "3px 10px 3px 4px", borderRadius: 99,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 99,
                  background: "var(--accent, #f97316)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  flexShrink: 0,
                }}>
                  {initials(project.socio2.nombre)}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
                  {project.socio2.nombre}
                </span>
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 8,
              background: "var(--content-bg)", border: "1px solid var(--card-border)",
              fontSize: 12, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace",
            }}>
              {new Date(project.fechaInicio).toLocaleDateString("es-CO")} → {new Date(project.fechaFin).toLocaleDateString("es-CO")}
            </div>
            {project.estado !== "FINALIZADO" && (() => {
              const days = getDaysRemaining(project.fechaFin)
              return (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 8,
                  background: days < 0 ? "#fef2f2" : days < 14 ? "#fff7ed" : "#f0fdf4",
                  border: `1px solid ${days < 0 ? "#fecaca" : days < 14 ? "#fed7aa" : "#bbf7d0"}`,
                  fontSize: 12, fontWeight: 600,
                  color: days < 0 ? "#dc2626" : days < 14 ? "#ea580c" : "#16a34a",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {days < 0 ? `${Math.abs(days)}d vencido` : days === 0 ? "Vence hoy" : `${days}d restantes`}
                </div>
              )
            })()}
            {avgCalificacion && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: "#fefce8", border: "1px solid #fde68a",
                fontSize: 12, fontWeight: 600, color: "#92400e",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                ★ {avgCalificacion}
              </div>
            )}
          </div>

          {/* Animated progress bar */}
          {entregables.length > 0 && (() => {
            const aprobados = entregables.filter((e) => e.clienteAprobado).length
            const pct = Math.round((aprobados / entregables.length) * 100)
            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                    Entregables aprobados por cliente
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {aprobados}/{entregables.length} · {pct}%
                  </span>
                </div>
                <div style={{ height: 4, background: "var(--card-border)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    style={{
                      height: "100%", borderRadius: 99,
                      background: ESTADO_GRADIENT[project.estado] ?? "var(--navy, #1e3a6e)",
                    }}
                  />
                </div>
              </div>
            )
          })()}
        </div>
      </motion.div>

      {/* BANNER VENCIDOS/URGENTES */}
      {(() => {
        const compVencidos = compromisos.filter(c => c.estado === "PENDIENTE" && esVencidoOCumpleHoy(c.fechaActual));
        const entVencidos = entregables.filter(e => e.estado === "VENCIDO");
        const entUrgentes = entregables.filter(e => e.estado === "URGENTE");
        if (compVencidos.length === 0 && entVencidos.length === 0 && entUrgentes.length === 0) return null;
        const partes: string[] = [];
        if (compVencidos.length > 0) partes.push(`${compVencidos.length} compromiso${compVencidos.length > 1 ? "s" : ""} vencido${compVencidos.length > 1 ? "s" : ""}`);
        if (entVencidos.length > 0) partes.push(`${entVencidos.length} entregable${entVencidos.length > 1 ? "s" : ""} vencido${entVencidos.length > 1 ? "s" : ""}`);
        if (entUrgentes.length > 0) partes.push(`${entUrgentes.length} entregable${entUrgentes.length > 1 ? "s" : ""} próximo${entUrgentes.length > 1 ? "s" : ""} a vencer`);
        return (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setBannerVencidosOpen(p => !p)}
              className="w-full flex items-center justify-between px-5 py-3 text-amber-800 hover:bg-amber-100 transition text-left"
            >
              <span className="font-semibold text-sm">⚠ {partes.join(" · ")}</span>
              <span className="text-amber-600 text-xs shrink-0 ml-2">{bannerVencidosOpen ? "▲ Ocultar" : "▼ Ver"}</span>
            </button>
            {bannerVencidosOpen && (
              <div className="px-5 pb-4 pt-2 space-y-1.5 border-t border-amber-200">
                {compVencidos.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-amber-900">
                    <span className="text-red-500 shrink-0">●</span>
                    <span className="font-medium truncate flex-1">{c.descripcion}</span>
                    <span className="text-xs text-red-500 shrink-0">{calcDiasRetraso(c.fechaActual)} días</span>
                    <button onClick={() => document.getElementById("section-compromisos")?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-blue-600 hover:underline shrink-0">Ver</button>
                  </div>
                ))}
                {[...entVencidos, ...entUrgentes].map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-sm text-amber-900">
                    <span className={`shrink-0 ${e.estado === "VENCIDO" ? "text-red-500" : "text-orange-400"}`}>●</span>
                    <span className="font-medium truncate flex-1">{e.nombre}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${e.estado === "VENCIDO" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>{e.estado === "VENCIDO" ? "Vencido" : "Urgente"}</span>
                    <button onClick={() => document.getElementById("section-entregables")?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-blue-600 hover:underline shrink-0">Ver</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
        <StepperEtapa etapa={project.etapa ?? "PROPUESTA"} />
        {esAdmin && project.etapa === "EN_EJECUCION" && (
          <div className="flex justify-end pt-2">
            <button
              disabled={updatingEstado}
              onClick={() => {
                if (window.confirm("¿Cerrar este proyecto? Se marcará como FINALIZADO."))
                  patchProyecto({ etapa: "CIERRE", estado: "FINALIZADO" })
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-800 text-white hover:bg-gray-900 transition disabled:opacity-40"
            >
              Cerrar proyecto
            </button>
          </div>
        )}
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

          {/* Documentación */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Documentación</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "documentosFacturacionRecibidos", label: "Docs facturación recibidos" },
                { key: "proveedorValidado", label: "Logique validado como proveedor" },
                ...(project.requierePoliza ? [{ key: "documentosPolizaConfirmados", label: "Docs póliza confirmados" }] : []),
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-700">{label}</p>
                  {esAdmin ? (
                    <button
                      disabled={updatingEstado}
                      onClick={() => patchProyecto({ [key]: !project[key] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${project[key] ? "bg-[#16A34A]" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${project[key] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${project[key] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {project[key] ? "✓" : "Pendiente"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* CRONOGRAMA VISUAL */}
      {entregables.length > 0 && (
        <CollapsibleSection title="Cronograma" sectionId="cronograma" projectId={project.id}>
          <CronogramaTimeline fechaInicio={project.fechaInicio} fechaFin={project.fechaFin} entregables={entregables} tooltipId={tooltipEntregable} onTooltip={setTooltipEntregable} />
        </CollapsibleSection>
      )}

      {/* ENTREGABLES */}
      <div id="section-entregables">
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
      </div>

      {/* COMPROMISOS */}
      <div id="section-compromisos">
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
                      {vencido ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          VENCIDO · {calcDiasRetraso(c.fechaActual)} día{calcDiasRetraso(c.fechaActual) === 1 ? "" : "s"}
                        </span>
                      ) : c.estado === "REPROGRAMADO" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">REPROGRAMADO</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${COMPROMISO_ESTADO_STYLES[c.estado] ?? "bg-gray-100 text-gray-600"}`}>{c.estado}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Fecha: {new Date(c.fechaActual).toLocaleDateString("es-CO")}
                      {c.reunion && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                          Reunión {new Date(c.reunion.fecha).toLocaleDateString("es-CO")}
                        </span>
                      )}
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
      </div>

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

      {/* FEEDBACK DEL CLIENTE */}
      {esSocioOAdmin && (
        <CollapsibleSection title="Feedback del Cliente" sectionId="feedback-cliente" projectId={project.id}>
          {/* Formulario inline */}
          {(esAdmin || esSocioOAdmin) && (
            <div className="mb-4">
              {!showFeedbackClienteForm ? (
                <button onClick={() => setShowFeedbackClienteForm(true)} className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition">
                  + Registrar feedback
                </button>
              ) : (
                <FeedbackClienteForm
                  proyectoId={project.id}
                  entregables={entregables}
                  onDone={() => { setShowFeedbackClienteForm(false); api.get(`/feedback-cliente/proyecto/${id}`).then(r => setFeedbacksCliente(r.data)).catch(() => {}); }}
                  onCancel={() => setShowFeedbackClienteForm(false)}
                />
              )}
            </div>
          )}
          {feedbacksCliente.length === 0 ? (
            <p className="text-gray-500">No hay feedback del cliente registrado.</p>
          ) : (
            <ul className="space-y-3">
              {feedbacksCliente.map((fb) => (
                <li key={fb.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-yellow-500 text-sm">{"⭐".repeat(fb.calificacion)}{"☆".repeat(5 - fb.calificacion)}</span>
                        <span className="text-xs text-gray-400">{new Date(fb.fechaFeedback).toLocaleDateString("es-CO")}</span>
                        {fb.entregable && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{fb.entregable.nombre}</span>}
                      </div>
                      <p className="text-sm text-gray-700">{fb.comentario}</p>
                    </div>
                    {esAdmin && <button onClick={() => handleEliminarFeedbackCliente(fb.id)} className="shrink-0 px-2 py-1 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 transition">Eliminar</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      )}

      {/* FACTURAS EMITIDAS AL CLIENTE */}
      {esFinanciero && (
        <CollapsibleSection title="Facturas Emitidas al Cliente" sectionId="facturas" projectId={project.id}>
          <p className="text-xs text-gray-400 -mt-2 mb-1">Documentos de cobro que enviamos al cliente. El pago lo registras en "Pagos Recibidos del Cliente".</p>
          {facturas.length === 0 ? (
            <p className="text-gray-500">No hay facturas registradas para este proyecto.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-blue-100">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 text-xs uppercase tracking-wider text-blue-600">
                  <tr>
                    <th className="px-4 py-3 text-left">N° Factura</th>
                    <th className="px-4 py-3 text-left">Concepto</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-right">Monto (COP)</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-left">Fecha emisión</th>
                    <th className="px-4 py-3 text-left">PDF Factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facturas.map((f) => (
                    <tr key={f.id} className="bg-white hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-700">{f.numero}</td>
                      <td className="px-4 py-3 text-gray-700">{f.concepto}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{f.proveedor?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">${Number(f.monto).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${FACTURA_ESTADO_STYLES[f.estado]}`}>{FACTURA_ESTADO_LABELS[f.estado]}</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(f.fechaEmision).toLocaleDateString("es-CO")}</td>
                      <td className="px-4 py-3">
                        <FileUploadButton
                          carpeta="facturas"
                          currentPath={f.archivoFacturaPath}
                          onUploaded={(path) => handleAdjuntarFactura(f.id, path)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-600">Total emitido</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">${facturas.reduce((s, f) => s + Number(f.monto), 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* PAGOS RECIBIDOS DEL CLIENTE */}
      {esFinanciero && (
        <CollapsibleSection title="Pagos Recibidos del Cliente" sectionId="cuotas" projectId={project.id} buttonText="+ Registrar pago" onClick={() => setShowCuotaModal(true)}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", marginTop: -4, marginBottom: 4 }}>
            Comprobantes de los pagos que el cliente ya realizó. Adjunta el soporte de cada transferencia.
          </p>
          {pagosCliente.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", padding: "8px 0" }}>No hay pagos registrados.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pagosCliente.map((pc) => {
                const PAGO_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
                  PENDIENTE: { bg: "#fffbeb", color: "#b45309", border: "#fde68a",  label: "Pendiente" },
                  RECIBIDO:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "Recibido" },
                  VENCIDO:   { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Vencido" },
                  PARCIAL:   { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Parcial" },
                }
                const pcfg = PAGO_CFG[pc.estado] ?? { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: pc.estado }
                const esRecibido = pc.estado === "RECIBIDO"
                return (
                  <div key={pc.id} style={{
                    borderRadius: 12, overflow: "hidden",
                    border: `1px solid ${esRecibido ? "#bbf7d0" : "var(--card-border)"}`,
                    background: esRecibido ? "#fafffe" : "white",
                  }}>
                    {/* Header */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", gap: 12,
                      borderBottom: "1px solid var(--card-border)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: "var(--navy, #1e3a6e)", color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {pc.numeroCuota}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pc.descripcion}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                            {pc.fechaRecibido
                              ? `Recibido el ${new Date(pc.fechaRecibido).toLocaleDateString("es-CO")}`
                              : `Esperado: ${new Date(pc.fechaEsperada).toLocaleDateString("es-CO")}`}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: 99,
                          background: pcfg.bg, color: pcfg.color, border: `1px solid ${pcfg.border}`,
                          fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {pcfg.label}
                        </span>
                        {!esRecibido && (
                          <button
                            onClick={() => { setCuotaARecibir(pc); setForzarCuotaRecibida(false); setCuotaRecibirPath(""); }}
                            style={{
                              padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                              background: "var(--navy, #1e3a6e)", color: "white", border: "none",
                              fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                              transition: "opacity 0.15s", whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                          >
                            Marcar recibido
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Montos + comprobante */}
                    <div style={{ padding: "14px 16px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                        <div>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", margin: "0 0 3px", fontWeight: 600 }}>Acordado</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                            ${Number(pc.montoEsperado).toLocaleString("es-CO")}
                          </p>
                        </div>
                        {pc.montoRecibido != null && (
                          <>
                            <div style={{ width: 1, background: "var(--card-border)", alignSelf: "stretch" }} />
                            <div>
                              <p style={{ fontSize: 11, color: "#16a34a", fontFamily: "'DM Sans', sans-serif", margin: "0 0 3px", fontWeight: 600 }}>Recibido</p>
                              <p style={{ fontSize: 16, fontWeight: 700, color: "#15803d", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                                ${Number(pc.montoRecibido).toLocaleString("es-CO")}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", margin: "0 0 6px" }}>
                          Comprobante de pago
                        </p>
                        <FileUploadButton
                          carpeta="recibos"
                          currentPath={pc.archivoComprobantePath}
                          onUploaded={(path) => handleAdjuntarCuota(pc.id, path)}
                          hint="PDF, JPG o PNG hasta 10 MB"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Totales */}
              <div style={{
                display: "flex", justifyContent: "flex-end", gap: 24, alignItems: "center",
                padding: "12px 16px", borderRadius: 10,
                background: "var(--content-bg)", border: "1px solid var(--card-border)",
              }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", margin: "0 0 2px" }}>Total acordado</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                    ${pagosCliente.reduce((s, p) => s + Number(p.montoEsperado), 0).toLocaleString("es-CO")}
                  </p>
                </div>
                <div style={{ width: 1, height: 32, background: "var(--card-border)" }} />
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "#16a34a", fontFamily: "'DM Sans', sans-serif", margin: "0 0 2px", fontWeight: 600 }}>Total recibido</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#15803d", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                    ${pagosCliente.reduce((s, p) => s + Number(p.montoRecibido ?? 0), 0).toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* HISTORIAL (colapsado por defecto) */}
      {project.historial?.length > 0 && (
        <CollapsibleSection title="Historial" sectionId="historial" projectId={project.id} defaultOpen={false}>
          <ul className="space-y-3">
            {[...project.historial]
              .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .slice(0, 50)
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
      {vencidoModal && <CompromisoVencidoModal compromiso={vencidoModal} onClose={(resolved?: boolean) => { if (!resolved) setVencidoDismissed(prev => new Set(prev).add(vencidoModal.id)); setVencidoModal(null); loadData(); }} />}
      {entregableVencidoModal && <EntregableVencidoModal entregable={entregableVencidoModal} onClose={(resolved?: boolean) => { if (!resolved) setVencidoDismissedEntregables(prev => new Set(prev).add(entregableVencidoModal.id)); setEntregableVencidoModal(null); loadData(); }} />}
      {showReunionModal && <CrearReunionModal proyectoId={project.id} onClose={() => { setShowReunionModal(false); loadData(); }} />}
      {reunionDetalle && <DetalleReunionModal reunion={reunionDetalle} onClose={() => setReunionDetalle(null)} onUpdate={() => { setReunionDetalle(null); loadData(); }} />}
      {entregableEditando && <CrearEntregableModal proyectoId={project.id} entregable={entregableEditando} onClose={() => { setEntregableEditando(null); loadData(); }} />}
      {reunionEditando && <CrearReunionModal proyectoId={project.id} reunion={reunionEditando} onClose={() => { setReunionEditando(null); loadData(); }} />}
      {showFeedbackModal && <FeedbackModal proyectoId={project.id} onClose={() => { setShowFeedbackModal(false); loadData(); }} />}
      {showCuotaModal && <CuotaModal proyectoId={project.id} nextCuota={pagosCliente.length + 1} onClose={() => { setShowCuotaModal(false); loadData(); }} />}

      {cuotaARecibir && (
        <Modal
          onClose={() => { setCuotaARecibir(null); setForzarCuotaRecibida(false); setCuotaRecibirPath(""); }}
          size="sm"
          accentColor="#16a34a"
        >
          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ marginBottom: 20, paddingRight: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.3 }}>
                Confirmar recepción de pago
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                Cuota #{cuotaARecibir.numeroCuota} · {cuotaARecibir.descripcion}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Monto info */}
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Monto esperado</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#15803d", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                  ${Number(cuotaARecibir.montoEsperado).toLocaleString("es-CO")}
                </p>
              </div>

              {/* FileUpload comprobante */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6 }}>
                  Adjuntar comprobante
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
                </label>
                <FileUploadButton
                  carpeta="recibos"
                  onUploaded={(path) => setCuotaRecibirPath(path)}
                  hint="PDF, JPG o PNG hasta 10 MB"
                />
              </div>

              {/* Forzar checkbox */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={forzarCuotaRecibida}
                  onChange={e => setForzarCuotaRecibida(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#16a34a" } as React.CSSProperties}
                />
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  Marcar como recibido aunque el monto sea menor al esperado
                </span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setCuotaARecibir(null); setForzarCuotaRecibida(false); setCuotaRecibirPath(""); }}
                style={{
                  padding: "9px 20px", borderRadius: 10,
                  border: "1.5px solid var(--card-border)", background: "white",
                  color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const cuotaId = cuotaARecibir.id
                  const pathAdjuntar = cuotaRecibirPath
                  await handleMarcarCuotaRecibida(cuotaId, cuotaARecibir.montoEsperado, forzarCuotaRecibida)
                  if (pathAdjuntar) await handleAdjuntarCuota(cuotaId, pathAdjuntar)
                  setCuotaRecibirPath("")
                }}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none",
                  background: "#16a34a", color: "white",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Confirmar recepción
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── MODAL NUEVA CUOTA ─────────────────────────────────────── */
const _cuotaInputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}
const _cuotaLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6,
}

function CuotaModal({ proyectoId, nextCuota, onClose }: { proyectoId: string; nextCuota: number; onClose: () => void }) {
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState("")
  const [archivoPath, setArchivoPath] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "var(--navy, #1e3a6e)")
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "var(--card-border)")

  const handleSubmit = async () => {
    setError(null)
    if (!descripcion.trim()) { setError("La descripción es obligatoria."); return }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) { setError("El monto debe ser un número positivo."); return }
    if (!fecha) { setError("La fecha esperada es obligatoria."); return }
    setLoading(true)
    try {
      const res = await api.post("/pagos-cliente", {
        proyectoId,
        numeroCuota: nextCuota,
        descripcion,
        montoEsperado: Number(monto),
        fechaEsperada: new Date(fecha).toISOString(),
      })
      if (archivoPath) {
        await api.patch(`/pagos-cliente/${res.data.id}/adjuntar`, { archivoComprobantePath: archivoPath })
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear la cuota.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} size="sm" accentColor="var(--navy, #1e3a6e)">
      <div style={{ padding: "28px 28px 24px" }}>
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.3 }}>
            Nuevo pago esperado
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            Cuota #{nextCuota} — define el monto y la fecha acordada
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={_cuotaLabelStyle}>
              Descripción <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Cuota inicial, Segunda cuota..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={_cuotaInputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div>
            <label style={_cuotaLabelStyle}>
              Monto esperado (COP) <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              style={_cuotaInputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div>
            <label style={_cuotaLabelStyle}>
              Fecha esperada <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={_cuotaInputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div>
            <label style={_cuotaLabelStyle}>
              Comprobante de pago
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <FileUploadButton
              carpeta="recibos"
              onUploaded={(path) => setArchivoPath(path)}
              hint="PDF, JPG o PNG hasta 10 MB"
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid var(--card-border)", background: "white",
              color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "var(--navy, #1e3a6e)", color: "white",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Guardando..." : "Registrar pago"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── CRONOGRAMA VISUAL (timeline vertical) ─────────────────── */
const ESTADO_ENTREGABLE_LABEL: Record<string, string> = {
  COMPLETADO:  "Completado",
  URGENTE:     "Urgente",
  VENCIDO:     "Vencido",
  ADVERTENCIA: "Advertencia",
  PENDIENTE:   "Pendiente",
}

const ESTADO_BADGE_TIMELINE: Record<string, string> = {
  COMPLETADO:  "bg-green-100 text-green-700",
  URGENTE:     "bg-amber-100 text-amber-700",
  VENCIDO:     "bg-red-100 text-red-700",
  ADVERTENCIA: "bg-orange-100 text-orange-700",
  PENDIENTE:   "bg-gray-100 text-gray-500",
}

function CronogramaTimeline({
  fechaInicio,
  fechaFin,
  entregables,
}: {
  fechaInicio: string
  fechaFin: string
  entregables: any[]
  tooltipId?: string | null
  onTooltip?: (id: string | null) => void
}) {
  const ordenados = [...entregables].sort(
    (a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime()
  )

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="relative pl-8">
      {/* Línea vertical */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200 rounded-full" />

      <div className="space-y-0">

        {/* INICIO */}
        <TimelineRow
          dot={<span className="text-base leading-none">🚀</span>}
          dotBg="bg-[#16A34A]"
          label={<span className="font-semibold text-gray-700 text-sm">Inicio del proyecto</span>}
          fecha={fmt(fechaInicio)}
          isFirst
        />

        {/* ENTREGABLES */}
        {ordenados.length === 0 ? (
          <TimelineRow
            dot={<span className="text-xs text-gray-400">—</span>}
            dotBg="bg-gray-100 border border-gray-200"
            label={<span className="text-sm text-gray-400 italic">Sin entregables definidos</span>}
          />
        ) : (
          ordenados.map((e) => (
            <TimelineRow
              key={e.id}
              dot={<div className="w-2.5 h-2.5 rounded-full" style={{ background: ENTREGABLE_COLOR[e.estado] ?? "#9CA3AF" }} />}
              dotBg="bg-white border-2 border-gray-200"
              label={
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">{e.nombre}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE_TIMELINE[e.estado] ?? "bg-gray-100 text-gray-500"}`}>
                    {ESTADO_ENTREGABLE_LABEL[e.estado] ?? e.estado}
                  </span>
                  {e.clienteAprobado && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">✓ Cliente aprobó</span>
                  )}
                </div>
              }
              fecha={fmt(e.fechaEntrega)}
            />
          ))
        )}

        {/* FIN */}
        <TimelineRow
          dot={<span className="text-base leading-none">🏁</span>}
          dotBg="bg-gray-300"
          label={<span className="font-semibold text-gray-500 text-sm">Fin del proyecto</span>}
          fecha={fmt(fechaFin)}
          isLast
        />

      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
        {Object.entries(ENTREGABLE_COLOR).map(([estado, color]) => (
          <div key={estado} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500">{ESTADO_ENTREGABLE_LABEL[estado] ?? estado}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineRow({
  dot,
  dotBg,
  label,
  fecha,
  isFirst,
  isLast,
}: {
  dot: React.ReactNode
  dotBg: string
  label: React.ReactNode
  fecha?: string
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <div className={`relative flex items-start gap-4 ${isFirst ? "pb-5" : isLast ? "pt-5" : "py-5"} group`}>
      {/* Punto */}
      <div className={`relative z-10 shrink-0 w-8 h-8 -ml-8 rounded-full flex items-center justify-center ${dotBg} shadow-sm`}>
        {dot}
      </div>
      {/* Contenido */}
      <div className="flex-1 min-w-0 flex items-start justify-between gap-3 -mt-0.5">
        <div className="flex-1 min-w-0">{label}</div>
        {fecha && (
          <span className="shrink-0 text-xs text-gray-400 font-medium tabular-nums mt-0.5">{fecha}</span>
        )}
      </div>
    </div>
  )
}

/* ─── FEEDBACK MODAL ─────────────────────────────────────────── */
const FEEDBACK_TIPO_CFG = {
  POSITIVO: { emoji: "✓", label: "Positivo", desc: "Algo que salió bien", bg: "#f0fdf4", border: "#16a34a", color: "#15803d" },
  NEGATIVO: { emoji: "✗", label: "Negativo/Urgente", desc: "Problema que necesita atención", bg: "#fef2f2", border: "#ef4444", color: "#dc2626" },
  MEJORA:   { emoji: "↑", label: "Oportunidad de mejora", desc: "Sugerencia o área a refinar", bg: "#eff6ff", border: "#3b82f6", color: "#1d4ed8" },
}

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

  const cfg = FEEDBACK_TIPO_CFG[tipo]
  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid var(--card-border)",
    background: "var(--content-bg)", color: "var(--text-primary)",
    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: "none", resize: "none" as const,
    boxSizing: "border-box" as const,
  }

  return (
    <Modal onClose={onClose} accentColor="var(--navy, #1e3a6e)">
      <div style={{ padding: "28px 28px 24px" }}>
        <div style={{ marginBottom: 20, paddingRight: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            Nuevo Feedback Interno
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            Registra observaciones sobre el estado del proyecto
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tipo: 3 card buttons */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 8 }}>
              Tipo de feedback
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["POSITIVO", "NEGATIVO", "MEJORA"] as TipoFeedback[]).map(t => {
                const c = FEEDBACK_TIPO_CFG[t]
                const isActive = tipo === t
                return (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${isActive ? c.border : "var(--card-border)"}`,
                      background: isActive ? c.bg : "var(--content-bg)",
                      transition: "all 0.15s", textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4, color: isActive ? c.color : "var(--text-muted)" }}>
                      {c.emoji}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? c.color : "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>
                      {c.label}
                    </div>
                  </button>
                )
              })}
            </div>
            {/* Active card description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={tipo}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ fontSize: 12, color: cfg.color, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}
              >
                {cfg.desc}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6 }}>
              Descripción <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="¿Qué observaste o qué pasó?"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={inputSt}
            />
          </div>

          {/* Acciones */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 6 }}>
              Acciones tomadas
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>opcional</span>
            </label>
            <textarea
              rows={2}
              placeholder="¿Qué se hizo o se planea hacer?"
              value={acciones}
              onChange={(e) => setAcciones(e.target.value)}
              style={inputSt}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "1.5px solid var(--card-border)",
              background: "white", color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "var(--navy, #1e3a6e)", color: "white",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Guardando..." : "Registrar feedback"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── FEEDBACK CLIENTE FORM ──────────────────────────────────── */
const STAR_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"]

function FeedbackClienteForm({ proyectoId, entregables, onDone, onCancel }: { proyectoId: string; entregables: any[]; onDone: () => void; onCancel: () => void }) {
  const [calificacion, setCalificacion] = useState(5)
  const [hoverStar, setHoverStar] = useState(0)
  const [comentario, setComentario] = useState("")
  const [entregableId, setEntregableId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!comentario.trim()) { setError("El comentario es obligatorio."); return }
    setLoading(true)
    try {
      await api.post("/feedback-cliente", {
        proyectoId,
        calificacion,
        comentario,
        fechaFeedback: new Date(fecha).toISOString(),
        entregableId: entregableId || undefined,
      })
      onDone()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar feedback.")
    } finally {
      setLoading(false)
    }
  }

  const displayRating = hoverStar || calificacion
  const inputSt: React.CSSProperties = {
    width: "100%", padding: "9px 11px", borderRadius: 10,
    border: "1.5px solid var(--card-border)",
    background: "white", color: "var(--text-primary)",
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box" as const,
  }

  return (
    <div style={{
      padding: "18px 20px",
      borderRadius: 14,
      background: "white",
      border: "1px solid var(--card-border)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "#fef9c3", border: "1px solid #fde68a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
        }}>
          ★
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Registrar feedback del cliente
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Star rating */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 8 }}>
            Calificación del cliente *
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setCalificacion(n)}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 28, lineHeight: 1, padding: "0 1px",
                    color: n <= displayRating ? "#f59e0b" : "#d1d5db",
                    transition: "color 0.12s, transform 0.12s",
                    transform: n === displayRating ? "scale(1.2)" : "scale(1)",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, color: "#92400e",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {STAR_LABELS[displayRating]}
            </span>
          </div>
        </div>

        {/* Fecha + Entregable */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
              Fecha *
            </label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
              Entregable <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
            </label>
            <select value={entregableId} onChange={e => setEntregableId(e.target.value)} style={{ ...inputSt, appearance: "none" } as React.CSSProperties}>
              <option value="">Sin entregable</option>
              {entregables.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* Comentario */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 5 }}>
            Comentario *
          </label>
          <textarea
            rows={2}
            placeholder="¿Qué dijo el cliente?"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            style={{ ...inputSt, resize: "none", lineHeight: 1.5 } as React.CSSProperties}
          />
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: "1.5px solid var(--card-border)", background: "var(--content-bg)",
              color: "var(--text-secondary)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              border: "none", background: "var(--primary)", color: "white",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
              fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
            }}
          >
            {loading ? "Guardando..." : "Registrar"}
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
    <div style={{
      background: "white", borderRadius: 16,
      border: "1px solid var(--card-border)",
      boxShadow: "var(--card-shadow)",
      overflow: "hidden",
    }}>
      {/* Section header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px",
        borderBottom: open ? "1px solid var(--card-border)" : "none",
        transition: "border-color 0.15s",
      }}>
        <button
          onClick={toggle}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "'DM Sans', sans-serif", margin: 0,
          }}>
            {title}
          </h2>
          <span style={{
            fontSize: 11, color: "var(--text-muted)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.18s ease",
            display: "inline-block",
          }}>
            ▼
          </span>
        </button>
        {buttonText && onClick && (
          <button
            onClick={onClick}
            style={{
              padding: "7px 14px", borderRadius: 9, border: "none",
              background: "var(--navy, #1e3a6e)", color: "white",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {buttonText}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
