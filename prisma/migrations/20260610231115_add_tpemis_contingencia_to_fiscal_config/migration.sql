-- AlterTable
ALTER TABLE "fiscal_config" ADD COLUMN     "dhContingencia" TIMESTAMP(3),
ADD COLUMN     "tpEmis" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "xJustContingencia" TEXT;
