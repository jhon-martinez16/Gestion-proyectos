-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'SOCIO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "password" TEXT,
ADD COLUMN     "rol" "Rol" NOT NULL DEFAULT 'SOCIO';
