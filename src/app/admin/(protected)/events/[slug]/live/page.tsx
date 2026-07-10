import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { LiveBoardSettingsForm } from "@/components/admin/live-config-form";

export default async function LiveSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      liveConfig: true,
    },
  });

  if (!event) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8">
      <LiveBoardSettingsForm 
        eventId={event.id}
        eventSlug={event.slug}
        initialData={event.liveConfig}
      />
    </div>
  );
}
