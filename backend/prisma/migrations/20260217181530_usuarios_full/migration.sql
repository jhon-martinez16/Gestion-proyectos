/*
  Warnings:

  - You are about to drop the column `responsable` on the `Entregable` table. All the data in the column will be lost.
  - Made the column `descripcion` on table `Entregable` required. This step will fail if there are existing NULL values in that column.
  - Made the column `descripcion` on table `Proyecto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `socio2Id` on table `Proyecto` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Proyecto" DROP CONSTRAINT "Proyecto_socio2Id_fkey";

-- AlterTable
ALTER TABLE "Compromiso" ADD COLUMN     "responsableId" TEXT;

-- AlterTable
ALTER TABLE "Entregable" DROP COLUMN "responsable",
ADD COLUMN     "responsableId" TEXT,
ALTER COLUMN "descripcion" SET NOT NULL;

-- AlterTable
ALTER TABLE "Proyecto" ALTER COLUMN "descripcion" SET NOT NULL,
ALTER COLUMN "socio2Id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_socio2Id_fkey" FOREIGN KEY ("socio2Id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromiso" ADD CONSTRAINT "Compromiso_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entregable" ADD CONSTRAINT "Entregable_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
