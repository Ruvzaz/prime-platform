import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Shield, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteTeamButton, RemoveMemberButton } from "../components/AdminTeamActions";

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
              user: { select: { name: true, email: true } }
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

      <div className="grid gap-6 mt-8">
        {challenge.teams.map(team => {
          const approvedMembers = team.members.filter(m => m.status === 'APPROVED');
          const pendingMembers = team.members.filter(m => m.status === 'PENDING');
          
          return (
            <div key={team.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-secondary/30 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">{team.name}</h3>
                  <span className="bg-background px-2 py-1 text-xs rounded-md border font-medium">
                    {approvedMembers.length} / {challenge.maxTeamSize} Members
                  </span>
                </div>
                <DeleteTeamButton teamId={team.id} />
              </div>
              
              <div className="p-4 space-y-4">
                {/* Approved Members */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Active Members
                  </h4>
                  {approvedMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No active members.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {approvedMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{m.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                            {m.userId === team.leaderId && (
                              <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Leader</span>
                            )}
                          </div>
                          {m.userId !== team.leaderId && (
                            <RemoveMemberButton memberId={m.id} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Members */}
                {pendingMembers.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Pending Requests
                    </h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {pendingMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-background border border-amber-500/20 rounded-lg">
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{m.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                          </div>
                          <RemoveMemberButton memberId={m.id} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {challenge.teams.length === 0 && (
          <div className="text-center py-16 border border-dashed rounded-xl bg-muted/20">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground">No Teams Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Teams registered for this challenge will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
