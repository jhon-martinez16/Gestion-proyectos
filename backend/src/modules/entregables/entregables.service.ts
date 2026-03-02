import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CrearEntregableDto } from './dto/crear-entregable.dto'
import { ActualizarEntregableDto } from './dto/actualizar-entregable.dto'
import { EvaluadorProyectoService } from 'src/common/services/evaluador-proyecto.service'

@Injectable()
export class EntregablesService {
  constructor(
    private prisma: PrismaService,
    private evaluador: EvaluadorProyectoService,
  ) {}

  async crear(dto: CrearEntregableDto) {
    const creado = await this.prisma.entregable.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaEntrega: new Date(dto.fechaEntrega),
        proyectoId: dto.proyectoId,
      },
    })

    await this.evaluador.actualizarEstado(dto.proyectoId)

    return creado
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.entregable.findMany({
      where: { proyectoId },
      orderBy: { fechaEntrega: 'asc' },
    })
  }

  async obtenerPorId(id: string) {
    const entregable = await this.prisma.entregable.findUnique({
      where: { id },
    })

    if (!entregable) {
      throw new BadRequestException('Entregable no existe')
    }

    return entregable
  }

  async actualizar(id: string, dto: ActualizarEntregableDto) {
    const actualizado = await this.prisma.entregable.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaEntrega: dto.fechaEntrega
          ? new Date(dto.fechaEntrega)
          : undefined,
      },
    })

    await this.evaluador.actualizarEstado(actualizado.proyectoId)

    return actualizado
  }

  async eliminar(id: string) {
    const entregable = await this.prisma.entregable.findUnique({
      where: { id },
    })

    if (!entregable) {
      throw new BadRequestException('Entregable no existe')
    }

    await this.prisma.entregable.delete({
      where: { id },
    })

    await this.evaluador.actualizarEstado(entregable.proyectoId)

    return { mensaje: 'Entregable eliminado correctamente' }
  }
}
