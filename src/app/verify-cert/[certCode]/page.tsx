import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle, ShieldCheck, ArrowLeft, FileCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ECertCanvas } from "@/components/ecert/ECertCanvas";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function VerifyCertPage({
  params,
}: {
  params: Promise<{ certCode: string }>;
}) {
  const { certCode } = await params;
  const cleanCode = certCode.trim().toUpperCase();

  const cert = await prisma.certificate.findUnique({
    where: { certCode: cleanCode },
    include: {
      user: {
        select: { name: true, email: true, title: true, firstName: true, lastName: true },
      },
      challenge: {
        select: { name: true },
      },
      event: {
        select: { title: true, certTemplate: true },
      },
    },
  });

  if (!cert || cert.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-6 text-center relative selection:bg-indigo-500 selection:text-white transition-colors duration-300">

        <div className="bg-white border border-slate-200 text-slate-900 p-8 sm:p-10 rounded-3xl max-w-md shadow-xl shadow-slate-200/60 space-y-6 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
            <XCircle className="w-8 h-8 text-rose-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              ไม่พบใบประกาศนียบัตร
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-mono font-medium">
              ไม่พบรหัสใบประกาศ <b className="text-rose-600 font-bold">{cleanCode}</b> ในระบบ หรือใบประกาศนียบัตรฉบับนี้ถูกยกเลิกแล้ว
            </p>
          </div>

          <Link href="/certification">
            <Button variant="outline" className="w-full h-11 border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl font-mono text-xs uppercase tracking-wider text-slate-900 font-bold shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2 text-indigo-600" /> กลับสู่หน้าหลัก E-Certificate
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

  let teamName: string | undefined = undefined;
  if (cert.challengeId && cert.userId) {
    const tm = await prisma.teamMember.findFirst({
      where: { userId: cert.userId, challengeId: cert.challengeId, status: "APPROVED" },
      include: { team: true },
    });
    if (tm?.team?.name) {
      teamName = tm.team.name;
    }
  }

  const defaultTemplate = (!cert.event?.certTemplate) 
    ? await prisma.certTemplate.findFirst({ where: { isDefault: true } }) 
    : null;

  const templateBg = cert.event?.certTemplate?.backgroundImageUrl || defaultTemplate?.backgroundImageUrl;
  const templateConfig = (cert.event?.certTemplate?.layoutConfig || defaultTemplate?.layoutConfig) as any;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-200/40 via-teal-100/20 to-transparent blur-3xl pointer-events-none" />

      {/* TOP BRAND NAVBAR */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/certification" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo-icon.svg" 
              alt="Prime Digital Logo" 
              className="w-10 h-10 object-contain mix-blend-multiply transition-transform group-hover:scale-105" 
            />
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-base tracking-wider leading-none">PRIME DIGITAL</span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest leading-tight mt-0.5">Certificate Verification</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/certification">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-xs font-mono uppercase tracking-wider hidden sm:inline-flex font-bold">
                <ArrowLeft className="w-4 h-4 mr-2 text-emerald-600" />
                Certificate Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8 relative z-10">
        
        {/* VERIFICATION STATUS SEAL BANNER */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/5 space-y-6 backdrop-blur-xl">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-1 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                <FileCheck className="w-3.5 h-3.5" />
                VERIFIED AUTHENTIC & VALID
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ใบประกาศนียบัตรของ: <span className="text-emerald-700 font-bold">{displayName}</span>
              </h1>
              <p className="font-mono text-xs text-slate-600 uppercase tracking-wider font-semibold">
                ออกให้สำหรับกิจกรรม: <strong className="text-slate-900">{eventTitle}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs border-t border-emerald-200/60">
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">CERTIFICATE ID</span>
              <span className="font-bold text-slate-900 text-sm">{cert.certCode}</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">ISSUE DATE</span>
              <span className="font-bold text-slate-900 text-sm">{cert.issueDate}</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">STATUS</span>
              <span className="font-bold text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE & VALID
              </span>
            </div>
          </div>
        </div>

        {/* High-Res Canvas Display Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 space-y-6 backdrop-blur-xl">
          <ECertCanvas
            certData={{
              certCode: cert.certCode,
              recipientPrefix: cert.recipientPrefix || "",
              recipientFirstName: cert.recipientFirstName || "",
              recipientLastName: cert.recipientLastName || "",
              recipientFullName: displayName,
              teamName: teamName,
              eventTitle: eventTitle,
              issueDate: cert.issueDate,
              backgroundImageUrl: templateBg,
              layoutConfig: templateConfig,
            }}
            showDownloadBtn={true}
          />
        </div>

      </main>

      {/* FOOTER BRANDING */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Prime Digital • All Rights Reserved</p>
      </footer>
    </div>
  );
}
