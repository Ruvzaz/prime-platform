-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN "certTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_certTemplateId_fkey" FOREIGN KEY ("certTemplateId") REFERENCES "CertTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
