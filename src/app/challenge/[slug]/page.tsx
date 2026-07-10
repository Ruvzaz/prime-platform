import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { TeamManager } from "./components/TeamManager";

export default async function ChallengeDashboardPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  
  // Get Current Logged-in User
  const session = await auth();
  if (!session?.user?.id) {
    return null; // Handled by Middleware, but safe guard
  }

  const currentUser = session.user;

  // Find Challenge
  const challenge = await prisma.challenge.findUnique({
    where: { slug }
  });

  if (!challenge) {
    notFound();
  }

  // Find if user is in any team for this challenge
  const myMembership = await prisma.teamMember.findUnique({
    where: {
      challengeId_userId: {
        challengeId: challenge.id,
        userId: currentUser.id
      }
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { joinedAt: 'asc' }
          }
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] font-sans relative overflow-hidden">
      {/* Cool subtle header background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="h-96 w-full bg-gradient-to-b from-red-500/10 to-transparent absolute top-0 left-0 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <TeamManager 
          challenge={challenge} 
          myMembership={myMembership} 
          currentUser={currentUser} 
        />
      </div>
    </div>
  );
}
