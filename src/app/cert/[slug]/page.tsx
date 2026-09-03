import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CertLookupClient } from "@/components/ecert/CertLookupClient";

export const dynamic = "force-dynamic";

export default async function CertCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = slug.trim().toLowerCase();

  // Find Standalone Campaign
  const campaign = await prisma.certCampaign.findUnique({
    where: { slug: cleanSlug },
  });

  if (!campaign || !campaign.isActive) {
    notFound();
  }

  return (
    <CertLookupClient
      campaignSlug={campaign.slug}
      campaignTitle={campaign.title}
      campaignDescription={campaign.description}
      issueDate={campaign.issueDate}
    />
  );
}
