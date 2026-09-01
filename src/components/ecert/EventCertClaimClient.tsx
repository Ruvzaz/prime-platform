"use client";

import { useState } from "react";
import { ECertCanvas } from "@/components/ecert/ECertCanvas";
import { claimEventCertToken } from "@/app/actions/event-cert-token";
import { Award, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, KeyRound, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

interface EventCertClaimClientProps {
  eventSlug: string;
  token: string;
  eventTitle: string;
  isUsed: boolean;
  initialClaimedName?: string | null;
  initialCertCode?: string | null;
  initialIssueDate?: string | null;
  backgroundImageUrl?: string | null;
  layoutConfig?: any;
}

export function EventCertClaimClient({
  eventSlug,
  token,
  eventTitle,
  isUsed: initialIsUsed,
  initialClaimedName,
  initialCertCode,
  initialIssueDate,
  backgroundImageUrl,
  layoutConfig,
}: EventCertClaimClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsed, setIsUsed] = useState(initialIsUsed);
  const [claimedName, setClaimedName] = useState(initialClaimedName || "");
  const [nameInput, setNameInput] = useState("");
  const [certCode, setCertCode] = useState(initialCertCode || `CERT-EVT-${token.toUpperCase()}`);
  const [issueDate, setIssueDate] = useState(initialIssueDate || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }));

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error("กรุณาระบุชื่อ-นามสกุลที่จะแสดงบนใบประกาศ");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await claimEventCertToken(eventSlug, token, nameInput.trim());
      if (res.success) {
        setIsUsed(true);
        setClaimedName(res.claimedName || nameInput.trim());
        if (res.certificate?.certCode) {
          setCertCode(res.certificate.certCode);
        }
        if (res.certificate?.issueDate) {
          setIssueDate(res.certificate.issueDate);
        }
        toast.success(res.alreadyClaimed ? "แสดงข้อมูลใบประกาศเรียบร้อย" : "ออกใบประกาศนียบัตรสำเร็จแล้ว!");
      } else {
        toast.error(res.error || "ไม่สามารถทำรายการได้");
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการทำรายการ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-200/40 via-blue-100/20 to-transparent blur-3xl pointer-events-none" />

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
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest leading-tight mt-0.5">Event Certificate Claim</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/events/${eventSlug}`}>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-xs font-mono uppercase tracking-wider hidden sm:inline-flex font-bold">
                <ArrowLeft className="w-4 h-4 mr-2 text-indigo-600" />
                Event Page
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8 relative z-10">
        
        {/* EVENT SUB-HEADER */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-slate-200/50">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold">
              EVENT CERTIFICATE
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {eventTitle}
            </h1>
            <p className="font-mono text-xs text-slate-600 uppercase tracking-wider flex items-center gap-2 font-medium">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>CLAIM TOKEN: <strong className="text-indigo-700 font-bold">{token.toUpperCase()}</strong></span>
            </p>
          </div>

          <Link href={`/events/${eventSlug}`}>
            <Button variant="outline" className="border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-mono uppercase tracking-wider shrink-0 font-bold shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2 text-indigo-600" />
              Event Page
            </Button>
          </Link>
        </div>

        {/* CLAIM FORM vs CERTIFICATE VIEW */}
        {!isUsed ? (
          /* STATE 1: TOKEN UNUSED - INPUT NAME FORM */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/60 space-y-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center space-y-3 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <UserCheck className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                กรอกชื่อ-นามสกุล เพื่อรับใบประกาศนียบัตร
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                1 รหัส Token สามารถออกใบประกาศได้เพียง 1 ใบเท่านั้น และเมื่อออกใบประกาศแล้ว ชื่อบนใบประกาศจะไม่สามารถแก้ไขได้
              </p>
            </div>

            <form onSubmit={handleClaim} className="max-w-md mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold">
                  ชื่อ - นามสกุล (สำหรับแสดงบนใบประกาศ) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย ใจดี / Ms. Jane Doe"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-300 text-slate-900 font-semibold text-sm rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 px-4 shadow-sm"
                />
                <p className="text-xs text-slate-500">
                  ตรวจสอบตัวสะกด ชื่อ-นามสกุล คำนำหน้า ให้ถูกต้องก่อนกดปุ่มยืนยัน
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !nameInput.trim()}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังสร้างใบประกาศนียบัตร...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    ยืนยันและออกใบประกาศนียบัตร
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* STATE 2: TOKEN CLAIMED - DISPLAY OFFICIAL E-CERTIFICATE */
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Status Banner */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ออกใบประกาศนียบัตรเรียบร้อยแล้ว
                  </h3>
                  <p className="text-xs text-emerald-800 font-mono mt-0.5 font-medium">
                    ออกให้แก่: <span className="font-bold text-slate-900">{claimedName}</span> (TOKEN: {token.toUpperCase()})
                  </p>
                </div>
              </div>

              <Link href={`/verify-cert/${certCode}`} target="_blank">
                <Button variant="outline" className="border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-mono uppercase tracking-wider shrink-0 font-bold shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
                  Verify Certificate
                </Button>
              </Link>
            </div>

            {/* Canvas Preview Container */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-6">
              <ECertCanvas
                certData={{
                  certCode,
                  recipientFullName: claimedName,
                  eventTitle,
                  issueDate,
                  backgroundImageUrl,
                  layoutConfig,
                }}
                showDownloadBtn={true}
              />
            </div>
          </div>
        )}

      </main>

      {/* FOOTER BRANDING */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-mono mt-auto">
        <p>© 2026 Prime Digital • All Rights Reserved</p>
      </footer>
    </div>
  );
}
