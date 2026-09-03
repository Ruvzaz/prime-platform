"use client";

import { useState } from "react";
import { 
  Award, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { lookupCertByInput } from "@/app/actions/cert-campaign";
import { ECertCanvas } from "@/components/ecert/ECertCanvas";

interface CertLookupClientProps {
  campaignSlug: string;
  campaignTitle: string;
  campaignDescription?: string | null;
  issueDate: string;
}

export function CertLookupClient({
  campaignSlug,
  campaignTitle,
  campaignDescription,
  issueDate,
}: CertLookupClientProps) {
  const [queryInput, setQueryInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search Result State
  const [searchResult, setSearchResult] = useState<{
    certificate: {
      id: string;
      certCode: string;
      recipientFullName: string;
      recipientFirstName: string;
      recipientLastName: string | null;
      eventTitle: string;
      issueDate: string;
      status: string;
    };
    template?: {
      backgroundImageUrl: string;
      layoutConfig: any;
    } | null;
    otherCertsCount: number;
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanQuery = queryInput.trim();

    if (!cleanQuery) {
      const err = "กรุณาระบุชื่อ-นามสกุล หรือ อีเมลเพื่อค้นหา";
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setIsSearching(true);
    try {
      const res = await lookupCertByInput(campaignSlug, cleanQuery);
      if (res.success && res.certificate) {
        setSearchResult({
          certificate: res.certificate,
          template: res.template,
          otherCertsCount: res.otherCertsCount || 0,
        });
        toast.success("พบใบประกาศนียบัตรของคุณแล้ว!");
      } else {
        const errStr = res.error || "ไม่พบรายชื่อในระบบ";
        setErrorMessage(errStr);
        toast.error(errStr);
        setSearchResult(null);
      }
    } catch {
      const errStr = "เกิดข้อผิดพลาดในการค้นหา";
      setErrorMessage(errStr);
      toast.error(errStr);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetSearch = () => {
    setSearchResult(null);
    setQueryInput("");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      {/* Ambient Radial Glow */}
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
              <span className="font-black text-slate-900 text-base tracking-wider leading-none">
                PRIME DIGITAL
              </span>
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest leading-tight mt-0.5">
                E-Certificate Portal
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 relative z-10">
        
        {/* IF RESULT FOUND: SHOW CERTIFICATE CANVAS VIEW */}
        {searchResult ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* BACK & ACTION BAR */}
            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
              <Button
                onClick={handleResetSearch}
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 text-xs font-mono font-bold uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4 mr-2 text-indigo-600" />
                ค้นหารายชื่ออื่น
              </Button>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 border border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified E-Certificate</span>
                </span>
              </div>
            </div>

            {/* BONUS OTHER CERTS NOTIFICATION */}
            {searchResult.otherCertsCount > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-4 text-xs font-medium text-indigo-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    พบใบประกาศนียบัตรอื่นๆ ในระบบของคุณอีก{" "}
                    <strong>{searchResult.otherCertsCount} ใบ</strong>
                  </span>
                </div>
                <Link href="/certification">
                  <Button size="sm" variant="outline" className="text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-100 border-indigo-300">
                    ดูทั้งหมด
                  </Button>
                </Link>
              </div>
            )}

            {/* CANVAS RENDERER */}
            <ECertCanvas
              certData={{
                certCode: searchResult.certificate.certCode,
                recipientFullName: searchResult.certificate.recipientFullName,
                recipientFirstName: searchResult.certificate.recipientFirstName,
                recipientLastName: searchResult.certificate.recipientLastName || "",
                eventTitle: searchResult.certificate.eventTitle,
                issueDate: searchResult.certificate.issueDate,
                backgroundImageUrl: searchResult.template?.backgroundImageUrl,
                layoutConfig: searchResult.template?.layoutConfig,
              }}
            />
          </div>
        ) : (
          /* SEARCH FORM CARD */
          <div className="max-w-xl mx-auto w-full">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 space-y-8 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none" />

              {/* HEADER INFO */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono uppercase bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>E-Certificate Portal</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {campaignTitle}
                </h1>

                {campaignDescription ? (
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {campaignDescription}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    ค้นหาและรับใบประกาศนียบัตรดิจิทัลโดยระบุชื่อ-นามสกุล หรือ อีเมลของคุณ
                  </p>
                )}
              </div>

              {/* SEARCH FORM */}
              <form onSubmit={handleSearch} className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="query" className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold block">
                    พิมพ์ชื่อ-นามสกุล หรือ อีเมล <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-600" />
                    <Input
                      id="query"
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี หรือ somchai@email.com"
                      value={queryInput}
                      onChange={(e) => {
                        setQueryInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className={`h-12 bg-slate-50 text-slate-900 font-sans text-sm font-semibold pl-10 rounded-xl shadow-sm transition-all ${
                        errorMessage
                          ? "border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/30"
                          : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                    />
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!queryInput.trim() || isSearching}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.99]"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>กำลังค้นหาข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      <span>ค้นหาและแสดงใบประกาศ</span>
                    </>
                  )}
                </Button>
              </form>
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
