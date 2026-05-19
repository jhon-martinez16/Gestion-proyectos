/*
  Warnings:

  - You are about to drop the `RiesgoOportunidad` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RiesgoOportunidad" DROP CONSTRAINT "RiesgoOportunidad_proyectoId_fkey";

-- DropTable
DROP TABLE "RiesgoOportunidad";

-- DropEnum
DROP TYPE "EstadoRiesgo";

-- DropEnum
DROP TYPE "Impacto";

-- DropEnum
DROP TYPE "Probabilidad";

-- DropEnum
DROP TYPE "TipoRiesgo";
