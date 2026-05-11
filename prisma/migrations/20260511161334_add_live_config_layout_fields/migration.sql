-- AlterTable
ALTER TABLE "LiveConfig" ADD COLUMN     "layoutMode" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "maskNames" BOOLEAN NOT NULL DEFAULT false;
