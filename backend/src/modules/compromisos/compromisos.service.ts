import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EstadoCompromiso } from '@prisma/client'
import { CrearCompromisoDto } from './dto/crear-compromiso.dto'
import { ResolverCompromisoDto, DecisionCompromiso } from './dto/resolver-compromiso.dto'
import { EvaluadorProyectoService } from '../../common/services/evaluador-proyecto.service'

@Injectable()
export class CompromisosService {
  constructor(
    private prisma: PrismaService,
    private evaluador: EvaluadorProyectoService,
  ) {}

  private registrarHistorial(proyectoId: string, accion: string, detalle: string) {
    return this.prisma.historialProyecto.create({
      data: { proyectoId, accion, detalle },
    })
  }

  private async verificarAccesoProyecto(proyectoId: string, usuario: { id: string; rol: string }) {
    if (usuario.rol === 'ADMIN' || usuario.rol === 'ADMINISTRATIVO') return
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { liderId: true, socio2Id: true },
    })
    if (!proyecto || (proyecto.liderId !== usuario.id && proyecto.socio2Id !== usuario.id)) {
      throw new ForbiddenException('Solo puedes operar en proyectos donde eres líder o socio')
    }
  }

  async crear(dto: CrearCompromisoDto, usuario: { id: string; rol: string }) {
    await this.verificarAccesoProyecto(dto.proyectoId, usuario)
    const fecha = new Date(dto.fecha)

    const creado = await this.prisma.compromiso.create({
      data: {
        descripcion: dto.descripcion,
        fechaOriginal: fecha,
        fechaActual: fecha,
        proyectoId: dto.proyectoId,
        responsableId: dto.responsableId ?? null,
        reunionId: dto.reunionId ?? null,
      },
    })

    await Promise.all([
      this.evaluador.actualizarEstado(dto.proyectoId),
      this.registrarHistorial(
        dto.proyectoId,
        'COMPROMISO_CREADO',
        `Compromiso creado: "${dto.descripcion}"`,
      ),
    ])

    return creado
  }

  async listarTodos() {
    return this.prisma.compromiso.findMany({
      orderBy: { fechaActual: 'asc' },
    })
  }

  async obtenerVencidos(proyectoId: string) {
    const hoy = new Date()
    return this.prisma.compromiso.findMany({
      where: {
        proyectoId,
        estado: EstadoCompromiso.PENDIENTE,
        fechaActual: { lte: hoy },
      },
      orderBy: { fechaActual: 'asc' },
    })
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.compromiso.findMany({
      where: { proyectoId },
      include: { reunion: { select: { id: true, fecha: true } } },
      orderBy: { fechaActual: 'asc' },
    })
  }

  async resolver(id: string, dto: ResolverCompromisoDto, usuario: { id: string; rol: string }) {
    const compromiso = await this.prisma.compromiso.findUnique({ where: { id } })

    if (!compromiso) {
      throw new BadRequestException('Compromiso no existe')
    }

    await this.verificarAccesoProyecto(compromiso.proyectoId, usuario)

    // ── CUMPLIDO ──────────────────────────────────────────────────────────────
    if (dto.decision === DecisionCompromiso.CUMPLIDO) {
      const fechaCumplimiento = dto.fechaCumplimiento ? new Date(dto.fechaCumplimiento) : new Date()
      const diasRetraso = Math.max(
        0,
        Math.floor((fechaCumplimiento.getTime() - compromiso.fechaActual.getTime()) / (1000 * 60 * 60 * 24)),
      )

      const actualizado = await this.prisma.compromiso.update({
        where: { id },
        data: { estado: EstadoCompromiso.CUMPLIDO },
      })

      const detalle =
        diasRetraso > 0
          ? `Compromiso "${compromiso.descripcion}" cumplido con ${diasRetraso} día${diasRetraso === 1 ? '' : 's'} de retraso`
          : `Compromiso "${compromiso.descripcion}" cumplido a tiempo`

      await Promise.all([
        this.evaluador.actualizarEstado(compromiso.proyectoId),
        this.registrarHistorial(compromiso.proyectoId, 'COMPROMISO_CUMPLIDO', detalle),
      ])

      return actualizado
    }

    // ── NO CUMPLIDO ───────────────────────────────────────────────────────────
    if (dto.decision === DecisionCompromiso.NO_CUMPLIDO) {
      if (!dto.comentario) {
        throw new BadRequestException('Comentario obligatorio')
      }
      if (!dto.nuevaFecha || !dto.nuevaDescripcion) {
        throw new BadRequestException('Debe crear nuevo compromiso obligatorio')
      }

      await this.prisma.compromiso.update({
        where: { id },
        data: { estado: EstadoCompromiso.NO_CUMPLIDO, comentario: dto.comentario },
      })

      const nuevo = await this.prisma.compromiso.create({
        data: {
          descripcion: dto.nuevaDescripcion,
          fechaOriginal: new Date(dto.nuevaFecha),
          fechaActual: new Date(dto.nuevaFecha),
          proyectoId: compromiso.proyectoId,
        },
      })

      await Promise.all([
        this.evaluador.actualizarEstado(compromiso.proyectoId),
        this.registrarHistorial(
          compromiso.proyectoId,
          'COMPROMISO_NO_CUMPLIDO',
          `Compromiso no cumplido: "${compromiso.descripcion}". Nuevo compromiso creado: "${dto.nuevaDescripcion}"`,
        ),
      ])

      return nuevo
    }

    // ── REPROGRAMAR ───────────────────────────────────────────────────────────
    if (dto.decision === DecisionCompromiso.REPROGRAMAR) {
      if (!dto.nuevaFecha) {
        throw new BadRequestException('Debe indicar nueva fecha')
      }

      const fechaOriginal = compromiso.fechaActual.toLocaleDateString('es-CO')
      const fechaNueva = new Date(dto.nuevaFecha).toLocaleDateString('es-CO')

      const actualizado = await this.prisma.compromiso.update({
        where: { id },
        data: {
          estado: EstadoCompromiso.REPROGRAMADO,
          fechaActual: new Date(dto.nuevaFecha),
        },
      })

      const sufijo = dto.motivo ? `. Motivo: ${dto.motivo}` : ''
      const detalle = `Compromiso "${compromiso.descripcion}" reprogramado de ${fechaOriginal} a ${fechaNueva}${sufijo}`

      await Promise.all([
        this.evaluador.actualizarEstado(compromiso.proyectoId),
        this.registrarHistorial(compromiso.proyectoId, 'COMPROMISO_REPROGRAMADO', detalle),
      ])

      return actualizado
    }

    throw new BadRequestException('Decisión inválida')
  }

  async eliminar(id: string, usuario: { id: string; rol: string }) {
    const compromiso = await this.prisma.compromiso.findUnique({ where: { id } })
    if (!compromiso) throw new BadRequestException('Compromiso no existe')

    await this.verificarAccesoProyecto(compromiso.proyectoId, usuario)

    await this.prisma.compromiso.delete({ where: { id } })

    await Promise.all([
      this.evaluador.actualizarEstado(compromiso.proyectoId),
      this.registrarHistorial(
        compromiso.proyectoId,
        'COMPROMISO_ELIMINADO',
        `Compromiso eliminado: "${compromiso.descripcion}"`,
      ),
    ])

    return { mensaje: 'Compromiso eliminado correctamente' }
  }
}
