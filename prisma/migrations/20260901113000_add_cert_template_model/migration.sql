-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "hasCertificate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "certTemplateId" TEXT;

-- CreateTable
CREATE TABLE "CertTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundImageUrl" TEXT NOT NULL,
    "layoutConfig" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_certTemplateId_fkey" FOREIGN KEY ("certTemplateId") REFERENCES "CertTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
