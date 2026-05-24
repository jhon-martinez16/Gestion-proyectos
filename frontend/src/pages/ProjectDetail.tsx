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
import { getRolFromToken, getUserIdFromToken } from "../utils/auth"
import AsistenteIA from "../components/AsistenteIA/AsistenteIA";

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
  facturaCliente?: { id: string; numero: string; concepto: string } | null
}

interface FacturaCliente {
  id: string
  numero: string
  concepto: string
  monto: number
  fechaEmision: string
  observaciones?: string
  montoPagado: number
  saldoPendiente: number
  numeroPagos: number
}

interface FeedbackCliente {
  id: string
  calificacion: number
  comentario: string
  fechaFeedback: string
  registradoPorId: string
  entregable?: { id: string; nombre: string } | null
}

const FACTURA_ESTADO_STYLES: Record<EstadoFactura, React.CSSProperties> = {
  PENDIENTE: { background: "transparent", color: "var(--state-amber)",  border: "1px solid var(--state-amber)" },
  APROBADA:  { background: "transparent", color: "var(--state-blue)",   border: "1px solid var(--state-blue)" },
  PAGADA:    { background: "transparent", color: "var(--state-green)",  border: "1px solid var(--state-green)" },
  RECHAZADA: { background: "transparent", color: "var(--state-red)",    border: "1px solid var(--state-red)" },
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

const ETAPA_BADGES: Record<string, React.CSSProperties> = {
  PROPUESTA:    { background: "transparent", color: "var(--state-violet)", border: "1px solid var(--state-violet)" },
  KICK_OFF:     { background: "transparent", color: "var(--state-blue)",   border: "1px solid var(--state-blue)" },
  EN_EJECUCION: { background: "transparent", color: "var(--state-green)",  border: "1px solid var(--state-green)" },
  CIERRE:       { background: "transparent", color: "var(--state-zinc)",   border: "1px solid var(--state-zinc)" },
}

const ESTADO_PROYECTO_STYLES: Record<string, React.CSSProperties> = {
  EN_CURSO:    { background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)" },
  ADVERTENCIA: { background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)" },
  EN_RIESGO:   { background: "transparent", color: "var(--state-red)",   border: "1px solid var(--state-red)" },
  FINALIZADO:  { background: "transparent", color: "var(--state-zinc)",  border: "1px solid var(--state-zinc)" },
}

const COMPROMISO_ESTADO_STYLES: Record<string, React.CSSProperties> = {
  PENDIENTE:    { background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)" },
  CUMPLIDO:     { background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)" },
  NO_CUMPLIDO:  { background: "transparent", color: "var(--state-red)",   border: "1px solid var(--state-red)" },
  REPROGRAMADO: { background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)" },
}

const ENTREGABLE_COLOR: Record<string, string> = {
  COMPLETADO: "var(--state-green)",
  URGENTE:    "var(--state-amber)",
  VENCIDO:    "var(--state-red)",
  ADVERTENCIA:"var(--state-amber)",
  PENDIENTE:  "var(--state-zinc)",
}

const FEEDBACK_STYLES: Record<TipoFeedback, { badge: React.CSSProperties; label: string }> = {
  POSITIVO: { badge: { background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)" }, label: "Positivo" },
  NEGATIVO: { badge: { background: "transparent", color: "var(--state-red)",   border: "1px solid var(--state-red)" },   label: "Negativo" },
  MEJORA:   { badge: { background: "transparent", color: "var(--state-blue)",  border: "1px solid var(--state-blue)" },  label: "Mejora" },
}

const ESTADO_GRADIENT: Record<string, string> = {
  EN_CURSO:    "linear-gradient(90deg, #2D6A4F 0%, #4A9B6F 100%)",
  ADVERTENCIA: "linear-gradient(90deg, #D4851A 0%, #E8A040 100%)",
  EN_RIESGO:   "linear-gradient(90deg, #dc2626 0%, #f87171 100%)",
  FINALIZADO:  "linear-gradient(90deg, #475569 0%, #94a3b8 100%)",
  PROPUESTA:   "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
}

const ESTADO_BG: Record<string, string> = {
  EN_CURSO:    "transparent",
  ADVERTENCIA: "transparent",
  EN_RIESGO:   "transparent",
  FINALIZADO:  "transparent",
  PROPUESTA:   "transparent",
}

const ESTADO_COLOR: Record<string, string> = {
  EN_CURSO:    "var(--state-green)",
  ADVERTENCIA: "var(--state-amber)",
  EN_RIESGO:   "var(--state-red)",
  FINALIZADO:  "var(--state-zinc)",
  PROPUESTA:   "var(--state-violet)",
}

const ESTADO_LABEL: Record<string, string> = {
  EN_CURSO:    "En curso",
  ADVERTENCIA: "Advertencia",
  EN_RIESGO:   "En riesgo",
  FINALIZADO:  "Finalizado",
  PROPUESTA:   "Propuesta",
}

const ETAPA_BG: Record<string, string> = {
  PROPUESTA:    "transparent",
  KICK_OFF:     "transparent",
  EN_EJECUCION: "transparent",
  CIERRE:       "transparent",
}

const ETAPA_COLOR: Record<string, string> = {
  PROPUESTA:    "var(--state-violet)",
  KICK_OFF:     "var(--state-blue)",
  EN_EJECUCION: "var(--state-green)",
  CIERRE:       "var(--state-zinc)",
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
  const [montoARecibir, setMontoARecibir] = useState("");
  const [facturaClienteIdParaRecibir, setFacturaClienteIdParaRecibir] = useState("");
  const [facturasCliente, setFacturasCliente] = useState<FacturaCliente[]>([]);
  const [showFacturaClienteModal, setShowFacturaClienteModal] = useState(false);

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

      // Facturas emitidas al cliente
      try {
        const fcRes = await api.get(`/facturas-cliente/proyecto/${id}`);
        setFacturasCliente(fcRes.data);
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
        fechaLocal.getDate() < hoyLocal.getDate())
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

const handleMarcarCuotaRecibida = async (cuotaId: string, monto: number, forzar: boolean, facturaId?: string) => {
    const montoEsperadoOriginal = cuotaARecibir?.montoEsperado;
    const numeroCuotaOriginal = cuotaARecibir?.numeroCuota;
    try {
      await api.patch(`/pagos-cliente/${cuotaId}/marcar-recibido`, {
        montoRecibido: monto,
        fechaRecibido: new Date().toISOString(),
        ...(forzar ? { forzarRecibido: true } : {}),
        ...(facturaId ? { facturaClienteId: facturaId } : {}),
      });
      const pcRes = await api.get(`/pagos-cliente/proyecto/${id}`);
      setPagosCliente(pcRes.data);
      const fcRes2 = await api.get(`/facturas-cliente/proyecto/${id}`);
      setFacturasCliente(fcRes2.data);
      setCuotaARecibir(null);
      setForzarCuotaRecibida(false);
      setFacturaClienteIdParaRecibir("");

      // Offer to create balance payment if partial
      const saldo = Number(montoEsperadoOriginal) - monto;
      if (saldo > 0 && !forzar) {
        const nextCuota = Math.max(...pcRes.data.map((p: PagoCliente) => p.numeroCuota), 0) + 1;
        if (window.confirm(`Pago parcial registrado. Saldo pendiente: $${saldo.toLocaleString("es-CO")}.\n¿Registrar nuevo cobro por el saldo restante?`)) {
          await api.post("/pagos-cliente", {
            proyectoId: project.id,
            numeroCuota: nextCuota,
            descripcion: `Saldo cuota #${numeroCuotaOriginal}`,
            montoEsperado: saldo,
            fechaEsperada: new Date().toISOString(),
            ...(facturaId ? { facturaClienteId: facturaId } : {}),
          });
          const pcRes3 = await api.get(`/pagos-cliente/proyecto/${id}`);
          setPagosCliente(pcRes3.data);
        }
      }
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 320 }}>
        <p style={{ color: "var(--danger)" }} className="font-medium">{loadError}</p>
        <button onClick={loadData} className="btn-primary">Reintentar</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, color: "var(--text-secondary)" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-10" style={{ color: "var(--text-primary)" }}>

      {/* Breadcrumb + back */}
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Proyectos &gt; {project.nombre}</div>
      <button onClick={() => navigate("/projects")} style={{ fontSize: 13, color: "var(--accent-gold)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, marginBottom: 16, padding: 0 }}>
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
                fontFamily: "var(--font-serif)",
                fontSize: 26, fontWeight: 400, color: "var(--text-primary)",
                margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
              }}>
                {project.nombre}
              </h1>
              {project.descripcion && (
                <p style={{
                  fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0",
                  lineHeight: 1.5,
                }}>
                  {project.descripcion}
                </p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <span style={{
                padding: "3px 10px", borderRadius: 4,
                background: ESTADO_BG[project.estado] ?? "transparent",
                color: ESTADO_COLOR[project.estado] ?? "var(--state-zinc)",
                border: `1px solid ${ESTADO_COLOR[project.estado] ?? "var(--state-zinc)"}`,
                fontSize: 10, fontWeight: 500,
                fontFamily: "var(--font-ui)", letterSpacing: "0.06em",
                textTransform: "uppercase", whiteSpace: "nowrap",
              }}>
                {ESTADO_LABEL[project.estado] ?? project.estado?.replace(/_/g, " ")}
              </span>
              {project.etapa && (
                <span style={{
                  padding: "3px 10px", borderRadius: 4,
                  background: ETAPA_BG[project.etapa] ?? "transparent",
                  color: ETAPA_COLOR[project.etapa] ?? "var(--state-zinc)",
                  border: `1px solid ${ETAPA_COLOR[project.etapa] ?? "var(--state-zinc)"}`,
                  fontSize: 10, fontWeight: 500,
                  fontFamily: "var(--font-ui)", letterSpacing: "0.06em",
                  textTransform: "uppercase", whiteSpace: "nowrap",
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
                fontSize: 12, color: "var(--text-secondary)",              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: project.categoria.color ?? "var(--accent-forest)", flexShrink: 0 }} />
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
                  background: "var(--accent-forest)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700,                  flexShrink: 0,
                }}>
                  {initials(project.lider.nombre)}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
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
                  fontSize: 8, fontWeight: 700,                  flexShrink: 0,
                }}>
                  {initials(project.socio2.nombre)}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {project.socio2.nombre}
                </span>
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 8,
              background: "var(--content-bg)", border: "1px solid var(--card-border)",
              fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
            }}>
              {new Date(project.fechaInicio).toLocaleDateString("es-CO")} → {new Date(project.fechaFin).toLocaleDateString("es-CO")}
            </div>
            {project.estado !== "FINALIZADO" && (() => {
              const days = getDaysRemaining(project.fechaFin)
              return (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 8,
                  background: "transparent",
                  border: `1px solid ${days < 0 ? "var(--state-red)" : days < 14 ? "var(--state-amber)" : "var(--state-green)"}`,
                  fontSize: 12, fontWeight: 600,
                  color: days < 0 ? "var(--state-red)" : days < 14 ? "var(--state-amber)" : "var(--state-green)",
                }}>
                  {days < 0 ? `${Math.abs(days)}d vencido` : days === 0 ? "Vence hoy" : `${days}d restantes`}
                </div>
              )
            })()}
            {avgCalificacion && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: "transparent", border: "1px solid var(--accent-gold)",
                fontSize: 12, fontWeight: 600, color: "var(--accent-gold)",
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
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Entregables aprobados por cliente
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
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
                      background: ESTADO_GRADIENT[project.estado] ?? "var(--accent-forest)",
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
          <div style={{ border: "1px solid var(--state-amber)", borderRadius: 10, overflow: "hidden" }}>
            <button
              onClick={() => setBannerVencidosOpen(p => !p)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "rgba(212,133,26,0.06)", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--state-amber)", fontFamily: "var(--font-ui)" }}>⚠ {partes.join(" · ")}</span>
              <span style={{ fontSize: 11, color: "var(--state-amber)", flexShrink: 0, marginLeft: 8 }}>{bannerVencidosOpen ? "▲ Ocultar" : "▼ Ver"}</span>
            </button>
            {bannerVencidosOpen && (
              <div style={{ padding: "8px 20px 16px", borderTop: "1px solid rgba(212,133,26,0.25)", display: "flex", flexDirection: "column", gap: 8 }}>
                {compVencidos.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--state-red)", flexShrink: 0 }}>●</span>
                    <span style={{ fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.descripcion}</span>
                    <span style={{ fontSize: 11, color: "var(--state-red)", flexShrink: 0 }}>{calcDiasRetraso(c.fechaActual)} días</span>
                    <button onClick={() => document.getElementById("section-compromisos")?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 11, color: "var(--accent-gold)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}>Ver</button>
                  </div>
                ))}
                {[...entVencidos, ...entUrgentes].map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)" }}>
                    <span style={{ color: e.estado === "VENCIDO" ? "var(--state-red)" : "var(--state-amber)", flexShrink: 0 }}>●</span>
                    <span style={{ fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nombre}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "transparent", color: e.estado === "VENCIDO" ? "var(--state-red)" : "var(--state-amber)", border: `1px solid ${e.estado === "VENCIDO" ? "var(--state-red)" : "var(--state-amber)"}`, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{e.estado === "VENCIDO" ? "Vencido" : "Urgente"}</span>
                    <button onClick={() => document.getElementById("section-entregables")?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 11, color: "var(--accent-gold)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}>Ver</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ADVERTENCIAS */}
      {advertencias.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>Advertencias del Proyecto</h3>
          {advertencias.map((a, i) => {
            const borderColor = a.nivel === "CRITICA" ? "var(--state-red)" : a.nivel === "MEDIA" ? "var(--state-amber)" : "var(--state-blue)";
            const textColor = a.nivel === "CRITICA" ? "var(--state-red)" : a.nivel === "MEDIA" ? "var(--state-amber)" : "var(--state-blue)";
            return <div key={i} style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 12, paddingTop: 10, paddingBottom: 10, paddingRight: 10, borderRadius: 4, background: "var(--canvas)", fontSize: 13, color: textColor }}>{a.mensaje}</div>;
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
              className="btn-primary" style={{ height: 36, padding: "0 16px", fontSize: 13 }}
            >
              Cerrar proyecto
            </button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
            <div>
              <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>Contrato firmado</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Requisito previo al Kick-off</p>
            </div>
            {project.contratoFirmado ? (
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Firmado</span>
            ) : (
              <button disabled={updatingEstado} onClick={() => patchProyecto({ contratoFirmado: true, etapa: "KICK_OFF" })} className="btn-primary" style={{ height: 30, padding: "0 12px", fontSize: 11 }}>
                Marcar firmado
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
            <div>
              <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>Kick-off realizado</p>
              {project.kickoffRealizado && project.kickoffFecha ? (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(project.kickoffFecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
              ) : (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Inicia la fase de ejecución</p>
              )}
            </div>
            {project.kickoffRealizado ? (
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Realizado</span>
            ) : (
              <button disabled={updatingEstado || !project.contratoFirmado} onClick={() => patchProyecto({ kickoffRealizado: true, kickoffFecha: new Date().toISOString(), etapa: "EN_EJECUCION" })} className="btn-primary" style={{ height: 30, padding: "0 12px", fontSize: 11 }} title={!project.contratoFirmado ? "Primero firma el contrato" : undefined}>
                Marcar realizado
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl col-span-full sm:col-span-1" style={{ border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
            <div>
              <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>Póliza</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{project.requierePoliza ? "Requerida" : "No requerida"}</p>
            </div>
            <div className="flex items-center gap-2">
              {esAdmin && (
                <button disabled={updatingEstado} onClick={() => patchProyecto({ requierePoliza: !project.requierePoliza })}
                  style={{ position: "relative", display: "inline-flex", height: 24, width: 44, alignItems: "center", borderRadius: 99, transition: "background 200ms", background: project.requierePoliza ? "var(--accent-forest)" : "var(--text-faint)", border: "none", cursor: "pointer", padding: 0 }}>
                  <span style={{ display: "inline-block", height: 16, width: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 200ms", transform: project.requierePoliza ? "translateX(24px)" : "translateX(4px)" }} />
                </button>
              )}
              {project.requierePoliza && (
                project.polizaContratada ? (
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contratada</span>
                ) : esAdmin ? (
                  <button disabled={updatingEstado} onClick={() => patchProyecto({ polizaContratada: true })} className="btn-primary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>
                    Marcar contratada
                  </button>
                ) : (
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-red)", border: "1px solid var(--state-red)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pendiente</span>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>Propuesta aprobada</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Aprobación interna de la propuesta</p>
              </div>
              <div className="flex items-center gap-2">
                {esAdmin ? (
                  <button disabled={updatingEstado} onClick={() => patchProyecto({ propuestaAprobada: !project.propuestaAprobada })}
                    style={{ position: "relative", display: "inline-flex", height: 24, width: 44, alignItems: "center", borderRadius: 99, transition: "background 200ms", background: project.propuestaAprobada ? "var(--accent-forest)" : "var(--text-faint)", border: "none", cursor: "pointer", padding: 0 }}>
                    <span style={{ display: "inline-block", height: 16, width: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 200ms", transform: project.propuestaAprobada ? "translateX(24px)" : "translateX(4px)" }} />
                  </button>
                ) : (
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: project.propuestaAprobada ? "var(--state-green)" : "var(--state-zinc)", border: `1px solid ${project.propuestaAprobada ? "var(--state-green)" : "var(--state-zinc)"}`, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {project.propuestaAprobada ? "Aprobada" : "Pendiente"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>¿Requiere contrato?</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Formalización contractual</p>
              </div>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: project.requiereContrato ? "var(--state-blue)" : "var(--state-zinc)", border: `1px solid ${project.requiereContrato ? "var(--state-blue)" : "var(--state-zinc)"}`, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {project.requiereContrato ? "Sí" : "No"}
              </span>
            </div>
          </div>
          {esAdmin && project.propuestaAprobada && (
            <div style={{ padding: 16, borderRadius: 10, border: "1px solid var(--accent-gold)", background: "rgba(200,169,110,0.06)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-gold)", marginBottom: 4 }}>Propuesta aprobada</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>La propuesta ha sido aprobada. Continúa con la firma del contrato y el proceso de póliza si aplica.</p>
            </div>
          )}

          {/* Documentación */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Documentación</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "documentosFacturacionRecibidos", label: "Docs facturación recibidos" },
                { key: "proveedorValidado", label: "Logique validado como proveedor" },
                ...(project.requierePoliza ? [{ key: "documentosPolizaConfirmados", label: "Docs póliza confirmados" }] : []),
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
                  <p style={{ fontSize: 13, color: "var(--text-primary)" }}>{label}</p>
                  {esAdmin ? (
                    <button
                      disabled={updatingEstado}
                      onClick={() => patchProyecto({ [key]: !project[key] })}
                      style={{ position: "relative", display: "inline-flex", height: 24, width: 44, alignItems: "center", borderRadius: 99, transition: "background 200ms", background: project[key] ? "var(--accent-forest)" : "var(--text-faint)", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <span style={{ display: "inline-block", height: 16, width: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 200ms", transform: project[key] ? "translateX(24px)" : "translateX(4px)" }} />
                    </button>
                  ) : (
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: project[key] ? "var(--state-green)" : "var(--state-zinc)", border: `1px solid ${project[key] ? "var(--state-green)" : "var(--state-zinc)"}`, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No hay entregables registrados.</p>
        ) : (
          <ul className="space-y-4">
            {entregables.map((e) => (
              <li key={e.id} style={{ borderRadius: 8, border: `1px solid ${e.clienteAprobado ? "var(--state-green)" : e.observacionesCliente ? "var(--state-red)" : "var(--border-subtle)"}`, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${e.clienteAprobado ? "var(--state-green)" : e.observacionesCliente ? "var(--state-red)" : "var(--border-subtle)"}`, background: e.clienteAprobado ? "var(--primary-light)" : e.observacionesCliente ? "var(--danger-light)" : "var(--canvas)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 14 }}>{e.nombre}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>Entrega: {new Date(e.fechaEntrega).toLocaleDateString("es-CO")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!e.clienteAprobado && (
                        <button onClick={() => setEntregableEditando(e)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Editar</button>
                      )}
                      <button onClick={() => handleEliminarEntregable(e.id, e.nombre)} className="btn-danger" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Eliminar</button>
                    </div>
                    {e.clienteAprobado && (
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", flexShrink: 0 }}>
                        ✓ Cliente aprobó{e.fechaAprobacionCliente && <span style={{ marginLeft: 4, opacity: 0.7 }}>· {new Date(e.fechaAprobacionCliente).toLocaleDateString("es-CO")}</span>}
                      </span>
                    )}
                  </div>
                  {e.descripcion && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>{e.descripcion}</p>}
                  {e.observacionesCliente && (
                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 4, background: "var(--danger-light)", border: "1px solid var(--state-red)" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--state-red)", marginBottom: 2 }}>Observaciones del cliente</p>
                      <p style={{ fontSize: 13, color: "var(--danger)" }}>{e.observacionesCliente}</p>
                    </div>
                  )}
                </div>
                {!e.clienteAprobado && (
                  <div className="px-5 py-4 space-y-4" style={{ background: "var(--bg-card)" }}>
                    <div className="flex items-center gap-3">
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "transparent", color: e.revisionInternaAprobada ? "var(--state-green)" : "var(--state-zinc)", border: `1px solid ${e.revisionInternaAprobada ? "var(--state-green)" : "var(--state-zinc)"}`, fontFamily: "var(--font-ui)" }}>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: e.revisionInternaAprobada ? "var(--state-green)" : "var(--state-zinc)", color: "white" }}>{e.revisionInternaAprobada ? "✓" : "1"}</span>
                        Revisión interna
                      </div>
                      <div style={{ flex: 1, height: 1, background: e.revisionInternaAprobada ? "var(--state-green)" : "var(--border-subtle)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "transparent", color: e.revisionInternaAprobada ? "var(--text-muted)" : "var(--text-faint)", border: `1px solid ${e.revisionInternaAprobada ? "var(--border-subtle)" : "var(--text-faint)"}`, fontFamily: "var(--font-ui)" }}>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: "var(--text-faint)", color: "white" }}>2</span>
                        Aprobación cliente
                      </div>
                    </div>
                    {!e.revisionInternaAprobada ? (
                      <button onClick={() => patchEntregable(e.id, { revisionInternaAprobada: true })} className="btn-primary" style={{ fontSize: 13 }}>Aprobar revisión interna</button>
                    ) : e.observacionesCliente ? (
                      <div className="space-y-3">
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>El cliente devolvió este entregable. Corrígelo y re-envía para aprobación.</p>
                        <button onClick={() => patchEntregable(e.id, { observacionesCliente: null, estado: "PENDIENTE" })} className="btn-primary" style={{ fontSize: 13 }}>Re-enviar para aprobación</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea rows={2} placeholder="Observaciones del cliente (opcional para devolución)..." value={obsMap[e.id] ?? ""} onChange={(ev) => setObsMap((prev) => ({ ...prev, [e.id]: ev.target.value }))} className="form-input" style={{ height: "auto", resize: "none" }} />
                        <div className="flex gap-3">
                          <button onClick={() => patchEntregable(e.id, { clienteAprobado: true, fechaAprobacionCliente: new Date().toISOString() })} className="btn-primary" style={{ flex: 1, fontSize: 13 }}>Cliente aprobó</button>
                          <button disabled={!(obsMap[e.id] ?? "").trim()} onClick={() => patchEntregable(e.id, { observacionesCliente: obsMap[e.id], estado: "PENDIENTE" })} className="btn-danger" style={{ flex: 1, fontSize: 13 }}>Cliente devolvió</button>
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
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No hay compromisos registrados.</p>
        ) : (
          <ul className="space-y-3">
            {compromisos.map((c) => {
              const vencido = c.estado === "PENDIENTE" && esVencidoOCumpleHoy(c.fechaActual);
              return (
                <li key={c.id} style={{ padding: 16, borderRadius: 10, border: `1px solid ${vencido ? "var(--state-red)" : "var(--border-subtle)"}`, background: vencido ? "rgba(192,57,43,0.04)" : "var(--bg-card)", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }} className="sm:flex-row sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{c.descripcion}</p>
                      {vencido ? (
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-red)", border: "1px solid var(--state-red)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          VENCIDO · {calcDiasRetraso(c.fechaActual)} día{calcDiasRetraso(c.fechaActual) === 1 ? "" : "s"}
                        </span>
                      ) : c.estado === "REPROGRAMADO" ? (
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>REPROGRAMADO</span>
                      ) : (
                        <span style={{ ...(COMPROMISO_ESTADO_STYLES[c.estado] ?? { background: "transparent", color: "var(--state-zinc)", border: "1px solid var(--state-zinc)" }), padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.estado}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                      Fecha: {new Date(c.fechaActual).toLocaleDateString("es-CO")}
                      {c.reunion && (
                        <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--accent-forest)", border: "1px solid var(--accent-forest)", fontFamily: "var(--font-ui)" }}>
                          Reunión {new Date(c.reunion.fecha).toLocaleDateString("es-CO")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(c.estado === "PENDIENTE" || c.estado === "REPROGRAMADO") && !vencido && <button onClick={() => handleCumplido(c.id)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-green)", borderColor: "var(--state-green)" }}>Cumplido</button>}
                    {(c.estado === "PENDIENTE" || c.estado === "REPROGRAMADO") && esVencidoOCumpleHoy(c.fechaActual) && <button onClick={() => setVencidoModal(c)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-amber)", borderColor: "var(--state-amber)" }}>Resolver</button>}
                    <button onClick={() => handleEliminarCompromiso(c.id)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-red)", borderColor: "var(--state-red)" }}>Eliminar</button>
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
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No hay reuniones registradas.</p>
        ) : (
          <ul className="space-y-3">
            {reuniones.map((r) => (
              <li key={r.id} style={{ padding: 16, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 12 }} className="sm:flex-row sm:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{new Date(r.fecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.objetivos.length > 90 ? r.objetivos.slice(0, 90) + "…" : r.objetivos}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.calidadAprobada ? (
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Calidad aprobada</span>
                  ) : (
                    <button onClick={async () => { await api.patch(`/reuniones/${r.id}`, { calidadAprobada: true }); loadData(); }} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-amber)", borderColor: "var(--state-amber)" }}>Aprobar calidad</button>
                  )}
                  <button onClick={() => setReunionDetalle(r)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Ver detalle</button>
                  <button onClick={() => setReunionEditando(r)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Editar</button>
                  <button onClick={() => handleEliminarReunion(r.id)} className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11, color: "var(--state-red)", borderColor: "var(--state-red)" }}>Eliminar</button>
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
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No hay feedback registrado.</p>
          ) : (
            <ul className="space-y-3">
              {feedbacks.map((fb) => (
                <li key={fb.id} style={{ padding: 16, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span style={{ ...FEEDBACK_STYLES[fb.tipo].badge, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{FEEDBACK_STYLES[fb.tipo].label}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(fb.createdAt).toLocaleDateString("es-CO")}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-primary)" }}>{fb.descripcion}</p>
                      {fb.accionesTomadas && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}><span style={{ fontWeight: 600 }}>Acciones:</span> {fb.accionesTomadas}</p>}
                    </div>
                    {esAdmin && <button onClick={() => handleEliminarFeedback(fb.id)} className="btn-secondary" style={{ height: 26, padding: "0 8px", fontSize: 11, color: "var(--state-red)", borderColor: "var(--state-red)", flexShrink: 0 }}>Eliminar</button>}
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
                <button onClick={() => setShowFeedbackClienteForm(true)} className="btn-primary" style={{ height: 34, padding: "0 14px", fontSize: 13 }}>
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
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No hay feedback del cliente registrado.</p>
          ) : (
            <ul className="space-y-3">
              {feedbacksCliente.map((fb) => (
                <li key={fb.id} style={{ padding: 16, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-yellow-500 text-sm">{"⭐".repeat(fb.calificacion)}{"☆".repeat(5 - fb.calificacion)}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(fb.fechaFeedback).toLocaleDateString("es-CO")}</span>
                        {fb.entregable && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--accent-forest)", border: "1px solid var(--accent-forest)", fontFamily: "var(--font-ui)" }}>{fb.entregable.nombre}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-primary)" }}>{fb.comentario}</p>
                    </div>
                    {esAdmin && <button onClick={() => handleEliminarFeedbackCliente(fb.id)} className="btn-secondary" style={{ height: 26, padding: "0 8px", fontSize: 11, color: "var(--state-red)", borderColor: "var(--state-red)", flexShrink: 0 }}>Eliminar</button>}
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
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -4, marginBottom: 4 }}>Documentos de cobro que enviamos al cliente. El pago lo registras en "Pagos Recibidos del Cliente".</p>
          {facturas.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No hay facturas registradas para este proyecto.</p>
          ) : (
            <div style={{ borderRadius: 10, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
              <table className="w-full text-sm">
                <thead style={{ background: "var(--canvas)" }}>
                  <tr>
                    {["N° Factura","Concepto","Proveedor","Monto (COP)","Estado","Fecha emisión","PDF Factura"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: i === 3 ? "right" : "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facturas.map((f) => (
                    <tr key={f.id} style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)", transition: "background 150ms" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--canvas)")} onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}>
                      <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)", fontSize: 12 }}>{f.numero}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text-primary)" }}>{f.concepto}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontSize: 12 }}>{f.proveedor?.nombre ?? "—"}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>${Number(f.monto).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}><span style={{ ...FACTURA_ESTADO_STYLES[f.estado], padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{FACTURA_ESTADO_LABELS[f.estado]}</span></td>
                      <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{new Date(f.fechaEmision).toLocaleDateString("es-CO")}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <FileUploadButton
                          carpeta="facturas"
                          currentPath={f.archivoFacturaPath}
                          onUploaded={(path) => handleAdjuntarFactura(f.id, path)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: "var(--canvas)" }}>
                  <tr>
                    <td colSpan={3} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Total emitido</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>${facturas.reduce((s, f) => s + Number(f.monto), 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* FACTURAS EMITIDAS AL CLIENTE */}
      {esFinanciero && (
        <CollapsibleSection title="Facturas Emitidas al Cliente" sectionId="facturas-cliente" projectId={project.id} buttonText="+ Nueva factura" onClick={() => setShowFacturaClienteModal(true)}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -4, marginBottom: 12 }}>
            Facturas enviadas al cliente con seguimiento de pagos recibidos y saldo pendiente.
          </p>
          {facturasCliente.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", padding: "8px 0" }}>No hay facturas registradas.</p>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--card-border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--content-bg)" }}>
                    {["N°", "Concepto", "Emisión", "Total", "Pagado", "Saldo", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "" ? "right" : "left", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", borderBottom: "1px solid var(--card-border)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facturasCliente.map((fc, idx) => {
                    const pctPagado = fc.monto > 0 ? Math.round((fc.montoPagado / fc.monto) * 100) : 0;
                    return (
                      <tr key={fc.id} style={{ background: idx % 2 === 0 ? "white" : "var(--content-bg)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>#{fc.numero}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-primary)", maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fc.concepto}</div>
                          {fc.observaciones && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fc.observaciones}</div>}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(fc.fechaEmision).toLocaleDateString("es-CO")}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>${fc.monto.toLocaleString("es-CO")}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 50, height: 5, borderRadius: 99, background: "var(--border-subtle)", overflow: "hidden" }}>
                              <div style={{ width: `${pctPagado}%`, height: "100%", background: "var(--state-green)", borderRadius: 99 }} />
                            </div>
                            <span style={{ color: "var(--state-green)", fontWeight: 600, fontSize: 12, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>${fc.montoPagado.toLocaleString("es-CO")}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: fc.saldoPendiente > 0 ? "var(--state-red)" : "var(--state-green)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                          {fc.saldoPendiente > 0 ? `$${fc.saldoPendiente.toLocaleString("es-CO")}` : "—"}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <button
                            onClick={async () => { if (!window.confirm(`¿Eliminar factura #${fc.numero}?`)) return; await api.delete(`/facturas-cliente/${fc.id}`); const r = await api.get(`/facturas-cliente/proyecto/${id}`); setFacturasCliente(r.data); }}
                            className="btn-secondary" style={{ height: 26, padding: "0 8px", fontSize: 11, color: "var(--state-red)", borderColor: "var(--state-red)" }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* PAGOS RECIBIDOS DEL CLIENTE */}
      {esFinanciero && (
        <CollapsibleSection title="Pagos Recibidos del Cliente" sectionId="cuotas" projectId={project.id} buttonText="+ Registrar pago" onClick={() => setShowCuotaModal(true)}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -4, marginBottom: 4 }}>
            Comprobantes de los pagos que el cliente ya realizó. Adjunta el soporte de cada transferencia.
          </p>
          {pagosCliente.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", padding: "8px 0" }}>No hay pagos registrados.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pagosCliente.map((pc) => {
                const PAGO_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
                  PENDIENTE: { bg: "transparent", color: "var(--state-amber)", border: "var(--state-amber)",  label: "Pendiente" },
                  RECIBIDO:  { bg: "transparent", color: "var(--state-green)", border: "var(--state-green)", label: "Recibido" },
                  VENCIDO:   { bg: "transparent", color: "var(--state-red)",   border: "var(--state-red)",   label: "Vencido" },
                  PARCIAL:   { bg: "transparent", color: "var(--accent-forest)", border: "var(--accent-forest)", label: "Parcial" },
                }
                const pcfg = PAGO_CFG[pc.estado] ?? { bg: "transparent", color: "var(--state-zinc)", border: "var(--state-zinc)", label: pc.estado }
                const esRecibido = pc.estado === "RECIBIDO"
                return (
                  <div key={pc.id} style={{
                    borderRadius: 12, overflow: "hidden",
                    border: `1px solid ${esRecibido ? "var(--state-green)" : "var(--border-subtle)"}`,
                    background: esRecibido ? "rgba(45,106,79,0.03)" : "var(--bg-card)",
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
                          background: "var(--accent-forest)", color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                        }}>
                          {pc.numeroCuota}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pc.descripcion}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", margin: 0 }}>
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
                          fontSize: 11, fontWeight: 700,                        }}>
                          {pcfg.label}
                        </span>
                        {!esRecibido && (
                          <button
                            onClick={() => { setCuotaARecibir(pc); setForzarCuotaRecibida(false); setCuotaRecibirPath(""); setMontoARecibir(String(pc.montoEsperado)); }}
                            style={{
                              padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                              background: "var(--accent-forest)", color: "white", border: "none",
                              fontSize: 12, fontWeight: 600,                              transition: "opacity 0.15s", whiteSpace: "nowrap",
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
                          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px", fontWeight: 600 }}>Acordado</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", margin: 0 }}>
                            ${Number(pc.montoEsperado).toLocaleString("es-CO")}
                          </p>
                        </div>
                        {pc.montoRecibido != null && (
                          <>
                            <div style={{ width: 1, background: "var(--card-border)", alignSelf: "stretch" }} />
                            <div>
                              <p style={{ fontSize: 11, color: "var(--state-green)", margin: "0 0 3px", fontWeight: 600 }}>Recibido</p>
                              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--state-green)", fontFamily: "var(--font-mono)", margin: 0 }}>
                                ${Number(pc.montoRecibido).toLocaleString("es-CO")}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 6px" }}>
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
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>Total acordado</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", margin: 0 }}>
                    ${pagosCliente.reduce((s, p) => s + Number(p.montoEsperado), 0).toLocaleString("es-CO")}
                  </p>
                </div>
                <div style={{ width: 1, height: 32, background: "var(--card-border)" }} />
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "var(--state-green)", margin: "0 0 2px", fontWeight: 600 }}>Total recibido</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--state-green)", fontFamily: "var(--font-mono)", margin: 0 }}>
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
                <li key={h.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--canvas)" }}>
                  <span style={{ flexShrink: 0, marginTop: 2, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 500, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em", background: "transparent", color: h.accion === "CREACION" ? "var(--state-green)" : h.accion === "ACTUALIZACION" ? "var(--accent-forest)" : "var(--state-zinc)", border: `1px solid ${h.accion === "CREACION" ? "var(--state-green)" : h.accion === "ACTUALIZACION" ? "var(--accent-forest)" : "var(--state-zinc)"}` }}>
                    {ACCION_LABELS[h.accion] ?? h.accion}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0 }}>{h.detalle}</p></div>
                  <span style={{ flexShrink: 0, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{new Date(h.fecha).toLocaleString()}</span>
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
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            style={{
              position: "fixed",
              bottom: 28,
              left: 232,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              borderRadius: 50,
              border: "none",
              background: "var(--accent-forest)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>📝</span>
            Notas
            {nota && (
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "rgba(255,255,255,0.65)", flexShrink: 0,
              }} />
            )}
          </button>

          {notasOpen && (
            <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setNotasOpen(false)}>
              <div className="absolute inset-y-0 right-0 w-full max-w-[400px] bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>Notas del Proyecto</h3>
                  <div className="flex items-center gap-3">
                    {notaSaving && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Guardando...</span>}
                    {!notaSaving && nota && <span style={{ fontSize: 12, color: "var(--state-green)" }}>Guardado</span>}
                    <button onClick={() => setNotasOpen(false)} style={{ color: "var(--text-muted)", fontSize: 18, lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto">
                  <textarea
                    rows={20}
                    value={nota}
                    onChange={(e) => handleNotaChange(e.target.value)}
                    placeholder="Escribe notas internas del proyecto... (se guardan automáticamente)"
                    className="form-input w-full min-h-[400px] resize-none"
                    style={{ height: "auto", fontFamily: "var(--font-ui)", fontSize: 14 }}
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
      {showReunionModal && <CrearReunionModal proyectoId={project.id} proyecto={{ nombre: project.nombre, estado: project.estado }} onClose={() => { setShowReunionModal(false); loadData(); }} />}
      {reunionDetalle && <DetalleReunionModal reunion={reunionDetalle} proyecto={{ nombre: project.nombre, estado: project.estado }} onClose={() => setReunionDetalle(null)} onUpdate={() => { setReunionDetalle(null); loadData(); }} />}
      {entregableEditando && <CrearEntregableModal proyectoId={project.id} entregable={entregableEditando} onClose={() => { setEntregableEditando(null); loadData(); }} />}
      {reunionEditando && <CrearReunionModal proyectoId={project.id} proyecto={{ nombre: project.nombre, estado: project.estado }} reunion={reunionEditando} onClose={() => { setReunionEditando(null); loadData(); }} />}
      {showFeedbackModal && <FeedbackModal proyectoId={project.id} onClose={() => { setShowFeedbackModal(false); loadData(); }} />}
      {showCuotaModal && <CuotaModal proyectoId={project.id} nextCuota={pagosCliente.length + 1} onClose={() => { setShowCuotaModal(false); loadData(); }} />}
      {showFacturaClienteModal && <FacturaClienteModal proyectoId={project.id} onClose={() => { setShowFacturaClienteModal(false); api.get(`/facturas-cliente/proyecto/${id}`).then(r => setFacturasCliente(r.data)).catch(() => {}); }} />}

      {cuotaARecibir && (
        <Modal
          onClose={() => { setCuotaARecibir(null); setForzarCuotaRecibida(false); setCuotaRecibirPath(""); setMontoARecibir(""); }}
          size="sm"
          accentColor="var(--accent-forest)"
        >
          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ marginBottom: 20, paddingRight: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
                Confirmar recepción de pago
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Cuota #{cuotaARecibir.numeroCuota} · {cuotaARecibir.descripcion}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Monto esperado (referencia) */}
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(45,106,79,0.04)", border: "1px solid var(--state-green)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--state-green)", margin: 0 }}>Monto esperado</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--state-green)", fontFamily: "var(--font-mono)", margin: 0 }}>
                  ${Number(cuotaARecibir.montoEsperado).toLocaleString("es-CO")}
                </p>
              </div>

              {/* Factura cliente */}
              {facturasCliente.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Factura correspondiente <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    value={facturaClienteIdParaRecibir}
                    onChange={e => setFacturaClienteIdParaRecibir(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--card-border)", background: "var(--content-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                  >
                    <option value="">— Seleccionar factura —</option>
                    {facturasCliente.map(fc => (
                      <option key={fc.id} value={fc.id}>#{fc.numero} — {fc.concepto} (saldo: ${fc.saldoPendiente.toLocaleString("es-CO")})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monto recibido */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Monto recibido (COP) <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoARecibir}
                  onChange={e => setMontoARecibir(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1.5px solid var(--card-border)",
                    background: "var(--content-bg)", color: "var(--text-primary)",
                    fontSize: 14,                    outline: "none", boxSizing: "border-box" as const,
                  }}
                />
                {Number(montoARecibir) < Number(cuotaARecibir.montoEsperado) && montoARecibir !== "" && (
                  <p style={{ fontSize: 11, color: "var(--state-amber)", marginTop: 4 }}>
                    Pago parcial — activa "Forzar recibido" para marcarlo como completado.
                  </p>
                )}
              </div>

              {/* FileUpload comprobante */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
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
                  style={{ marginTop: 2, accentColor: "var(--accent-forest)" } as React.CSSProperties}
                />
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Marcar como recibido aunque el monto sea menor al esperado
                </span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setCuotaARecibir(null); setForzarCuotaRecibida(false); setCuotaRecibirPath(""); setMontoARecibir(""); setFacturaClienteIdParaRecibir(""); }}
                style={{
                  padding: "9px 20px", borderRadius: 10,
                  border: "1.5px solid var(--card-border)", background: "white",
                  color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
                  cursor: "pointer",                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--content-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const cuotaId = cuotaARecibir.id
                  const pathAdjuntar = cuotaRecibirPath
                  await handleMarcarCuotaRecibida(cuotaId, Number(montoARecibir) || Number(cuotaARecibir.montoEsperado), forzarCuotaRecibida, facturaClienteIdParaRecibir || undefined)
                  if (pathAdjuntar) await handleAdjuntarCuota(cuotaId, pathAdjuntar)
                  setCuotaRecibirPath("")
                  setMontoARecibir("")
                }}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none",
                  background: "var(--accent-forest)", color: "white",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "opacity 0.15s",
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

      <AsistenteIA project={project} entregables={entregables} compromisos={compromisos} />
    </div>
  );
}

/* ─── MODAL NUEVA CUOTA ─────────────────────────────────────── */
const _cuotaInputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1.5px solid var(--card-border)",
  background: "var(--content-bg)", color: "var(--text-primary)",
  fontSize: 14,  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
}
const _cuotaLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  display: "block", marginBottom: 6,
}

function CuotaModal({ proyectoId, nextCuota, onClose }: { proyectoId: string; nextCuota: number; onClose: () => void }) {
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState("")
  const [archivoPath, setArchivoPath] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "var(--accent-forest)")
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
    <Modal onClose={onClose} size="sm" accentColor="var(--accent-forest)">
      <div style={{ padding: "28px 28px 24px" }}>
        <div style={{ marginBottom: 24, paddingRight: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
            Nuevo pago esperado
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
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
            <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid var(--card-border)", background: "white",
              color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
              cursor: "pointer",            }}
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
              background: "var(--accent-forest)", color: "white",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
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

/* ─── MODAL NUEVA FACTURA CLIENTE ─────────────────────────── */
function FacturaClienteModal({ proyectoId, onClose }: { proyectoId: string; onClose: () => void }) {
  const [numero, setNumero] = useState("")
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid var(--card-border)",
    background: "var(--content-bg)", color: "var(--text-primary)",
    fontSize: 14,    outline: "none", boxSizing: "border-box" as const,
  }

  const handleSubmit = async () => {
    setError(null)
    if (!numero.trim()) { setError("El número de factura es obligatorio."); return }
    if (!concepto.trim()) { setError("El concepto es obligatorio."); return }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) { setError("El monto debe ser positivo."); return }
    if (!fecha) { setError("La fecha de emisión es obligatoria."); return }
    setLoading(true)
    try {
      await api.post("/facturas-cliente", {
        proyectoId,
        numero,
        concepto,
        monto: Number(monto),
        fechaEmision: new Date(fecha).toISOString(),
        observaciones: observaciones.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear la factura.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} size="sm" accentColor="var(--accent-forest)">
      <div style={{ padding: "28px 28px 24px" }}>
        <div style={{ marginBottom: 20, paddingRight: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Nueva Factura al Cliente
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Registra una factura emitida y realiza seguimiento de pagos
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>N° Factura *</label>
              <input type="text" placeholder="001" value={numero} onChange={e => setNumero(e.target.value)} style={inputSt} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Concepto *</label>
              <input type="text" placeholder="Descripción del servicio" value={concepto} onChange={e => setConcepto(e.target.value)} style={inputSt} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Monto (COP) *</label>
              <input type="number" min="0" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} style={inputSt} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Fecha emisión *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputSt} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Observaciones <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
            <input type="text" placeholder="Notas adicionales" value={observaciones} onChange={e => setObservaciones(e.target.value)} style={inputSt} />
          </div>
          {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid var(--card-border)", background: "white", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--accent-forest)", color: "white", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Guardando..." : "Crear Factura"}
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

const ESTADO_BADGE_TIMELINE: Record<string, React.CSSProperties> = {
  COMPLETADO:  { background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)" },
  URGENTE:     { background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)" },
  VENCIDO:     { background: "transparent", color: "var(--state-red)",   border: "1px solid var(--state-red)" },
  ADVERTENCIA: { background: "transparent", color: "var(--state-amber)", border: "1px solid var(--state-amber)" },
  PENDIENTE:   { background: "transparent", color: "var(--state-zinc)",  border: "1px solid var(--state-zinc)" },
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
      <div style={{ position: "absolute", left: 12, top: 12, bottom: 12, width: 2, background: "var(--border-subtle)", borderRadius: 99 }} />

      <div className="space-y-0">

        {/* INICIO */}
        <TimelineRow
          dot={<span className="text-base leading-none">🚀</span>}
          dotBg=""
          dotStyle={{ background: "var(--state-green)" }}
          label={<span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>Inicio del proyecto</span>}
          fecha={fmt(fechaInicio)}
          isFirst
        />

        {/* ENTREGABLES */}
        {ordenados.length === 0 ? (
          <TimelineRow
            dot={<span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>}
            dotBg=""
            dotStyle={{ background: "var(--border-subtle)", border: "1px solid var(--border-subtle)" }}
            label={<span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Sin entregables definidos</span>}
          />
        ) : (
          ordenados.map((e) => (
            <TimelineRow
              key={e.id}
              dot={<div className="w-2.5 h-2.5 rounded-full" style={{ background: ENTREGABLE_COLOR[e.estado] ?? "#9CA3AF" }} />}
              dotBg=""
              dotStyle={{ background: "var(--bg-card)", border: "2px solid var(--border-subtle)" }}
              label={
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{e.nombre}</span>
                  <span style={{ ...(ESTADO_BADGE_TIMELINE[e.estado] ?? { background: "transparent", color: "var(--state-zinc)", border: "1px solid var(--state-zinc)" }), padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {ESTADO_ENTREGABLE_LABEL[e.estado] ?? e.estado}
                  </span>
                  {e.clienteAprobado && (
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "transparent", color: "var(--state-green)", border: "1px solid var(--state-green)", fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em" }}>✓ Cliente aprobó</span>
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
          dotBg=""
          dotStyle={{ background: "var(--text-muted)" }}
          label={<span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 13 }}>Fin del proyecto</span>}
          fecha={fmt(fechaFin)}
          isLast
        />

      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        {Object.entries(ENTREGABLE_COLOR).map(([estado, color]) => (
          <div key={estado} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{ESTADO_ENTREGABLE_LABEL[estado] ?? estado}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineRow({
  dot,
  dotBg,
  dotStyle,
  label,
  fecha,
  isFirst,
  isLast,
}: {
  dot: React.ReactNode
  dotBg?: string
  dotStyle?: React.CSSProperties
  label: React.ReactNode
  fecha?: string
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <div className={`relative flex items-start gap-4 ${isFirst ? "pb-5" : isLast ? "pt-5" : "py-5"} group`}>
      {/* Punto */}
      <div
        className={`relative z-10 shrink-0 w-8 h-8 -ml-8 rounded-full flex items-center justify-center shadow-sm ${dotBg ?? ""}`}
        style={dotStyle}
      >
        {dot}
      </div>
      {/* Contenido */}
      <div className="flex-1 min-w-0 flex items-start justify-between gap-3 -mt-0.5">
        <div className="flex-1 min-w-0">{label}</div>
        {fecha && (
          <span style={{ flexShrink: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>{fecha}</span>
        )}
      </div>
    </div>
  )
}

/* ─── FEEDBACK MODAL ─────────────────────────────────────────── */
const FEEDBACK_TIPO_CFG = {
  POSITIVO: { emoji: "✓", label: "Positivo", desc: "Algo que salió bien", bg: "rgba(45,106,79,0.05)", border: "var(--state-green)", color: "var(--state-green)" },
  NEGATIVO: { emoji: "✗", label: "Negativo/Urgente", desc: "Problema que necesita atención", bg: "rgba(192,57,43,0.05)", border: "var(--state-red)", color: "var(--state-red)" },
  MEJORA:   { emoji: "↑", label: "Oportunidad de mejora", desc: "Sugerencia o área a refinar", bg: "rgba(45,74,62,0.05)", border: "var(--accent-forest)", color: "var(--accent-forest)" },
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
    fontSize: 14,    outline: "none", resize: "none" as const,
    boxSizing: "border-box" as const,
  }

  return (
    <Modal onClose={onClose} accentColor="var(--accent-forest)">
      <div style={{ padding: "28px 28px 24px" }}>
        <div style={{ marginBottom: 20, paddingRight: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Nuevo Feedback Interno
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Registra observaciones sobre el estado del proyecto
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tipo: 3 card buttons */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? c.color : "var(--text-secondary)", lineHeight: 1.2 }}>
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
                style={{ fontSize: 12, color: cfg.color, marginTop: 8 }}
              >
                {cfg.desc}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
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

          {error && <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "1.5px solid var(--card-border)",
              background: "white", color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
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
              background: "var(--accent-forest)", color: "white",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
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
    fontSize: 13,    outline: "none", boxSizing: "border-box" as const,
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
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Registrar feedback del cliente
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Star rating */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
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
            }}>
              {STAR_LABELS[displayRating]}
            </span>
          </div>
        </div>

        {/* Fecha + Entregable */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
              Fecha
            </label>
            <div style={{ ...inputSt, background: "var(--content-bg)", cursor: "default", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
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
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
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

        {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: "1.5px solid var(--card-border)", background: "var(--content-bg)",
              color: "var(--text-secondary)", cursor: "pointer",            }}
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
              transition: "opacity 0.15s",
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
      <div style={{ position: "absolute", top: 18, left: "12.5%", right: "12.5%", height: 2, background: "var(--border-subtle)" }} />
      <div style={{ position: "absolute", top: 18, left: "12.5%", height: 2, background: "var(--state-green)", transition: "width 500ms", width: `${currentIdx * 25}%` }} />
      {ETAPAS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, zIndex: 10, position: "relative", background: done || active ? "var(--state-green)" : "var(--bg-card)", color: done || active ? "white" : "var(--text-muted)", border: done || active ? "none" : "2px solid var(--border-subtle)", boxShadow: active ? "0 0 0 4px rgba(45,106,79,0.15)" : "none" }}>
              {done ? "✓" : idx + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3, color: active ? "var(--state-green)" : done ? "var(--state-green)" : "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
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
            margin: 0,
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
              background: "var(--accent-forest)", color: "white",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "opacity 0.15s",
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
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
      <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{value || "-"}</p>
    </div>
  )
}
