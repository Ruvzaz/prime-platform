import { prisma } from "@/lib/prisma";
import { Shield, Eye, Users, MapPin, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CreateChallengeForm,
  ChallengeStatusToggle,
  EditChallengeForm,
  ChallengeDashboardFilter,
  ExportDataButton,
  ExportChallengeSysButton,
} from "./components/ClientActions";

export default async function AdminChallengesPage(props: any) {
  const searchParams = await Promise.resolve(props.searchParams);
  const filterChallengeId = typeof searchParams?.challengeId === 'string' ? searchParams.challengeId : 'ALL';
  const challenges = await prisma.challenge.findMany({
    include: {
      _count: {
        select: { teams: true, teamMembers: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            CTF Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage challenge categories, rules, and rulesets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportDataButton currentFilter={filterChallengeId} />
          <ExportChallengeSysButton currentFilter={filterChallengeId} />
          <Button variant="outline" asChild>
            <Link href="/admin/challenges/dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Dashboard
            </Link>
          </Button>
          <CreateChallengeForm />
        </div>
      </div>

      <div className="grid gap-4 mt-8">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-card border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{challenge.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {challenge.slug} • Max {challenge.maxTeamSize} per team
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-6 border-r border-border pr-6">
                <div className="text-right">
                  <div className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                    {challenge._count.teamMembers}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Members</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg text-red-600 dark:text-red-400">
                    {challenge._count.teams}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Teams</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-md font-medium ${challenge.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}
                >
                  {challenge.isActive ? "Active" : "Closed"}
                </span>

                <ChallengeStatusToggle
                  id={challenge.id}
                  isActive={challenge.isActive}
                />

                <EditChallengeForm challenge={challenge} />

                <Link href={`/admin/challenges/${challenge.id}`}>
                  <Button variant="secondary" size="sm" className="ml-2">
                    <Eye className="w-4 h-4 mr-2" />
                    Manage Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {challenges.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No Challenges Created
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Create Challenge" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
