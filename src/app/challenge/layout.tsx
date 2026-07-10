import { ChallengeNavbar } from "@/components/layout/ChallengeNavbar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileCompletionModal } from "@/components/profile-completion-modal";

export default async function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let needsProfileCompletion = false;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    // If they registered via Google, they might not have a username or other required fields
    if (user && (!user.username || !user.firstName || !user.phoneNumber)) {
      needsProfileCompletion = true;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ChallengeNavbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <ProfileCompletionModal isOpen={needsProfileCompletion} />
    </div>
  );
}
