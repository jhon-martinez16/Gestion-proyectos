import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearFacturaClienteDto } from './dto/crear-factura-cliente.dto'

@Injectable()
export class FacturasClienteService {
  constructor(private prisma: PrismaService) {}

  private checkFinanciero(rol: string) {
    if (rol !== 'ADMIN' && rol !== 'ADMINISTRATIVO') {
      throw new ForbiddenException('Solo ADMIN y ADMINISTRATIVO pueden gestionar facturas del cliente')
    }
  }

  async crear(dto: CrearFacturaClienteDto, usuario: { sub: string; rol: string }) {
    this.checkFinanciero(usuario.rol)
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: dto.proyectoId } })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')

    return this.prisma.facturaCliente.create({
      data: {
        proyectoId: dto.proyectoId,
        numero: dto.numero,
        concepto: dto.concepto,
        monto: dto.monto,
        fechaEmision: new Date(dto.fechaEmision),
        observaciones: dto.observaciones,
      },
    })
  }

  async listarPorProyecto(proyectoId: string) {
    const facturas = await this.prisma.facturaCliente.findMany({
      where: { proyectoId },
      include: {
        pagos: {
          select: { montoRecibido: true, estado: true },
        },
      },
      orderBy: { fechaEmision: 'asc' },
    })

    return facturas.map((f) => {
      const montoPagado = f.pagos.reduce((s, p) => s + Number(p.montoRecibido ?? 0), 0)
      return {
        id: f.id,
        numero: f.numero,
        concepto: f.concepto,
        monto: Number(f.monto),
        fechaEmision: f.fechaEmision,
        observaciones: f.observaciones,
        createdAt: f.createdAt,
        montoPagado,
        saldoPendiente: Number(f.monto) - montoPagado,
        numeroPagos: f.pagos.length,
      }
    })
  }

  async eliminar(id: string, usuario: { sub: string; rol: string }) {
    this.checkFinanciero(usuario.rol)
    const fc = await this.prisma.facturaCliente.findUnique({ where: { id } })
    if (!fc) throw new NotFoundException('Factura no encontrada')
    await this.prisma.facturaCliente.delete({ where: { id } })
    return { mensaje: 'Factura eliminada' }
  }
}
