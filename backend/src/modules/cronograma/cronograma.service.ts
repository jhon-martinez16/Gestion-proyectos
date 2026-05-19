import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearVersionDto } from './dto/crear-version.dto'

@Injectable()
export class CronogramaService {
  constructor(private prisma: PrismaService) {}

  async crearVersion(proyectoId: string, dto: CrearVersionDto, usuario: { sub: string }) {
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: proyectoId } })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')

    const ultima = await this.prisma.cronogramaVersion.findFirst({
      where: { proyectoId },
      orderBy: { version: 'desc' },
    })

    return this.prisma.cronogramaVersion.create({
      data: {
        proyectoId,
        version: (ultima?.version ?? 0) + 1,
        descripcionCambios: dto.descripcionCambios,
        creadoPorId: usuario.sub,
      },
    })
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.cronogramaVersion.findMany({
      where: { proyectoId },
      orderBy: { version: 'desc' },
    })
  }

  async aprobarCliente(id: string) {
    const version = await this.prisma.cronogramaVersion.findUnique({ where: { id } })
    if (!version) throw new NotFoundException('Versión no encontrada')
    return this.prisma.cronogramaVersion.update({
      where: { id },
      data: { aprobadoCliente: true, fechaAprobacion: new Date() },
    })
  }
}
