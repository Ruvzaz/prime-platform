-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "generateQr" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sendEmail" BOOLEAN NOT NULL DEFAULT true;
