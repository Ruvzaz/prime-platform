"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, KeyRound, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

interface EventTokenInputClientProps {
  eventSlug: string;
  eventTitle: string;
}

export function EventTokenInputClient({
  eventSlug,
  eventTitle
}: EventTokenInputClientProps) {
  const [tokenInput, setTokenInput] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim().toUpperCase();
    if (!cleanToken || cleanToken.length < 5) {
      toast.error("กรุณาระบุรหัส Token 6 หลักให้ถูกต้อง");
      return;
    }
    router.push(`/certification/${eventSlug}/${cleanToken}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      
      {/* Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-200/40 via-blue-100/20 to-transparent blur-3xl pointer-events-none" />

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
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-16 sm:py-24 relative z-10">
        <div className="bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 rounded-3xl p-8 sm:p-10 space-y-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center space-y-4">
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold">
                TOKEN CLAIM
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {eventTitle}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                รับใบประกาศนียบัตรโดยป้อนรหัส TOKEN 6 หลักที่คุณได้รับ
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold">
                รหัส TOKEN 6 หลัก (CLAIM TOKEN) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Award className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-600" />
                <Input
                  id="token"
                  type="text"
                  required
                  maxLength={10}
                  placeholder="เช่น 7K9X2B"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  className="h-11 bg-slate-50 border-slate-300 text-slate-900 font-mono text-base font-bold tracking-widest pl-10 uppercase rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!tokenInput.trim()}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.99]"
            >
              <span>ดำเนินการต่อ</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </main>

      {/* FOOTER BRANDING */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-mono mt-auto">
        <p>© 2026 Prime Digital • All Rights Reserved</p>
      </footer>
    </div>
  );
}
