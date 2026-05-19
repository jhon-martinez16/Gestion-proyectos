import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearProyectoDto } from './dto/crear-proyecto.dto'
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto'
import { EvaluadorProyectoService } from '../../common/services/evaluador-proyecto.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { EstadoProyecto, EstadoCompromiso } from '@prisma/client'

@Injectable()
export class ProyectosService {
  constructor(
    private prisma: PrismaService,
    private evaluador: EvaluadorProyectoService,
    private notificaciones: NotificacionesService,
  ) {}

  async crear(dto: CrearProyectoDto) {
    const proyecto = await this.prisma.proyecto.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        categoriaId: dto.categoriaId,
        liderId: dto.liderId,
        socio2Id: dto.socio2Id,
      },
    })

    await this.prisma.historialProyecto.create({
      data: {
        accion: 'CREACION',
        detalle: 'Proyecto creado',
        proyectoId: proyecto.id,
      },
    })

    return proyecto
  }

  async listar() {
    return this.prisma.proyecto.findMany({
      include: {
        categoria: true,
        lider: true,
        socio2: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async obtenerPorId(id: string) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: {
        categoria: true,
        lider: true,
        socio2: true,
        compromisos: true,
        entregables: true,
        historial: true,
      },
    })

    if (!proyecto) {
      throw new NotFoundException('Proyecto no existe')
    }

    return proyecto
  }

  private async verificarAccesoProyecto(proyectoId: string, usuario: { id: string; rol: string }) {
    if (usuario.rol === 'ADMIN') return
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { liderId: true, socio2Id: true },
    })
    if (!proyecto || (proyecto.liderId !== usuario.id && proyecto.socio2Id !== usuario.id)) {
      throw new ForbiddenException('Solo el líder o socio2 del proyecto pueden modificarlo')
    }
  }

  async actualizar(id: string, dto: ActualizarProyectoDto, usuario: { id: string; rol: string }) {
    const existente = await this.prisma.proyecto.findUnique({ where: { id } })

    if (!existente) {
      throw new NotFoundException('Proyecto no existe')
    }

    await this.verificarAccesoProyecto(id, usuario)

    // Validate pre-conditions before closing the project
    if (dto.estado === EstadoProyecto.FINALIZADO) {
      const [compromisosAbiertos, entregablesSinAprobar] = await Promise.all([
        this.prisma.compromiso.count({
          where: {
            proyectoId: id,
            estado: { in: [EstadoCompromiso.PENDIENTE, EstadoCompromiso.NO_CUMPLIDO] },
          },
        }),
        this.prisma.entregable.count({
          where: { proyectoId: id, clienteAprobado: false },
        }),
      ])

      if (compromisosAbiertos > 0) {
        throw new BadRequestException(
          `No se puede cerrar: hay ${compromisosAbiertos} compromiso(s) pendiente(s) o no cumplido(s).`,
        )
      }
      if (entregablesSinAprobar > 0) {
        throw new BadRequestException(
          `No se puede cerrar: hay ${entregablesSinAprobar} entregable(s) sin aprobación del cliente.`,
        )
      }
      if (!existente.propuestaAprobada) {
        throw new BadRequestException('No se puede cerrar: la propuesta no ha sido aprobada.')
      }
      if (existente.requiereContrato && !existente.contratoFirmado) {
        throw new BadRequestException('No se puede cerrar: el contrato no ha sido firmado.')
      }
      if (existente.requierePoliza && !existente.polizaContratada) {
        throw new BadRequestException('No se puede cerrar: la póliza no ha sido contratada.')
      }
    }

    const data: Record<string, unknown> = {}
    if (dto.nombre !== undefined) data.nombre = dto.nombre
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion
    if (dto.fechaFin !== undefined) data.fechaFin = new Date(dto.fechaFin)
    if (dto.etapa !== undefined) data.etapa = dto.etapa
    if (dto.contratoFirmado !== undefined) data.contratoFirmado = dto.contratoFirmado
    if (dto.kickoffRealizado !== undefined) data.kickoffRealizado = dto.kickoffRealizado
    if (dto.kickoffFecha !== undefined) data.kickoffFecha = new Date(dto.kickoffFecha)
    if (dto.estado !== undefined) data.estado = dto.estado
    if (dto.propuestaAprobada !== undefined) data.propuestaAprobada = dto.propuestaAprobada
    if (dto.requierePoliza !== undefined) data.requierePoliza = dto.requierePoliza
    if (dto.requiereContrato !== undefined) data.requiereContrato = dto.requiereContrato
    if (dto.polizaContratada !== undefined) data.polizaContratada = dto.polizaContratada

    const actualizado = await this.prisma.proyecto.update({ where: { id }, data })

    let accion = 'ACTUALIZACION'
    let detalle = 'Proyecto actualizado'
    if (dto.estado === EstadoProyecto.FINALIZADO) {
      accion = 'CIERRE_FORMAL'
      detalle = `Cierre formal del proyecto — ${new Date().toISOString()}`
    } else if (dto.contratoFirmado === true) {
      accion = 'CONTRATO_FIRMADO'
      detalle = 'Contrato del proyecto marcado como firmado'
    } else if (dto.kickoffRealizado === true) {
      accion = 'KICKOFF_REALIZADO'
      detalle = 'Kick-off del proyecto realizado'
    } else if (dto.propuestaAprobada === true) {
      accion = 'PROPUESTA_APROBADA'
      detalle = 'Propuesta del proyecto aprobada'
    } else if (dto.polizaContratada === true) {
      accion = 'POLIZA_CONTRATADA'
      detalle = 'Póliza del proyecto contratada'
    }

    const historial = this.prisma.historialProyecto.create({
      data: { accion, detalle, proyectoId: id },
    })

    // Skip auto-evaluator when project is explicitly closed — it would override FINALIZADO
    if (dto.estado === EstadoProyecto.FINALIZADO || existente.estado === EstadoProyecto.FINALIZADO) {
      await historial
    } else {
      await Promise.all([historial, this.evaluador.actualizarEstado(id)])
    }

    // Notify ADMINISTRATIVO users when propuestaAprobada changes to true
    if (dto.propuestaAprobada === true && !existente.propuestaAprobada) {
      await this.notificaciones.crearParaAdministrativos(
        id,
        `Propuesta aprobada: ${existente.nombre} — requiere gestión administrativa`,
      )
    }

    return actualizado
  }

  async eliminar(id: string) {
    const existente = await this.prisma.proyecto.findUnique({
      where: { id },
    })

    if (!existente) {
      throw new NotFoundException('Proyecto no existe')
    }

    await this.prisma.proyecto.delete({
      where: { id },
    })

    return { mensaje: 'Proyecto eliminado correctamente' }
  }

  // 🔥 MÉTODO CORREGIDO
  async obtenerTodos() {
    const proyectos = await this.prisma.proyecto.findMany({
      include: {
        categoria: true,
        lider: true,
        socio2: true,
        compromisos: true,
        entregables: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const proyectosConEstado = await Promise.all(
      proyectos.map(async (proyecto) => {
        const evaluacion =
          await this.evaluador.evaluarProyectoCompleto(proyecto.id)

        return {
          ...proyecto,
          estadoCalculado: evaluacion.estado,
          totalVencidos: evaluacion.totalVencidos,
          totalProximos: evaluacion.totalProximos,
        }
      }),
    )

    return proyectosConEstado
  }

  async historial(id: string) {
    return this.prisma.historialProyecto.findMany({
      where: { proyectoId: id },
      orderBy: { fecha: 'desc' },
    })
  }
}