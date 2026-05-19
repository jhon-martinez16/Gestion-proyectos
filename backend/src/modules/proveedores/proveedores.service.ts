import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearProveedorDto } from './dto/crear-proveedor.dto'
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto'

@Injectable()
export class ProveedoresService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearProveedorDto) {
    return this.prisma.proveedor.create({ data: dto })
  }

  async listar() {
    return this.prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { facturas: true } } },
    })
  }

  async obtenerPorId(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } })
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado')
    return proveedor
  }

  async actualizar(id: string, dto: ActualizarProveedorDto) {
    await this.obtenerPorId(id)

    const data: Record<string, unknown> = {}
    if (dto.nombre !== undefined) data.nombre = dto.nombre
    if (dto.nit !== undefined) data.nit = dto.nit
    if (dto.email !== undefined) data.email = dto.email
    if (dto.telefono !== undefined) data.telefono = dto.telefono
    if (dto.categoriaProveedor !== undefined) data.categoriaProveedor = dto.categoriaProveedor

    return this.prisma.proveedor.update({ where: { id }, data })
  }

  async desactivar(id: string) {
    await this.obtenerPorId(id)
    return this.prisma.proveedor.update({ where: { id }, data: { activo: false } })
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id)
    await this.prisma.proveedor.delete({ where: { id } })
    return { mensaje: 'Proveedor eliminado correctamente' }
  }
}
