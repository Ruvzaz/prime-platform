import { ChallengeNavbar } from "@/components/layout/ChallengeNavbar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileCompletionModal } from "@/components/profile-completion-modal";
import { PrivacyPolicyModal } from "@/components/privacy-policy-modal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let needsProfileCompletion = false;

  let needsPrivacyAcceptance = false;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    // If they registered via Google, they might not have a username or other required fields
    if (user && (!user.username || !user.firstName || !user.phoneNumber)) {
      needsProfileCompletion = true;
    }
    
    // Check privacy policy acceptance
    if (user && !user.privacyAcceptedAt) {
      needsPrivacyAcceptance = true;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ChallengeNavbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <PrivacyPolicyModal isOpen={needsPrivacyAcceptance} />
      <ProfileCompletionModal isOpen={needsProfileCompletion && !needsPrivacyAcceptance} />
    </div>
  );
}
