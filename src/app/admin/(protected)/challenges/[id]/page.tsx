import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChallengeTeamsClient } from "./components/ChallengeTeamsClient";

export default async function AdminChallengeDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          members: {
            include: {
              user: true
            },
            orderBy: { joinedAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!challenge) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/challenges">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{challenge.name} - Teams</h1>
          <p className="text-muted-foreground mt-1">Manage teams and members for this challenge.</p>
        </div>
      </div>

      <ChallengeTeamsClient challenge={challenge} />
    </div>
  );
}
