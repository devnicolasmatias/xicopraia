-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('PENDING', 'CLAIMED', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'PENDING',
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print_jobs_status_createdAt_idx" ON "print_jobs"("status", "createdAt");
