import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldCheck, Award, FileText, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Official E-Certificates</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#dee3e9]">
              My Certificates (ใบประกาศนียบัตรของฉัน)
            </h1>
            <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-1">
              Registered Account: <span className="text-blue-400">{userEmail}</span>
            </p>
          </div>

          <Link href="/challenge">
            <Button variant="outline" className="border-[#3b494b] font-mono text-xs uppercase">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#3b494b] rounded-xl bg-[#161c21]/50 space-y-4 max-w-2xl mx-auto">
            <Award className="w-16 h-16 text-[#3b494b] mx-auto opacity-60" />
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-[#dee3e9]">
              ยังไม่พบใบประกาศนียบัตร
            </h3>
            <p className="text-sm text-[#849495] font-mono leading-relaxed max-w-md mx-auto">
              ยังไม่มีใบประกาศนียบัตรที่ออกให้แก่อีเมล <span className="text-blue-400">{userEmail}</span> ในขณะนี้ หากคุณได้รับการยืนยันสิทธิ์แล้ว กรุณารอเจ้าหน้าที่ดำเนินการออกเอกสาร
            </p>
          </div>
        ) : (
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
                  className="bg-[#161c21]/90 border border-[#3b494b] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
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
                      <Button variant="outline" size="sm" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 font-mono text-xs uppercase">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Verify Authenticity
                      </Button>
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
        )}
      </div>
    </div>
  );
}
