import { prisma } from "@/lib/prisma";
import { CampaignsClient } from "./CampaignsClient";

export const dynamic = "force-dynamic";

export default async function AdminCertCampaignsPage() {
  const [campaigns, templates] = await Promise.all([
    prisma.certCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        certTemplate: {
          select: { id: true, name: true, backgroundImageUrl: true },
        },
        _count: {
          select: { certificates: true },
        },
      },
    }),
    prisma.certTemplate.findMany({
      select: { id: true, name: true, backgroundImageUrl: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <CampaignsClient initialCampaigns={campaigns} templates={templates} />;
}
