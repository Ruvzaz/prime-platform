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
      <div className="min-h-screen flex items-center justify-center bg-[#0e1418] text-[#dee3e9] p-4 text-center font-sans">
        <div className="max-w-md w-full p-8 border border-red-500/30 bg-[#161c21] rounded-xl shadow-[0_0_30px_rgba(255,0,0,0.1)] relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50"></div>
          
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
          <h1 className="text-2xl font-black mb-2 uppercase tracking-widest text-white">Invalid Link</h1>
          <p className="text-[#849495] font-mono text-sm mb-8 uppercase tracking-wide">
            This operational link is invalid, expired, or the squad has been purged.
          </p>
          <Link href="/challenge">
            <button className="w-full font-mono text-sm uppercase tracking-widest px-4 py-3 bg-red-500/10 border border-red-500/50 text-red-500 font-bold hover:bg-red-500 hover:text-white active:scale-95 transition-all duration-150 rounded">
              Return to Base
            </button>
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
      <div className="min-h-screen flex items-center justify-center bg-[#0e1418] text-[#dee3e9] p-4 text-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
        <div className="max-w-md w-full p-8 border border-[#3b494b] bg-[#161c21] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-widest text-white">Already Enlisted</h1>
          <p className="text-[#849495] mb-8 font-mono text-sm uppercase tracking-wide leading-relaxed">
            You are already registered for the <span className="text-red-500 font-bold">{team.challenge.name}</span> protocol.
          </p>
          <Link href={`/challenge/${team.challenge.slug}`}>
            <button className="w-full font-mono text-sm uppercase tracking-widest px-4 py-3 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              Access Dashboard
            </button>
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
    <div className="min-h-screen flex items-center justify-center bg-[#0e1418] text-[#dee3e9] p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full p-8 border border-[#3b494b] bg-[#161c21]/90 backdrop-blur-xl rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 text-center">
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500/50 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500/50 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500/50 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500/50 rounded-br-xl"></div>

        <div className="w-16 h-16 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/30 mx-auto mb-6 shadow-[0_0_20px_rgba(255,0,0,0.15)] relative">
          <div className="absolute inset-0 border border-red-500/50 animate-ping opacity-20 rounded-lg"></div>
          <UserPlus className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-black mb-3 tracking-tighter uppercase text-white">Join Squad</h1>
        <div className="px-4 py-1.5 bg-[#090f13] border border-[#3b494b] rounded text-lg font-bold text-red-500 inline-block mb-6 uppercase tracking-widest shadow-inner">
          {team.name}
        </div>
        
        <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mb-8 leading-relaxed">
          Invited by <span className="text-white font-bold">{team.leader.name}</span><br/>
          Operation: <span className="text-white font-bold">{team.challenge.name}</span>
        </p>

        <div className="bg-[#090f13] rounded-lg p-4 mb-8 flex justify-between items-center text-sm border border-[#3b494b]">
          <span className="text-[#849495] font-mono uppercase tracking-widest text-xs">Current Roster</span>
          <span className="font-bold text-white bg-[#161c21] px-3 py-1.5 rounded border border-[#3b494b] font-mono shadow-inner text-xs">
            {team.members.length} / {team.challenge.maxTeamSize} <span className="text-red-500">OPs</span>
          </span>
        </div>

        {error && (
          <div className="p-3 mb-6 text-xs text-red-500 bg-red-500/10 rounded-lg flex items-center gap-3 border border-red-500/20 text-left font-mono uppercase tracking-wide">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {isFull ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg mb-2 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-3 justify-center">
            <AlertCircle className="w-5 h-5" />
            Squad at Maximum Capacity
          </div>
        ) : (
          <form action={handleJoin}>
            <button type="submit" className="w-full font-mono text-sm uppercase tracking-widest px-4 py-4 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              Accept Invitation <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
