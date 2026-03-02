import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'  

import { PrismaModule } from './prisma/prisma.module'
import { CategoriasModule } from './modules/categorias/categorias.module'
import { CompromisosModule } from './modules/compromisos/compromisos.module'
import { EvaluadorProyectoService } from './common/services/evaluador-proyecto.service'
import { VerificadorCompromisosService } from './common/services/verificador-compromisos.service'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { ProyectosModule } from './modules/proyectos/proyectos.module'
import { CommonModule } from './common/common.module'
import { UsuariosModule } from './modules/usuarios/usuarios.module'
import { EntregablesModule } from './modules/entregables/entregables.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({  // para todo el proyecto   
      isGlobal: true,
    }),

    PrismaModule,
    CategoriasModule,
    CompromisosModule,
    DashboardModule,
    ProyectosModule,
    CommonModule,
    UsuariosModule,
    EntregablesModule,
    AuthModule,
  ],
  providers: [EvaluadorProyectoService, VerificadorCompromisosService],
  exports: [EvaluadorProyectoService, VerificadorCompromisosService],
})
export class AppModule {}