-- AlterTable
ALTER TABLE "LiveConfig" ADD COLUMN "linkedEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
