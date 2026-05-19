import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearFacturaDto } from './dto/crear-factura.dto'
import { ActualizarFacturaDto, ProgramarPagoDto, EjecutarPagoDto, ConfirmarPagoDto } from './dto/actualizar-factura.dto'
import { EstadoFactura } from '@prisma/client'

@Injectable()
export class FacturasService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearFacturaDto) {
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: dto.proyectoId } })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')

    return this.prisma.factura.create({
      data: {
        proyectoId: dto.proyectoId,
        numero: dto.numero,
        concepto: dto.concepto,
        monto: dto.monto,
        fechaEmision: new Date(dto.fechaEmision),
        observaciones: dto.observaciones,
        proveedorId: dto.proveedorId ?? null,
      },
      include: {
        proyecto: { select: { id: true, nombre: true } },
        proveedor: { select: { id: true, nombre: true } },
      },
    })
  }

  async listar() {
    return this.prisma.factura.findMany({
      include: {
        proyecto: { select: { id: true, nombre: true } },
        proveedor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listarPorProyecto(proyectoId: string) {
    return this.prisma.factura.findMany({
      where: { proyectoId },
      include: { proveedor: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async obtenerPorId(id: string) {
    const factura = await this.prisma.factura.findUnique({
      where: { id },
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
    if (!factura) throw new NotFoundException('Factura no encontrada')
    return factura
  }

  async actualizar(id: string, dto: ActualizarFacturaDto) {
    await this.obtenerPorId(id)

    const data: Record<string, unknown> = {}
    if (dto.numero !== undefined) data.numero = dto.numero
    if (dto.concepto !== undefined) data.concepto = dto.concepto
    if (dto.monto !== undefined) data.monto = dto.monto
    if (dto.estado !== undefined) data.estado = dto.estado
    if (dto.fechaEmision !== undefined) data.fechaEmision = new Date(dto.fechaEmision)
    if (dto.fechaPago !== undefined) data.fechaPago = new Date(dto.fechaPago)
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones
    if (dto.comprobantePagoPath !== undefined) data.comprobantePagoPath = dto.comprobantePagoPath

    return this.prisma.factura.update({
      where: { id },
      data,
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
  }

  async programarPago(id: string, dto: ProgramarPagoDto) {
    const factura = await this.obtenerPorId(id)
    if (factura.estado !== EstadoFactura.APROBADA) {
      throw new BadRequestException('Solo se puede programar pago de facturas APROBADAS')
    }
    return this.prisma.factura.update({
      where: { id },
      data: { fechaProgramadaPago: new Date(dto.fechaProgramadaPago) },
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
  }

  async ejecutarPago(id: string, dto: EjecutarPagoDto) {
    const factura = await this.obtenerPorId(id)
    if (!factura.fechaProgramadaPago) {
      throw new BadRequestException('Debe programar el pago antes de ejecutarlo')
    }
    return this.prisma.factura.update({
      where: { id },
      data: {
        pagoEjecutado: true,
        fechaPagoEjecutado: new Date(),
        comprobantePagoPath: dto.comprobantePagoPath ?? null,
      },
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
  }

  async confirmarPago(id: string, dto: ConfirmarPagoDto) {
    const factura = await this.obtenerPorId(id)
    if (!factura.pagoEjecutado) {
      throw new BadRequestException('El pago debe estar ejecutado antes de confirmar')
    }
    const data: Record<string, unknown> = { confirmacionFinanciera: dto.confirmacionFinanciera }
    if (dto.confirmacionFinanciera) {
      data.estado = EstadoFactura.PAGADA
      data.fechaPago = new Date()
    }
    return this.prisma.factura.update({
      where: { id },
      data,
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
  }

  async aprobar(id: string) {
    const factura = await this.obtenerPorId(id)
    if (factura.estado !== EstadoFactura.PENDIENTE) {
      throw new BadRequestException('Solo se pueden aprobar facturas en estado PENDIENTE')
    }
    return this.prisma.factura.update({
      where: { id },
      data: { estado: EstadoFactura.APROBADA },
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
  }

  async marcarPagada(id: string) {
    const factura = await this.obtenerPorId(id)
    if (factura.estado !== EstadoFactura.APROBADA) {
      throw new BadRequestException('Solo se pueden marcar como pagadas las facturas APROBADAS')
    }
    return this.prisma.factura.update({
      where: { id },
      data: { estado: EstadoFactura.PAGADA, fechaPago: new Date() },
      include: { proyecto: { select: { id: true, nombre: true } } },
    })
  }

  async rechazar(id: string) {
    const factura = await this.obtenerPorId(id)
    if (factura.estado === EstadoFactura.PAGADA || factura.estado === EstadoFactura.RECHAZADA) {
      throw new BadRequestException('No se puede rechazar una factura en estado PAGADA o RECHAZADA')
    }
    return this.prisma.factura.update({
      where: { id },
      data: { estado: EstadoFactura.RECHAZADA },
      include: {
        proyecto: { select: { id: true, nombre: true } },
        proveedor: { select: { id: true, nombre: true } },
      },
    })
  }

  async adjuntarArchivo(id: string, archivoFacturaPath: string) {
    const factura = await this.obtenerPorId(id)
    const updated = await this.prisma.factura.update({ where: { id }, data: { archivoFacturaPath } })
    await this.prisma.historialProyecto.create({
      data: {
        proyectoId: factura.proyectoId,
        accion: 'ARCHIVO_ADJUNTADO',
        detalle: `Archivo adjuntado a factura ${factura.numero}`,
      },
    })
    return updated
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id)
    await this.prisma.factura.delete({ where: { id } })
    return { mensaje: 'Factura eliminada correctamente' }
  }
}
