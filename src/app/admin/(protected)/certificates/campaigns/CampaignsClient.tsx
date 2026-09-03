"use client";

import { useState } from "react";
import { 
  Award, 
  Plus, 
  Upload, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  FileSpreadsheet, 
  Loader2, 
  Layers, 
  Sparkles,
  Search,
  QrCode
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCertCampaign, deleteCertCampaign } from "@/app/actions/cert-campaign";

interface CampaignsClientProps {
  initialCampaigns: any[];
  templates: any[];
}

export function CampaignsClient({ initialCampaigns, templates }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [issueDate, setIssueDate] = useState("31 สิงหาคม 2569");
  const [templateId, setTemplateId] = useState(templates[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Copy State
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto generate slug
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      setSlug(generated);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error("กรุณาระบุชื่อแคมเปญและ URL Slug");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCertCampaign({
        title: title.trim(),
        slug: slug.trim(),
        issueDate: issueDate.trim() || "31 สิงหาคม 2569",
        certTemplateId: templateId || undefined,
      });

      if (res.success && res.campaign) {
        toast.success("สร้างแคมเปญใบประกาศเรียบร้อยแล้ว!");
        setIsCreateOpen(false);
        setTitle("");
        setSlug("");
        window.location.reload();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการสร้างแคมเปญ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างแคมเปญ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !selectedCampaign) {
      toast.error("กรุณาแนบไฟล์ Excel และเลือกแคมเปญ");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("campaignId", selectedCampaign.id);

      const res = await fetch("/api/admin/ecert/campaign/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "นำเข้ารายชื่อสำเร็จ!");
        setIsImportOpen(false);
        setImportFile(null);
        window.location.reload();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการนำเข้า");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการนำเข้าไฟล์");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแคมเปญ "${title}" และรายชื่อทั้งหมด?`)) return;
    try {
      const res = await deleteCertCampaign(id);
      if (res.success) {
        toast.success("ลบแคมเปญเรียบร้อยแล้ว");
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(res.error || "ไม่สามารถลบแคมเปญได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบแคมเปญ");
    }
  };

  const copyPublicUrl = (slug: string) => {
    const fullUrl = `${window.location.origin}/cert/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    toast.success(`คัดลอกลิงค์ /cert/${slug} แล้ว!`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* HEADER & NAV TABS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs uppercase tracking-widest font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Standalone Certificate Campaigns</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            แคมเปญแจกใบประกาศ (ไม่ต้องมี Event)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สร้างลิงค์รับใบประกาศ ให้ผู้เข้าร่วมพิมพ์ค้นหาชื่อหรืออีเมลเพื่อดาวน์โหลดใบประกาศนียบัตรได้ทันที
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-11 px-5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            สร้างแคมเปญใหม่
          </Button>
        </div>
      </div>

      {/* TOP NAVIGATION LINK TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <Link href="/admin/certificates">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-xs font-bold rounded-lg">
            <Award className="w-4 h-4 mr-2 text-slate-400" />
            ใบประกาศทั้งหมด
          </Button>
        </Link>
        <Button variant="secondary" className="bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
          <Layers className="w-4 h-4 mr-2 text-indigo-600" />
          แคมเปญแจกใบประกาศ (No Event)
        </Button>
        <Link href="/admin/certificates/templates">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-xs font-bold rounded-lg">
            <Sparkles className="w-4 h-4 mr-2 text-slate-400" />
            แม่แบบใบประกาศ (Templates)
          </Button>
        </Link>
      </div>

      {/* CAMPAIGNS GRID / TABLE */}
      {campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ยังไม่มีแคมเปญใบประกาศ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            เริ่มต้นสร้างแคมเปญสำหรับออกใบประกาศนียบัตรโดยไม่ต้องสร้าง Event พร้อมอัปโหลดไฟล์ Excel รายชื่อ (ชื่อ + อีเมล) ได้ทันที
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-6 mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            สร้างแคมเปญแรก
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const publicUrl = `/cert/${camp.slug}`;
            return (
              <div
                key={camp.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-indigo-50 border border-indigo-200 text-indigo-700">
                      /cert/{camp.slug}
                    </span>
                    <Button
                      onClick={() => handleDelete(camp.id, camp.title)}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug line-clamp-2">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      วันที่ออกใบประกาศ: {camp.issueDate}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500">จำนวนรายชื่อผู้รับ:</span>
                    <span className="font-bold text-indigo-600 text-sm">
                      {camp._count?.certificates || 0} คน
                    </span>
                  </div>

                  {camp.certTemplate && (
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate">แม่แบบ: {camp.certTemplate.name}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyPublicUrl(camp.slug)}
                      variant="outline"
                      className="flex-1 h-9 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                    >
                      {copiedSlug === camp.slug ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          คัดลอกแล้ว
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          คัดลอก URL
                        </>
                      )}
                    </Button>

                    <Link href={publicUrl} target="_blank">
                      <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-500 hover:text-indigo-600 rounded-xl">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setIsImportOpen(true);
                    }}
                    className="w-full h-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    นำเข้ารายชื่อ Excel (ชื่อ + อีเมล)
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE CAMPAIGN */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-slate-900">
              สร้างแคมเปญใบประกาศนียบัตร
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              กำหนดชื่อกิจกรรม URL Slug และแม่แบบสำหรับออกใบประกาศแบบไม่ต้องสร้าง Event
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700">
                ชื่อแคมเปญ/กิจกรรม <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="เช่น อบรมความมั่นคงปลอดภัยไซเบอร์ 2026"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-11 bg-slate-50 border-slate-300 text-slate-900 font-semibold text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700">
                URL SLUG <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">/cert/</span>
                <Input
                  type="text"
                  required
                  placeholder="เช่น cyber-workshop-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className="h-11 bg-slate-50 border-slate-300 text-slate-900 font-mono text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700">
                วันที่ระบุบนใบประกาศ
              </Label>
              <Input
                type="text"
                required
                placeholder="เช่น 31 สิงหาคม 2569"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-11 bg-slate-50 border-slate-300 text-slate-900 font-semibold text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700">
                เลือกแม่แบบใบประกาศ (Template)
              </Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-300 text-slate-900 text-xs font-semibold rounded-xl">
                  <SelectValue placeholder="เลือกแม่แบบ" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl">
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl mt-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              ยืนยันการสร้างแคมเปญ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EXCEL BULK IMPORT */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>นำเข้ารายชื่อผ่าน Excel (2 คอลัมน์)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              สำหรับแคมเปญ <strong className="text-slate-900">{selectedCampaign?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 font-medium">
              <p className="font-bold">📌 ข้อแนะนำไฟล์ Excel (2 คอลัมน์):</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] font-sans">
                <li>คอลัมน์ที่ 1: <strong>ชื่อ-นามสกุล</strong> (Name / FullName)</li>
                <li>คอลัมน์ที่ 2: <strong>อีเมล</strong> (Email / E-mail)</li>
                <li>ระบบจะข้ามรายชื่อที่ซ้ำกันให้อัตโนมัติใน <strong className="text-emerald-700">&lt;0.5 วินาที</strong></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700">
                เลือกไฟล์ Excel (.xlsx / .csv)
              </Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                required
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="h-11 bg-slate-50 border-slate-300 text-slate-900 text-xs font-semibold rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700"
              />
            </div>

            <Button
              type="submit"
              disabled={isImporting || !importFile}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 mt-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>กำลังนำเข้ารายชื่อ...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  <span>เริ่มนำเข้ารายชื่อ</span>
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
