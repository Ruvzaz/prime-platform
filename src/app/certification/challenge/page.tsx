import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldCheck, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ECertCanvas } from "@/components/ecert/ECertCanvas";
import { ChallengeNavbar } from "@/components/layout/ChallengeNavbar";

export default async function ChallengeUserCertificationPage() {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    redirect("/auth/login?callbackUrl=/certification/challenge");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, username: true },
  });

  const userEmail = (dbUser?.email || session.user.email)?.toLowerCase().trim();
  const userName = (dbUser?.name || session.user.name)?.trim();
  const username = dbUser?.username?.trim();
  const cleanUsername = userEmail && userEmail.includes("@") ? userEmail.split("@")[0] : userEmail;

  // Fetch user's approved team memberships to display team name and match challenge certificates
  const userTeams = await prisma.teamMember.findMany({
    where: {
      userId: session.user.id,
      status: "APPROVED",
    },
    include: { team: true },
  });

  const userChallengeIds = userTeams.map((tm) => tm.challengeId).filter(Boolean);
  const teamMap = new Map(userTeams.map((tm) => [tm.challengeId, tm.team.name]));

  // Find user details & certificates issued to their email, userId, recipient name, or challengeId
  const certificates = await prisma.certificate.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
        ...(cleanUsername ? [{ email: { contains: cleanUsername, mode: "insensitive" as const } }] : []),
        ...(username ? [{ email: { contains: username, mode: "insensitive" as const } }] : []),
        ...(userName ? [{ recipientFullName: { equals: userName, mode: "insensitive" as const } }] : []),
      ],
      status: "ACTIVE",
    },
    include: {
      challenge: {
        include: { certTemplate: true },
      },
      event: {
        include: { certTemplate: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // If user has no active certificates, render a clear empty state screen
  if (certificates.length === 0) {
    return (
      <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] font-sans flex flex-col">
        <ChallengeNavbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="bg-[#161c21] border border-[#3b494b] p-8 sm:p-10 rounded-3xl max-w-md shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-[#dee3e9]">
                ยังไม่พบใบประกาศนียบัตรของคุณ
              </h1>
              <p className="text-xs text-[#849495] leading-relaxed font-mono">
                บัญชี <strong className="text-red-400">{userEmail}</strong> ยังไม่มีใบประกาศนียบัตร CTF Challenge ในระบบ
              </p>
            </div>
            <Link href="/challenge" className="block pt-2">
              <button className="w-full font-mono text-xs uppercase tracking-widest px-5 py-3 border border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:bg-[#252f36] hover:border-red-500/50 active:scale-95 transition-all duration-150 rounded flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4 text-red-500" />
                <span>ย้อนกลับสู่หน้าหลัก Challenge</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch Default Template (as fallback)
  const defaultTemplate = await prisma.certTemplate.findFirst({
    where: { isDefault: true },
  });

  return (
    <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] font-sans">
      <ChallengeNavbar />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b494b] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.svg" alt="Prime Digital Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs uppercase tracking-widest">
                <Award className="w-4 h-4 text-red-400" />
                <span>Official E-Certificates (Challenge)</span>
              </div>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#dee3e9]">
              My Challenge Certificates (ใบประกาศนียบัตรของฉัน)
            </h1>
            <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-1">
              Registered Account: <span className="text-red-400 font-bold">{userEmail}</span>
            </p>
          </div>

          <Link href="/challenge">
            <button className="font-mono text-xs uppercase tracking-widest px-5 py-2.5 border border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:bg-[#252f36] hover:border-red-500/50 active:scale-95 transition-all duration-150 rounded flex items-center gap-2 shadow-sm">
              <ArrowLeft className="w-4 h-4 text-red-500" />
              <span>Back to Challenge</span>
            </button>
          </Link>
        </div>

        {/* Certificates List */}
        <div className="space-y-12">
          {certificates.map((cert) => {
            const displayName =
              cert.recipientFullName ||
              [cert.recipientPrefix, cert.recipientFirstName, cert.recipientLastName]
                .filter(Boolean)
                .join(" ") ||
              session.user?.name ||
              userEmail;

            const teamName = cert.challengeId ? teamMap.get(cert.challengeId) : undefined;
            const activeTemplate = cert.challenge?.certTemplate || cert.event?.certTemplate || defaultTemplate;

            return (
              <div
                key={cert.id}
                className="bg-[#161c21]/90 border border-[#3b494b] rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b494b]/60 pb-4">
                  <div>
                    <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest block mb-1">
                      [ CERTIFICATE ID: {cert.certCode} ]
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#dee3e9]">
                      {cert.eventTitle}
                    </h2>
                  </div>

                  <Link href={`/verify-cert/${cert.certCode}`} target="_blank">
                    <button className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:border-red-500/50 hover:bg-red-500/10 active:scale-95 transition-all duration-150 rounded flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-red-500" />
                      <span>Verify Authenticity</span>
                    </button>
                  </Link>
                </div>

                {/* High-Res Canvas Preview */}
                <ECertCanvas
                  certData={{
                    certCode: cert.certCode,
                    recipientPrefix: cert.recipientPrefix || "",
                    recipientFirstName: cert.recipientFirstName || "",
                    recipientLastName: cert.recipientLastName || "",
                    recipientFullName: displayName,
                    teamName: teamName,
                    eventTitle: cert.eventTitle,
                    issueDate: cert.issueDate,
                    backgroundImageUrl: activeTemplate?.backgroundImageUrl,
                    layoutConfig: activeTemplate?.layoutConfig as any,
                  }}
                  showDownloadBtn={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
