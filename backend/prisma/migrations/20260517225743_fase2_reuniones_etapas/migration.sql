-- CreateEnum
CREATE TYPE "EtapaProyecto" AS ENUM ('PROPUESTA', 'KICK_OFF', 'EN_EJECUCION', 'CIERRE');

-- AlterTable
ALTER TABLE "Compromiso" ADD COLUMN     "reunionId" TEXT;

-- AlterTable
ALTER TABLE "Entregable" ADD COLUMN     "clienteAprobado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaAprobacionCliente" TIMESTAMP(3),
ADD COLUMN     "observacionesCliente" TEXT,
ADD COLUMN     "revisionInternaAprobada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "contratoFirmado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "etapa" "EtapaProyecto" NOT NULL DEFAULT 'PROPUESTA',
ADD COLUMN     "kickoffFecha" TIMESTAMP(3),
ADD COLUMN     "kickoffRealizado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ReunionSeguimiento" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "objetivos" TEXT NOT NULL,
    "proximospasos" TEXT,
    "calidadAprobada" BOOLEAN NOT NULL DEFAULT false,
    "proximaReunion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "ReunionSeguimiento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReunionSeguimiento" ADD CONSTRAINT "ReunionSeguimiento_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromiso" ADD CONSTRAINT "Compromiso_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "ReunionSeguimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
