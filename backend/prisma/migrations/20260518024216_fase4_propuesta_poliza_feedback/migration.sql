-- CreateEnum
CREATE TYPE "TipoFeedback" AS ENUM ('POSITIVO', 'NEGATIVO', 'MEJORA');

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "polizaContratada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propuestaAprobada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiereContrato" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requierePoliza" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FeedbackInterno" (
    "id" TEXT NOT NULL,
    "tipo" "TipoFeedback" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "accionesTomadas" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "FeedbackInterno_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedbackInterno" ADD CONSTRAINT "FeedbackInterno_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
