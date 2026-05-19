import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearFeedbackClienteDto } from './dto/crear-feedback-cliente.dto'

@Injectable()
export class FeedbackClienteService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearFeedbackClienteDto, usuario: { sub: string }) {
    return this.prisma.feedbackCliente.create({
      data: {
        proyectoId: dto.proyectoId,
        entregableId: dto.entregableId ?? null,
        calificacion: dto.calificacion,
        comentario: dto.comentario,
        fechaFeedback: new Date(dto.fechaFeedback),
        registradoPorId: usuario.sub,
      },
      include: { entregable: { select: { id: true, nombre: true } } },
    })
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.feedbackCliente.findMany({
      where: { proyectoId },
      orderBy: { fechaFeedback: 'desc' },
      include: { entregable: { select: { id: true, nombre: true } } },
    })
  }

  async eliminar(id: string) {
    const fb = await this.prisma.feedbackCliente.findUnique({ where: { id } })
    if (!fb) throw new NotFoundException('Feedback no encontrado')
    await this.prisma.feedbackCliente.delete({ where: { id } })
    return { mensaje: 'Feedback eliminado' }
  }
}
