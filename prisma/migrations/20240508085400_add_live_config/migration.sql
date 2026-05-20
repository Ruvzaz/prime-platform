-- CreateTable
CREATE TABLE "LiveConfig" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "welcomeMessage" TEXT,
    "themeColor" TEXT DEFAULT '#000000',
    "showStats" BOOLEAN NOT NULL DEFAULT true,
    "showLog" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveConfig_eventId_key" ON "LiveConfig"("eventId");

-- AddForeignKey
ALTER TABLE "LiveConfig" ADD CONSTRAINT "LiveConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
