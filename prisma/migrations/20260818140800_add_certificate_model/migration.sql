-- CreateEnum
CREATE TYPE "CertType" AS ENUM ('CHALLENGE', 'EVENT');

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certCode" TEXT NOT NULL,
    "type" "CertType" NOT NULL DEFAULT 'CHALLENGE',
    "email" TEXT NOT NULL,
    "recipientPrefix" TEXT DEFAULT '',
    "recipientFirstName" TEXT NOT NULL,
    "recipientLastName" TEXT DEFAULT '',
    "recipientFullName" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "challengeId" TEXT,
    "eventId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certCode_key" ON "Certificate"("certCode");

-- CreateIndex
CREATE INDEX "Certificate_email_idx" ON "Certificate"("email");

-- CreateIndex
CREATE INDEX "Certificate_certCode_idx" ON "Certificate"("certCode");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
