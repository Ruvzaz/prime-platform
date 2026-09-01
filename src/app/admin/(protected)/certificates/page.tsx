import { prisma } from "@/lib/prisma";
import { CertificatesClient } from "./components/CertificatesClient";

export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage() {
  const certificates = await prisma.certificate.findMany({
    include: {
      challenge: {
        select: { id: true, name: true, slug: true },
      },
      event: {
        select: { id: true, title: true, slug: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const challenges = await prisma.challenge.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  const events = await prisma.event.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, username: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <CertificatesClient
      certificates={certificates}
      challenges={challenges}
      events={events}
      users={users}
    />
  );
}
