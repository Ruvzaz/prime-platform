import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCircle,
  User,
  LogOut,
  Shield,
  ShieldCheck,
  Users,
  UserCog,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { participantLogout } from "@/app/actions/challenge-auth";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function ChallengeNavbar() {
  noStore();
  const session = await auth();

  let myTeamLink = "/challenge";
  let displayName = session?.user?.name || "OPERATIVE";

  let hasCertificates = false;

  if (session?.user) {
    const rawUserId = session.user.id;
    const rawEmail = session.user.email?.toLowerCase().trim();
    const rawName = session.user.name?.trim();

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(rawUserId ? [{ id: rawUserId }] : []),
          ...(rawEmail ? [{ email: { equals: rawEmail, mode: "insensitive" as const } }] : []),
          ...(rawName ? [{ name: { equals: rawName, mode: "insensitive" as const } }] : []),
        ],
      },
      select: { id: true, name: true, email: true, username: true }
    });

    const resolvedUserId = dbUser?.id || rawUserId;
    const userEmail = (dbUser?.email || rawEmail)?.toLowerCase().trim();
    const userName = (dbUser?.name || rawName)?.trim();
    const username = dbUser?.username?.trim();
    const cleanUsername = userEmail && userEmail.includes("@") ? userEmail.split("@")[0] : userEmail;

    if (userName) {
      displayName = userName;
    }

    if (resolvedUserId) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: resolvedUserId },
        include: { challenge: true },
      });
      if (membership?.challenge) {
        myTeamLink = `/challenge/${membership.challenge.slug}`;
      }
    }

    const certCount = await prisma.certificate.count({
      where: {
        OR: [
          ...(resolvedUserId ? [{ userId: resolvedUserId }] : []),
          ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
          ...(cleanUsername ? [{ email: { contains: cleanUsername, mode: "insensitive" as const } }] : []),
          ...(username ? [{ email: { contains: username, mode: "insensitive" as const } }] : []),
          ...(userName ? [{ recipientFullName: { equals: userName, mode: "insensitive" as const } }] : []),
        ],
        status: "ACTIVE",
      },
    });
    hasCertificates = certCount > 0;
  }

  return (
    <nav className="border-b border-[#3b494b] bg-[#0e1418] sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link
          href="/challenge"
          className="flex items-center gap-2 font-black text-2xl tracking-tighter text-[#dee3e9] hover:opacity-80 transition-opacity"
        >
          <Image src="/ICON IMAGE.png" alt="NCSA Logo" width={48} height={48} className="object-contain" />
          <span className="">
            N
            <span className="text-blue-500">
              C
              <span className="text-red-500">
                S<span className="text-white">A</span>
              </span>
            </span>
          </span>
          CTF
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-[#161c21] border border-[#3b494b] cursor-pointer hover:border-red-500/50 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded bg-red-500/10 shrink-0 text-red-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="hidden sm:block text-right pr-2">
                    <p className="font-bold text-sm leading-none text-[#dee3e9] uppercase tracking-wide">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      {session.user.role === "ADMIN" && (
                        <ShieldCheck className="w-3 h-3 text-amber-500" />
                      )}
                      <p className="text-[10px] text-[#849495] uppercase font-mono tracking-widest">
                        {session.user.role === "ADMIN" ? "Admin" : "Operative"}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#161c21] border-[#3b494b] text-[#dee3e9]"
              >
                <DropdownMenuLabel className="font-mono text-xs text-[#849495] uppercase tracking-widest">
                  Neural Link
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#3b494b]" />
                <DropdownMenuItem
                  asChild
                  className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer font-mono text-sm uppercase tracking-wider"
                >
                  <Link href={myTeamLink}>
                    <Users className="w-4 h-4 mr-2" />
                    <span>My Team</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer font-mono text-sm uppercase tracking-wider"
                >
                  <Link href="/challenge/profile">
                    <UserCog className="w-4 h-4 mr-2" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                {hasCertificates && (
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer font-mono text-sm uppercase tracking-wider"
                  >
                    <Link href="/certification/challenge">
                      <Award className="w-4 h-4 mr-2" />
                      <span>My Certificates</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <form action={participantLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-10 h-10 border border-[#3b494b] bg-[#161c21] rounded text-[#849495] hover:text-red-500 hover:border-red-500/50 transition-colors"
                title="Disconnect"
              >
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
