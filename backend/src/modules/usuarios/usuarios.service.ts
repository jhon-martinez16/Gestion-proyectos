import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearUsuarioDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    })

    if (existente) {
      throw new BadRequestException('Email ya registrado')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(),
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        rol: dto.rol,
      },
    })
  }

  async listarActivos() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    })
  }

  async obtenerPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    })

    if (!usuario) {
      throw new NotFoundException('Usuario no existe')
    }

    return usuario
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto) {
    await this.obtenerPorId(id)

    return this.prisma.usuario.update({
      where: { id },
      data: dto,
    })
  }

  async desactivar(id: string) {
    await this.obtenerPorId(id)

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    })
  }
}