import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Shield, UserPlus, AlertCircle, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinTeamWithToken } from "@/app/actions/team";
import Link from "next/link";

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  
  const team = await prisma.team.findUnique({
    where: { inviteToken: token },
    include: { 
      challenge: true,
      leader: { select: { name: true } },
      members: { where: { status: 'APPROVED' } }
    }
  });

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="max-w-md w-full p-8 border bg-card rounded-2xl shadow-sm">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">This invite link is invalid, expired, or the team has been deleted.</p>
          <Link href="/challenge">
            <Button className="w-full h-11 text-base">Browse Challenges</Button>
          </Link>
        </div>
      </div>
    );
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
     redirect(`/auth/login?callbackUrl=/invite/${token}`);
  }

  // Check if they are already in the team (or another team in this challenge)
  const existingMembership = await prisma.teamMember.findUnique({
    where: {
      challengeId_userId: {
        challengeId: team.challengeId,
        userId: userId
      }
    }
  });

  if (existingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <div className="max-w-md w-full p-8 border border-border/50 bg-background/50 backdrop-blur-xl rounded-2xl shadow-2xl relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Already Enlisted</h1>
          <p className="text-muted-foreground mb-6">
            You are already registered for the <span className="font-semibold text-foreground">{team.challenge.name}</span> challenge.
          </p>
          <Link href={`/challenge/${team.challenge.slug}`}>
            <Button className="w-full h-11 text-base">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = team.members.length >= team.challenge.maxTeamSize;

  // Server Action inline wrapper
  const handleJoin = async () => {
    'use server';
    const res = await joinTeamWithToken(token);
    if (res.success) {
      redirect(`/challenge/${team.challenge.slug}`);
    } else {
      redirect(`/invite/${token}?error=${encodeURIComponent(res.error || 'Failed to join')}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Cyber Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full p-8 border border-border/50 bg-background/50 backdrop-blur-xl rounded-2xl shadow-2xl relative z-10 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Join {team.name}</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          You have been invited by <span className="font-semibold text-foreground">{team.leader.name}</span> to join their team for <span className="font-semibold text-foreground">{team.challenge.name}</span>.
        </p>

        <div className="bg-secondary/50 rounded-xl p-4 mb-6 flex justify-between items-center text-sm border border-border/50">
          <span className="text-muted-foreground font-medium">Current Roster</span>
          <span className="font-semibold text-foreground bg-background px-3 py-1 rounded-md border border-border">
            {team.members.length} / {team.challenge.maxTeamSize} Members
          </span>
        </div>

        {error && (
          <div className="p-3 mb-6 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2 border border-destructive/20 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {isFull ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl mb-4 text-sm font-medium flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4" />
            This team has reached the maximum number of members.
          </div>
        ) : (
          <form action={handleJoin}>
            <Button size="lg" className="w-full text-base font-semibold shadow-md h-12" type="submit">
              Send Join Request <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
