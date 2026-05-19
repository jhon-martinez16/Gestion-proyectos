import { Module } from '@nestjs/common'
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaService } from '../prisma/prisma.service'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET')

        if (!secret) {
          throw new Error('JWT_SECRET no está definido en el .env')
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN') as any,
          },
        }
      },
    }),
  ],
  providers: [AuthService, PrismaService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}