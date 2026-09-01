import { prisma } from "@/lib/prisma";
import { CertHubClient } from "@/components/ecert/CertHubClient";

export const dynamic = "force-dynamic";

export default async function CertificationHubPage() {
  const activeEvents = await prisma.event.findMany({
    where: { isActive: true, hasCertificate: true },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "desc" }
  });

  return <CertHubClient activeEvents={activeEvents} />;
}
