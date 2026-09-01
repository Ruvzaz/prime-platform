-- CreateTable
CREATE TABLE IF NOT EXISTS "EventCertToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "claimedName" TEXT,
    "claimedAt" TIMESTAMP(3),
    "certCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCertToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventCertToken_token_key" ON "EventCertToken"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventCertToken_token_idx" ON "EventCertToken"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventCertToken_eventId_idx" ON "EventCertToken"("eventId");

-- AddForeignKey
ALTER TABLE "EventCertToken" ADD CONSTRAINT "EventCertToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
