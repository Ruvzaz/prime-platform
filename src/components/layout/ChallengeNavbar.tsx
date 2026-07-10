import Link from "next/link";
import { auth } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, Shield, ShieldCheck, Users, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { participantLogout } from "@/app/actions/challenge-auth";
import { prisma } from "@/lib/prisma";

export async function ChallengeNavbar() {
  const session = await auth();

  let myTeamLink = "/challenge";
  if (session?.user?.id) {
    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { challenge: true },
    });
    if (membership?.challenge) {
      myTeamLink = `/challenge/${membership.challenge.slug}`;
    }
  }

  return (
    <nav className="border-b border-[#3b494b] bg-[#0e1418] sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/challenge" className="flex items-center gap-2 font-black text-2xl tracking-tighter text-[#dee3e9] hover:opacity-80 transition-opacity">
          <Shield className="w-8 h-8 text-red-500" />
          <span className="italic">CYBER<span className="text-red-500">HUB</span></span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-[#161c21] border border-[#3b494b] cursor-pointer hover:border-red-500/50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-red-500/10 text-red-500 font-bold text-sm shrink-0 font-mono">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-right pr-2">
                    <p className="font-bold text-sm leading-none text-[#dee3e9] uppercase tracking-wide">{session.user.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      {session.user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-amber-500" />}
                      <p className="text-[10px] text-[#849495] uppercase font-mono tracking-widest">
                        {session.user.role === 'ADMIN' ? 'Admin' : 'Operative'}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#161c21] border-[#3b494b] text-[#dee3e9]">
                <DropdownMenuLabel className="font-mono text-xs text-[#849495] uppercase tracking-widest">Neural Link</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#3b494b]" />
                <DropdownMenuItem asChild className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer font-mono text-sm uppercase tracking-wider">
                  <Link href={myTeamLink}>
                    <Users className="w-4 h-4 mr-2" />
                    <span>My Squad</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer font-mono text-sm uppercase tracking-wider">
                  <Link href="/challenge/profile">
                    <UserCog className="w-4 h-4 mr-2" />
                    <span>Diagnostics</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <form action={participantLogout}>
              <button type="submit" className="flex items-center justify-center w-10 h-10 border border-[#3b494b] bg-[#161c21] rounded text-[#849495] hover:text-red-500 hover:border-red-500/50 transition-colors" title="Disconnect">
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Disconnect</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <button className="font-mono text-xs uppercase tracking-widest px-6 py-2.5 border border-red-500 text-red-500 font-bold hover:bg-red-500/10 active:scale-95 transition-all duration-150 rounded">
                Login
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="font-mono text-xs uppercase tracking-widest px-6 py-2.5 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 shadow-[0_0_15px_rgba(255,0,0,0.3)] rounded">
                Register
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
