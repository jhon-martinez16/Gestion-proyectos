import type { ReactNode } from "react"
import {
  Plus, Trash2, Settings, ArrowRight, Bell, Search,
  FolderOpen, AlertTriangle, CheckCircle2, Info,
} from "lucide-react"

import Button from "../components/ui/Button"
import Badge, { type BadgeVariant } from "../components/ui/Badge"
import StatusDot, { type DotStatus } from "../components/ui/StatusDot"
import Avatar from "../components/ui/Avatar"
import AvatarGroup from "../components/ui/AvatarGroup"
import Skeleton from "../components/ui/Skeleton"
import EmptyState from "../components/ui/EmptyState"
import SectionHeader from "../components/ui/SectionHeader"
import ProgressBar, { type ProgressColor } from "../components/ui/ProgressBar"

// ── Layout helpers ────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-lg font-semibold text-ink mb-1">{title}</h2>
      <div className="h-px bg-ui-border mb-6" />
      {children}
    </section>
  )
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">{title}</p>
      {children}
    </div>
  )
}

function Row({ children, gap = "gap-3" }: { children: ReactNode; gap?: string }) {
  return <div className={`flex flex-wrap items-center ${gap}`}>{children}</div>
}

// ── Color palette data ────────────────────────────────────────────
const PALETTE = [
  { group: "Texto",     tokens: [
    { name: "ink",       hex: "#18181B", bg: "bg-ink",       light: true  },
    { name: "ink-2",     hex: "#71717A", bg: "bg-ink-2",     light: true  },
    { name: "ink-3",     hex: "#A1A1AA", bg: "bg-ink-3",     light: false },
    { name: "ink-4",     hex: "#D4D4D8", bg: "bg-ink-4",     light: false },
  ]},
  { group: "Fondos",    tokens: [
    { name: "canvas",   hex: "#FAFAF9", bg: "bg-canvas",    light: false },
    { name: "canvas-2", hex: "#F4F4F5", bg: "bg-canvas-2",  light: false },
    { name: "white",    hex: "#FFFFFF", bg: "bg-white",     light: false },
  ]},
  { group: "Primario",  tokens: [
    { name: "primary",       hex: "#15803D", bg: "bg-primary",       light: true  },
    { name: "primary-dark",  hex: "#166534", bg: "bg-primary-dark",  light: true  },
    { name: "primary-light", hex: "#F0FDF4", bg: "bg-primary-light", light: false },
  ]},
  { group: "Acento",    tokens: [
    { name: "accent",       hex: "#F97316", bg: "bg-accent",       light: true  },
    { name: "accent-dark",  hex: "#EA6C0A", bg: "bg-accent-dark",  light: true  },
    { name: "accent-light", hex: "#FFF7ED", bg: "bg-accent-light", light: false },
  ]},
  { group: "Estados",   tokens: [
    { name: "state-green",     hex: "#15803D", bg: "bg-state-green",     light: true  },
    { name: "state-green-bg",  hex: "#F0FDF4", bg: "bg-state-green-bg",  light: false },
    { name: "state-amber",     hex: "#D97706", bg: "bg-state-amber",     light: true  },
    { name: "state-amber-bg",  hex: "#FFFBEB", bg: "bg-state-amber-bg",  light: false },
    { name: "state-red",       hex: "#DC2626", bg: "bg-state-red",       light: true  },
    { name: "state-red-bg",    hex: "#FEF2F2", bg: "bg-state-red-bg",    light: false },
    { name: "state-blue",      hex: "#2563EB", bg: "bg-state-blue",      light: true  },
    { name: "state-blue-bg",   hex: "#EFF6FF", bg: "bg-state-blue-bg",   light: false },
    { name: "state-violet",    hex: "#7C3AED", bg: "bg-state-violet",    light: true  },
    { name: "state-violet-bg", hex: "#F5F3FF", bg: "bg-state-violet-bg", light: false },
    { name: "state-zinc",      hex: "#52525B", bg: "bg-state-zinc",      light: true  },
    { name: "state-zinc-bg",   hex: "#F4F4F5", bg: "bg-state-zinc-bg",   light: false },
  ]},
]

