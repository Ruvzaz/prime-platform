import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ECertCanvas } from "@/components/ecert/ECertCanvas";

export default async function VerifyCertPage({
  params,
}: {
  params: Promise<{ certCode: string }>;
}) {
  const { certCode } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { certCode },
    include: {
      user: {
        select: { name: true, email: true, title: true, firstName: true, lastName: true },
      },
      challenge: {
        select: { name: true },
      },
      event: {
        select: { title: true },
      },
    },
  });

  if (!cert || cert.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] font-sans flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#161c21] border border-red-500/40 text-red-400 p-8 rounded-2xl max-w-md shadow-2xl space-y-4">
          <XCircle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold font-mono uppercase tracking-widest text-[#dee3e9]">
            ไม่พบใบประกาศนียบัตร
          </h1>
          <p className="text-sm text-[#849495] font-mono leading-relaxed">
            ไม่พบรหัสใบประกาศ <b className="text-red-400">{certCode}</b> ในระบบ หรือใบประกาศนียบัตรฉบับนี้ถูกยกเลิกแล้ว
          </p>
          <Link href="/challenge">
            <Button variant="outline" className="mt-4 border-[#3b494b] font-mono text-xs uppercase">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    cert.recipientFullName ||
    [cert.recipientPrefix, cert.recipientFirstName, cert.recipientLastName]
      .filter(Boolean)
      .join(" ") ||
    cert.user?.name ||
    "ผู้เข้าร่วมการแข่งขัน";

  const eventTitle =
    cert.eventTitle ||
    cert.challenge?.name ||
    cert.event?.title ||
    "Thailand Cyber Top Talent 2026";

  return (
    <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] font-sans py-12 px-4 flex flex-col items-center">
      {/* Verification Header */}
      <div className="max-w-4xl w-full text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 border border-emerald-500/40 rounded-full text-emerald-400 font-mono text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(52,211,153,0.15)]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span>✓ ตรวจสอบสำเร็จ ใบประกาศนียบัตรถูกต้องตามแท้จริง</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#dee3e9] tracking-tight">
          ใบประกาศนียบัตรของ: <span className="text-blue-400">{displayName}</span>
        </h1>
        <p className="text-[#849495] font-mono text-xs sm:text-sm uppercase tracking-widest">
          รายการ: {eventTitle} • รหัสอ้างอิง: <span className="text-emerald-400">{cert.certCode}</span>
        </p>
      </div>

      {/* High-Res Canvas Display */}
      <ECertCanvas
        certData={{
          certCode: cert.certCode,
          recipientPrefix: cert.recipientPrefix || "",
          recipientFirstName: cert.recipientFirstName || "",
          recipientLastName: cert.recipientLastName || "",
          recipientFullName: displayName,
          eventTitle: eventTitle,
          issueDate: cert.issueDate,
        }}
        showDownloadBtn={true}
      />
    </div>
  );
}
