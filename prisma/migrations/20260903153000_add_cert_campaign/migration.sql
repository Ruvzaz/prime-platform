-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN "campaignId" TEXT;

-- CreateTable
CREATE TABLE "CertCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "issueDate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "certTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertCampaign_slug_key" ON "CertCampaign"("slug");

-- CreateIndex
CREATE INDEX "CertCampaign_slug_idx" ON "CertCampaign"("slug");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CertCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertCampaign" ADD CONSTRAINT "CertCampaign_certTemplateId_fkey" FOREIGN KEY ("certTemplateId") REFERENCES "CertTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
