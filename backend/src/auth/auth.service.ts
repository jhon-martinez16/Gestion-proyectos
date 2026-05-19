import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo')
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    }

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    }
  }
}