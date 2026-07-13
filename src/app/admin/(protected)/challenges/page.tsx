import { prisma } from "@/lib/prisma";
import { Shield, Eye, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CreateChallengeForm,
  ChallengeStatusToggle,
  EditChallengeForm,
  ChallengeDashboardFilter,
  ExportDataButton,
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

  const totalTeams = await prisma.team.count({
    where: filterChallengeId !== 'ALL' ? { challengeId: filterChallengeId } : undefined
  });
  
  const totalApplicants = await prisma.teamMember.count({
    where: filterChallengeId !== 'ALL' ? { challengeId: filterChallengeId } : undefined
  });
  
  const teamsByRegion = await prisma.team.groupBy({
    by: ['region'],
    where: filterChallengeId !== 'ALL' ? { challengeId: filterChallengeId } : undefined,
    _count: {
      id: true
    }
  });

  const regionsMap: Record<string, number> = {
    'กรุงเทพมหานครและปริมณฑล': 0,
    'ภาคเหนือ': 0,
    'ภาคกลาง ภาคตะวันออก และภาคตะวันตก': 0,
    'ภาคตะวันออกเฉียงเหนือ': 0,
    'ภาคใต้': 0,
  };

  teamsByRegion.forEach(item => {
    if (item.region && item.region in regionsMap) {
      regionsMap[item.region] = item._count.id;
    } else if (item.region) {
      regionsMap[item.region] = item._count.id;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            CTF Challenges & Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage challenge categories and monitor registration metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ChallengeDashboardFilter 
            challenges={challenges.map(c => ({ id: c.id, name: c.name }))} 
            currentFilter={filterChallengeId} 
          />
          <ExportDataButton currentFilter={filterChallengeId} />
          <CreateChallengeForm />
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-muted-foreground">ผู้สมัครทั้งหมด</h3>
          </div>
          <p className="text-3xl font-bold">{totalApplicants} <span className="text-sm font-normal text-muted-foreground">คน</span></p>
        </div>
        
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-muted-foreground">ทีมทั้งหมด</h3>
          </div>
          <p className="text-3xl font-bold">{totalTeams} <span className="text-sm font-normal text-muted-foreground">ทีม</span></p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-muted-foreground">สถิติทีมแบ่งตามภูมิภาค</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span>กรุงเทพฯ และปริมณฑล</span> 
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{regionsMap['กรุงเทพมหานครและปริมณฑล'] || 0} ทีม</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span>ภาคเหนือ</span> 
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{regionsMap['ภาคเหนือ'] || 0} ทีม</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span className="truncate mr-2" title="ภาคกลาง ภาคตะวันออก และภาคตะวันตก">ภาคกลาง ตะวันออก และตะวันตก</span> 
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{regionsMap['ภาคกลาง ภาคตะวันออก และภาคตะวันตก'] || 0} ทีม</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span>ภาคตะวันออกเฉียงเหนือ</span> 
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{regionsMap['ภาคตะวันออกเฉียงเหนือ'] || 0} ทีม</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span>ภาคใต้</span> 
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{regionsMap['ภาคใต้'] || 0} ทีม</span>
            </div>
          </div>
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
