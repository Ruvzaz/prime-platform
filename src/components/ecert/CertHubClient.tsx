"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  ShieldCheck,
  Search,
  Sparkles,
  QrCode,
  FileCheck,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CertHubClient() {
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>("");
  const router = useRouter();

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("กรุณาระบุรหัสใบประกาศนียบัตร");
      return;
    }
    router.push(`/verify-cert/${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-200/40 via-blue-100/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

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
              <span className="font-black text-slate-900 text-base tracking-wider leading-none">
                PRIME DIGITAL
              </span>
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest leading-tight mt-0.5">
                Certification Portal
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16 relative z-10">
        {/* HERO SECTION */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-mono text-xs uppercase tracking-widest shadow-sm font-bold">
            <Award className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Official E-Certificate Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            ระบบออกและตรวจสอบ <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              ใบประกาศนียบัตรดิจิทัล
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
            ยินดีต้อนรับสู่พอร์ทัลใบประกาศนียบัตรดิจิทัลอย่างเป็นทางการโดย Prime
            Digital รับรองความถูกต้องด้วยเทคโนโลยีการตรวจสอบรหัสและ QR Code
            ดิจิทัลที่ไม่สามารถปลอมแปลงได้
          </p>
        </div>

        {/* 2-COLUMN MAIN CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* CARD 1: VERIFY CERTIFICATE (SEARCH) */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border border-emerald-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-300/40 transition-all" />

            <div className="space-y-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-md uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Public Verification</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  ตรวจสอบใบประกาศนียบัตร
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  ป้อนรหัสประจำใบประกาศนียบัตร (Certificate ID)
                  เพื่อตรวจสอบความถูกต้อง สถานะการรับรอง
                  และรายละเอียดผู้ได้รับใบประกาศ
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-700 uppercase tracking-wider font-bold block">
                    รหัสใบประกาศนียบัตร (CERTIFICATE ID)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="เช่น CERT-2026-X8K9L2"
                      value={verifyCodeInput}
                      onChange={(e) =>
                        setVerifyCodeInput(e.target.value.toUpperCase())
                      }
                      className="h-12 bg-white border-slate-300 text-slate-900 font-mono text-sm font-bold pl-10 rounded-xl uppercase focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!verifyCodeInput.trim()}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  <span>ตรวจสอบความถูกต้อง</span>
                </Button>
              </form>
            </div>

            <div className="pt-6 border-t border-emerald-100 mt-6 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>ระบบตรวจสอบข้อมูลโดยตรงจากฐานข้อมูลหลัก</span>
            </div>
          </div>

          {/* CARD 2: EVENT DIRECT LINK ACCESS INFO */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-200/60 transition-all" />

            <div className="space-y-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25">
                <QrCode className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md uppercase">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Direct Event Access</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  รับใบประกาศนียบัตรประจำกิจกรรม
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  ใบประกาศนียบัตรแต่ละกิจกรรมสามารถเข้าถึงได้โดยตรงผ่าน QR Code
                  หรือ URL ประจำกิจกรรมที่ผู้จัดงานส่งให้ผู้เข้าร่วม
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-mono text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>รูปแบบ URL ประจำกิจกรรม:</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-bold text-indigo-600 text-[11px] truncate shadow-inner">
                  https://primeevent.online/certification/
                  <span className="text-slate-900">[your-event-name]</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal font-sans">
                  * ผู้จัดงานจะมอบ QR Code
                  หรือลิงค์หน้านี้ให้แก่ผู้เข้าร่วมกิจกรรมโดยตรงเพื่อความสะดวกและรวดเร็ว
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span className="font-mono text-[11px] text-slate-400 font-medium">
                Scan & Access Directly
              </span>
            </div>
          </div>
        </div>

        {/* SECURITY & TRUST FEATURES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Digital Authenticity
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              ออกใบประกาศนียบัตรด้วยลายเซ็นดิจิทัล
              พร้อมระบบการเข้ารหัสป้องกันการปลอมแปลง
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              QR Code Instant Verification
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              สามารถสแกน QR Code
              บนใบประกาศนียบัตรเพื่อยืนยันตัวตนผู้รับได้ในทันที
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              High Resolution PDF
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              รองรับการดาวน์โหลดไฟล์ภาพและ PDF คุณภาพสูง คมชัด แม่นยำทุกตัวอักษร
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER BRANDING */}
      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 font-mono space-y-1">
        <p className="font-bold text-slate-700">
          PRIME DIGITAL E-CERTIFICATION SYSTEM
        </p>
        <p>© 2026 Prime Digital • All Rights Reserved</p>
      </footer>
    </div>
  );
}
