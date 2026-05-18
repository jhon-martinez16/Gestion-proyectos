import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CrearPagoClienteDto } from './dto/crear-pago-cliente.dto'
import { MarcarRecibidoDto } from './dto/marcar-recibido.dto'
import { PagoEstado } from '@prisma/client'

@Injectable()
export class PagosClienteService {
  constructor(private prisma: PrismaService) {}

  private checkFinanciero(rol: string) {
    if (rol !== 'ADMIN' && rol !== 'ADMINISTRATIVO') {
      throw new ForbiddenException('Solo ADMIN y ADMINISTRATIVO pueden gestionar pagos de cliente')
    }
  }

  async crear(dto: CrearPagoClienteDto, usuario: { sub: string; rol: string }) {
    this.checkFinanciero(usuario.rol)
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: dto.proyectoId } })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')

    return this.prisma.pagoCliente.create({
      data: {
        proyectoId: dto.proyectoId,
        numeroCuota: dto.numeroCuota,
        descripcion: dto.descripcion,
        montoEsperado: dto.montoEsperado,
        fechaEsperada: new Date(dto.fechaEsperada),
        observaciones: dto.observaciones,
      },
    })
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.pagoCliente.findMany({
      where: { proyectoId },
      orderBy: { numeroCuota: 'asc' },
    })
  }

  async marcarRecibido(id: string, dto: MarcarRecibidoDto, usuario: { sub: string; rol: string }) {
    this.checkFinanciero(usuario.rol)
    const pago = await this.prisma.pagoCliente.findUnique({ where: { id } })
    if (!pago) throw new NotFoundException('Pago no encontrado')

    const montoRecibido = Number(dto.montoRecibido)
    const montoEsperado = Number(pago.montoEsperado)
    const estado: PagoEstado =
      montoRecibido >= montoEsperado ? PagoEstado.RECIBIDO : PagoEstado.PARCIAL

    return this.prisma.pagoCliente.update({
      where: { id },
      data: {
        montoRecibido,
        fechaRecibido: new Date(dto.fechaRecibido),
        estado,
        observaciones: dto.observaciones ?? pago.observaciones,
        comprobantePath: dto.comprobantePath ?? pago.comprobantePath,
      },
    })
  }

  async eliminar(id: string, usuario: { sub: string; rol: string }) {
    this.checkFinanciero(usuario.rol)
    const pago = await this.prisma.pagoCliente.findUnique({ where: { id } })
    if (!pago) throw new NotFoundException('Pago no encontrado')
    await this.prisma.pagoCliente.delete({ where: { id } })
    return { mensaje: 'Pago eliminado' }
  }

  async actualizarVencidos(): Promise<{ proyectoId: string; numeroCuota: number }[]> {
    const hoy = new Date()
    const afectados = await this.prisma.pagoCliente.findMany({
      where: { estado: PagoEstado.PENDIENTE, fechaEsperada: { lt: hoy } },
      select: { id: true, proyectoId: true, numeroCuota: true },
    })
    if (afectados.length > 0) {
      await this.prisma.pagoCliente.updateMany({
        where: { id: { in: afectados.map((p) => p.id) } },
        data: { estado: PagoEstado.VENCIDO },
      })
    }
    return afectados
  }
}
