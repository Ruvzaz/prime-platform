import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldCheck, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ECertCanvas } from "@/components/ecert/ECertCanvas";
import { ChallengeNavbar } from "@/components/layout/ChallengeNavbar";

export default async function UserCertificationPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/login?callbackUrl=/certification");
  }

  const userEmail = session.user.email.toLowerCase().trim();

  // Find user details & certificates issued to their email
  const certificates = await prisma.certificate.findMany({
    where: {
      email: userEmail,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  // If user has no active certificates, block direct access and redirect to home
  if (certificates.length === 0) {
    redirect("/challenge");
  }

  return (
    <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] font-sans">
      <ChallengeNavbar />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b494b] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs uppercase tracking-widest mb-2">
              <Award className="w-4 h-4 text-red-400" />
              <span>Official E-Certificates</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#dee3e9]">
              My Certificates (ใบประกาศนียบัตรของฉัน)
            </h1>
            <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-1">
              Registered Account: <span className="text-red-400 font-bold">{userEmail}</span>
            </p>
          </div>

          <Link href="/challenge">
            <button className="font-mono text-xs uppercase tracking-widest px-5 py-2.5 border border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:bg-[#252f36] hover:border-red-500/50 active:scale-95 transition-all duration-150 rounded flex items-center gap-2 shadow-sm">
              <ArrowLeft className="w-4 h-4 text-red-500" />
              <span>Back to Dashboard</span>
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
                    eventTitle: cert.eventTitle,
                    issueDate: cert.issueDate,
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