// ── Swatch component ──────────────────────────────────────────────
function Swatch({ name, hex, bg, light }: { name: string; hex: string; bg: string; light: boolean }) {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-ui-border w-24">
      <div className={`h-12 ${bg}`} />
      <div className="p-1.5 bg-white">
        <p className="text-[10px] font-semibold text-ink truncate">{name}</p>
        <p className="text-[9px] font-mono text-ink-3 mt-0.5">{hex}</p>
      </div>
    </div>
  )
}

// ── Shadow showcase ───────────────────────────────────────────────
const SHADOWS = [
  { name: "card",     cls: "shadow-card"    },
  { name: "card-hover",cls: "shadow-card-hover" },
  { name: "elevated", cls: "shadow-elevated" },
  { name: "fab",      cls: "shadow-fab"     },
]

// ── Main component ────────────────────────────────────────────────
export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-canvas py-12 px-8">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            Internal · DEV only
          </p>
          <h1 className="page-title text-ink mb-2">Design System</h1>
          <p className="text-sm text-ink-2">
            Logique Consulting · componentes, tokens y variantes
          </p>
        </div>

        {/* ── 1. TIPOGRAFÍA ── */}
        <Section title="Tipografía">
          <div className="space-y-4 bg-white rounded-xl border border-ui-border p-6">
            <div>
              <p className="text-[10px] font-mono text-ink-3 mb-1">.page-title · Instrument Serif 400</p>
              <h1 className="page-title">Gestión de Proyectos</h1>
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-3 mb-1">.section-title · Inter 600</p>
              <h2 className="section-title">Compromisos del proyecto</h2>
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-3 mb-1">body · Inter 400 · 14px</p>
              <p className="text-sm text-ink leading-relaxed">
                El sistema gestiona proyectos, compromisos y entregables con seguimiento automático de estados y alertas.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-3 mb-1">caption · Inter 400 · 12px · ink-2</p>
              <p className="text-xs text-ink-2">Actualizado hace 3 días · Liderado por Carlos Mendez</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-3 mb-1">mono · JetBrains Mono 400 · 12px</p>
              <p className="font-mono text-xs text-ink-2 tabular-nums">
                #INV-0042 · $24.500.000 · 2026-05-23
              </p>
            </div>
          </div>
        </Section>

        {/* ── 2. PALETA ── */}
        <Section title="Paleta de color">
          {PALETTE.map(({ group, tokens }) => (
            <Sub key={group} title={group}>
              <div className="flex flex-wrap gap-2">
                {tokens.map((t) => (
                  <Swatch key={t.name} {...t} />
                ))}
              </div>
            </Sub>
          ))}
        </Section>

        {/* ── 3. SOMBRAS ── */}
        <Section title="Sombras">
          <div className="flex flex-wrap gap-6">
            {SHADOWS.map(({ name, cls }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className={`w-32 h-20 bg-white rounded-xl ${cls}`} />
                <p className="text-[10px] font-mono text-ink-3">.{cls}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 4. BOTONES ── */}
        <Section title="Botones">
          <Sub title="Variantes (tamaño md)">
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="primary-green" leftIcon={Plus}>Primary green</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger" leftIcon={Trash2}>Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="icon"><Settings size={15} /></Button>
            </Row>
          </Sub>

          <Sub title="Tamaños (primary)">
            <Row gap="gap-3 items-end">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </Row>
          </Sub>

          <Sub title="Con iconos">
            <Row>
              <Button variant="primary"       leftIcon={Plus}      size="sm">Nuevo proyecto</Button>
              <Button variant="primary-green" rightIcon={ArrowRight} size="md">Continuar</Button>
              <Button variant="secondary"     leftIcon={Search}    size="md">Buscar</Button>
              <Button variant="danger"        leftIcon={Trash2}    size="sm">Eliminar</Button>
              <Button variant="ghost"         leftIcon={Bell}      size="sm">Alertas</Button>
            </Row>
          </Sub>

          <Sub title="Estados especiales">
            <Row>
              <Button variant="primary"       loading>Guardando…</Button>
              <Button variant="primary-green" loading size="sm">Procesando</Button>
              <Button variant="primary"       disabled>Deshabilitado</Button>
              <Button variant="secondary"     disabled>Deshabilitado</Button>
            </Row>
          </Sub>
        </Section>

        {/* ── 5. BADGES ── */}
        <Section title="Badges">
          <Sub title="Estados de proyecto (con pulse en EN_CURSO y EN_RIESGO)">
            <Row>
              {(["EN_CURSO","ADVERTENCIA","EN_RIESGO","FINALIZADO","PROPUESTA"] as BadgeVariant[]).map((v) => (
                <Badge key={v} variant={v} />
              ))}
            </Row>
          </Sub>

          <Sub title="Genéricos">
            <Row>
              {(["success","warning","danger","info","neutral","purple"] as BadgeVariant[]).map((v) => (
                <Badge key={v} variant={v} />
              ))}
            </Row>
          </Sub>

          <Sub title="Tamaño md + label override">
            <Row>
              <Badge variant="EN_CURSO"    size="md" label="Proyecto activo" />
              <Badge variant="ADVERTENCIA" size="md" />
              <Badge variant="FINALIZADO"  size="md" label="Completado" />
            </Row>
          </Sub>

          <Sub title="Pulse forzado / sin pulse">
            <Row>
              <Badge variant="EN_CURSO"  pulse={false} label="Sin pulse" />
              <Badge variant="FINALIZADO" pulse={true}  label="Con pulse" />
            </Row>
          </Sub>
        </Section>

        {/* ── 6. STATUS DOT ── */}
        <Section title="Status Dot">
          <Sub title="Tamaños y estados (sin pulse)">
            <div className="flex flex-wrap items-end gap-6">
              {(["active","warning","danger","paused","neutral","info","violet"] as DotStatus[]).map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-2">
                    <StatusDot status={s} size="xs" />
                    <StatusDot status={s} size="sm" />
                    <StatusDot status={s} size="md" />
                  </div>
                  <p className="text-[9px] font-mono text-ink-3">{s}</p>
                </div>
              ))}
            </div>
          </Sub>
          <Sub title="Con pulse (xs/sm/md)">
            <div className="flex items-end gap-6">
              {(["active","danger"] as DotStatus[]).map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-2">
                    <StatusDot status={s} size="xs" pulse />
                    <StatusDot status={s} size="sm" pulse />
                    <StatusDot status={s} size="md" pulse />
                  </div>
                  <p className="text-[9px] font-mono text-ink-3">{s} + pulse</p>
                </div>
              ))}
            </div>
          </Sub>
        </Section>

        {/* ── 7. AVATARS ── */}
        <Section title="Avatars">
          <Sub title="Tamaños individuales">
            <Row gap="gap-4 items-end">
              {(["xs","sm","md","lg","xl"] as const).map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <Avatar name="Carlos Mendez" size={s} />
                  <p className="text-[9px] font-mono text-ink-3">{s}</p>
                </div>
              ))}
            </Row>
          </Sub>

          <Sub title="Diferentes nombres (colores únicos)">
            <Row>
              {["Ana García","Juan Pérez","María López","Carlos Ruiz","Sofía Torres"].map((n) => (
                <Avatar key={n} name={n} size="md" title={n} />
              ))}
            </Row>
          </Sub>

          <Sub title="Con ring">
            <div className="flex -space-x-2">
              {["Ana García","Juan Pérez","María López"].map((n) => (
                <Avatar key={n} name={n} size="md" ring />
              ))}
            </div>
          </Sub>

          <Sub title="AvatarGroup (max=3, overflow +N)">
            <Row gap="gap-8 items-center">
              <div className="flex flex-col items-start gap-1">
                <AvatarGroup names={["Ana García","Juan Pérez","María López"]} size="sm" />
                <p className="text-[9px] font-mono text-ink-3">3/3 · sin overflow</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <AvatarGroup names={["Ana García","Juan Pérez","María López","Carlos Ruiz","Sofía Torres"]} max={3} size="sm" />
                <p className="text-[9px] font-mono text-ink-3">5 names · max=3 · +2</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <AvatarGroup names={["Ana García","Juan Pérez","María López","Carlos Ruiz","Sofía Torres"]} max={3} size="md" />
                <p className="text-[9px] font-mono text-ink-3">size=md</p>
              </div>
            </Row>
          </Sub>
        </Section>

        {/* ── 8. INPUTS ── */}
        <Section title="Inputs">
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <Sub title="Default">
              <input className="form-input" placeholder="Escribe aquí…" />
            </Sub>
            <Sub title="Disabled">
              <input className="form-input" placeholder="No editable" disabled />
            </Sub>
            <Sub title="Con value">
              <input className="form-input" defaultValue="Proyecto Logique 2026" readOnly />
            </Sub>
            <Sub title="Select">
              <select className="form-input">
                <option>EN_CURSO</option>
                <option>ADVERTENCIA</option>
                <option>EN_RIESGO</option>
                <option>FINALIZADO</option>
              </select>
            </Sub>
            <Sub title="Textarea">
              <textarea className="form-input" rows={3} placeholder="Descripción del proyecto…" />
            </Sub>
            <Sub title="Error state (ring rojo)">
              <input
                className="form-input ring-1 ring-state-red border-state-red"
                defaultValue="Campo inválido"
                readOnly
              />
              <p className="text-xs text-state-red mt-1.5">Este campo es requerido</p>
            </Sub>
          </div>
        </Section>

        {/* ── 9. SKELETON ── */}
        <Section title="Skeleton">
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <Sub title="text (3 lines)">
              <Skeleton variant="text" lines={3} />
            </Sub>
            <Sub title="card">
              <Skeleton variant="card" />
            </Sub>
            <Sub title="row × 3">
              <div className="space-y-1">
                <Skeleton variant="row" />
                <Skeleton variant="row" />
                <Skeleton variant="row" />
              </div>
            </Sub>
            <Sub title="avatar sm/md/lg">
              <div className="flex items-end gap-3">
                <Skeleton variant="avatar" width="24px" />
                <Skeleton variant="avatar" width="32px" />
                <Skeleton variant="avatar" width="40px" />
              </div>
            </Sub>
          </div>
        </Section>

        {/* ── 10. EMPTY STATE ── */}
        <Section title="Empty State">
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <div className="bg-white rounded-xl border border-ui-border">
              <EmptyState
                icon={FolderOpen}
                title="No hay proyectos"
                description="Crea tu primer proyecto para comenzar a gestionar compromisos y entregables."
                action={{ label: "+ Nuevo proyecto", onClick: () => {}, variant: "primary-green" }}
              />
            </div>
            <div className="bg-white rounded-xl border border-ui-border">
              <EmptyState
                icon={AlertTriangle}
                title="Sin alertas críticas"
                description="Todo está al día. Las alertas aparecerán aquí cuando haya compromisos vencidos."
              />
            </div>
          </div>
        </Section>

        {/* ── 11. SECTION HEADER ── */}
        <Section title="Section Header">
          <div className="max-w-2xl bg-white rounded-xl border border-ui-border p-6 space-y-6">
            <SectionHeader title="Sin counter ni acción" />
            <SectionHeader title="Con counter" count={7} />
            <SectionHeader title="Counter cero" count={0} />
            <SectionHeader
              title="Con acción"
              count={3}
              action={<Button variant="ghost" size="sm" leftIcon={Plus}>Añadir</Button>}
            />
            <SectionHeader
              title="Solo acción (sin counter)"
              action={<Button variant="secondary" size="sm">Ver todos</Button>}
            />
          </div>
        </Section>

        {/* ── 12. PROGRESS BAR ── */}
        <Section title="Progress Bar">
          <div className="max-w-xl bg-white rounded-xl border border-ui-border p-6 space-y-5">
            {(["primary","warning","danger","info","neutral"] as ProgressColor[]).map((c) => (
              <div key={c} className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-ink-3">{c}</span>
                </div>
                <ProgressBar color={c} value={c === "primary" ? 72 : c === "warning" ? 45 : c === "danger" ? 88 : c === "info" ? 30 : 60} showLabel />
              </div>
            ))}

            <div className="pt-2 border-t border-ui-border space-y-3">
              <p className="text-[10px] font-mono text-ink-3">Valores edge: 0% · 100% · sin label</p>
              <div className="space-y-2">
                <ProgressBar color="primary" value={0} />
                <ProgressBar color="primary" value={100} />
                <ProgressBar color="primary" value={55} height={6} />
                <ProgressBar color="danger"  value={38} height={8} showLabel />
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="pt-8 border-t border-ui-border flex items-center gap-3">
          <CheckCircle2 size={14} className="text-state-green" />
          <p className="text-xs text-ink-3">
            Logique Consulting · Design System · Fase 2 · solo visible en development
          </p>
          <Info size={14} className="text-ink-4 ml-auto" />
        </div>

      </div>
    </div>
  )
}
