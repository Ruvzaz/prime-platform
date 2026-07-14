import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BroadcastClient } from "./components/BroadcastClient";

export default async function BroadcastPage({
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
            where: { status: 'APPROVED' },
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!challenge) notFound();

  // Process data for the client: we only need team id, name, member count, and isCompleteEmailSent
  const teamsData = challenge.teams.map(team => ({
    id: team.id,
    name: team.name,
    memberCount: team.members.length,
    isCompleteEmailSent: team.isCompleteEmailSent,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/challenges/${id}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{challenge.name} - Broadcast</h1>
          <p className="text-muted-foreground mt-1">Select full teams to broadcast the Team Complete email sequentially.</p>
        </div>
      </div>

      <BroadcastClient challengeId={challenge.id} maxTeamSize={challenge.maxTeamSize} initialTeams={teamsData} />
    </div>
  );
}
