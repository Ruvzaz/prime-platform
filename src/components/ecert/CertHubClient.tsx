"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, KeyRound, ShieldCheck, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CertHubClientProps {
  activeEvents: { id: string; title: string; slug: string }[];
}

export function CertHubClient({ activeEvents }: CertHubClientProps) {
  const [selectedEventSlug, setSelectedEventSlug] = useState<string>(
    activeEvents[0]?.slug || "",
  );
  const [tokenInput, setTokenInput] = useState<string>("");
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>("");
  const router = useRouter();

  const handleEventTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventSlug) {
      toast.error("กรุณาเลือกกิจกรรม");
      return;
    }
    const cleanToken = tokenInput.trim().toUpperCase();
    if (!cleanToken || cleanToken.length < 5) {
      toast.error("กรุณาระบุรหัส Token 6 หลัก");
      return;
    }
    router.push(`/certification/${selectedEventSlug}/${cleanToken}`);
  };

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
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-200/40 via-blue-100/20 to-transparent blur-3xl pointer-events-none" />

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

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10 relative z-10">
        {/* HERO SECTION */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs uppercase tracking-widest shadow-sm font-semibold">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Official Digital Certificate System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            E-Certificate Portal
          </h1>
        </div>

        {/* EVENT E-CERTIFICATES CARD (TOKEN CLAIM) */}
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-200/60 transition-all" />

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold">
                  E-Certificate
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  รับใบประกาศนียบัตร (Token Claim)
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  เลือกกิจกรรมและระบุรหัส Token 6
                  หลักที่คุณได้รับจากผู้จัดงานเพื่อออกใบประกาศนียบัตร
                </p>
              </div>

              <form
                onSubmit={handleEventTokenSubmit}
                className="space-y-4 pt-2"
              >
                {activeEvents.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-mono text-slate-700 uppercase tracking-wider font-bold">
                      เลือกกิจกรรม
                    </Label>
                    <Select
                      value={selectedEventSlug}
                      onValueChange={setSelectedEventSlug}
                    >
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-300 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm">
                        <SelectValue placeholder="เลือกกิจกรรม" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl shadow-lg">
                        {activeEvents.map((ev) => (
                          <SelectItem key={ev.id} value={ev.slug}>
                            {ev.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-center">
                    ขณะนี้ยังไม่มีกิจกรรมที่เปิดรับใบประกาศนียบัตร
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-mono text-slate-700 uppercase tracking-wider font-bold">
                    รหัส TOKEN 6 หลัก
                  </Label>
                  <Input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="เช่น 7K9X2B"
                    value={tokenInput}
                    onChange={(e) =>
                      setTokenInput(e.target.value.toUpperCase())
                    }
                    className="h-11 bg-slate-50 border-slate-300 text-slate-900 font-mono text-sm font-bold uppercase rounded-xl tracking-wider focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!selectedEventSlug || !tokenInput.trim()}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all mt-2 active:scale-[0.99]"
                >
                  <Award className="w-4 h-4 mr-2" />
                  <span>รับใบประกาศผ่าน Token 6 หลัก</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* VERIFICATION QUICK SEARCH BOX */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-50/90 border border-emerald-200/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl max-w-xl mx-auto text-center space-y-4 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-mono text-xs uppercase tracking-widest font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify Certificate Authenticity</span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            ตรวจสอบความถูกต้องของใบประกาศนียบัตร (Verify Certificate ID)
          </h3>

          <form
            onSubmit={handleVerifySubmit}
            className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="ระบุรหัสใบประกาศ เช่น CERT-2026-X8K9L2"
                value={verifyCodeInput}
                onChange={(e) =>
                  setVerifyCodeInput(e.target.value.toUpperCase())
                }
                className="h-11 bg-white border-slate-300 text-slate-900 font-mono text-xs pl-10 rounded-xl uppercase focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-sm font-semibold"
              />
            </div>
            <Button
              type="submit"
              disabled={!verifyCodeInput.trim()}
              className="w-full sm:w-auto h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-md shadow-emerald-600/20 active:scale-[0.99]"
            >
              ตรวจสอบ
            </Button>
          </form>
        </div>
      </main>

      {/* FOOTER BRANDING */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Prime Digital • All Rights Reserved</p>
      </footer>
    </div>
  );
}
