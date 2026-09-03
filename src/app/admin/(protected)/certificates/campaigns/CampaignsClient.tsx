"use client";

import { useState } from "react";
import { 
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
  Users,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Statistics
  const totalCampaigns = campaigns.length;
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c._count?.certificates || 0), 0);
  const activeCampaignsCount = campaigns.filter((c) => c.isActive).length;

  // Filtered list
  const filteredCampaigns = campaigns.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
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
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-mono text-xs uppercase font-bold tracking-wider">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Standalone Certificate Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            แคมเปญแจกใบประกาศ (No Event)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            ออกใบประกาศแบบไม่ต้องสร้าง Event นำเข้ารายชื่อผ่าน Excel (ชื่อ + อีเมล) และส่งลิงค์พอร์ทัลให้ผู้เข้าร่วมดาวน์โหลด
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm px-5 h-11 rounded-xl shadow-lg shadow-purple-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          สร้างแคมเปญใหม่
        </Button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-zinc-400">แคมเปญทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCampaigns} แคมเปญ</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-zinc-400">ผู้ได้รับใบประกาศรวม</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalRecipients.toLocaleString()} คน</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-zinc-400">สถานะเปิดใช้งาน</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCampaignsCount} แคมเปญ</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อแคมเปญ หรือ URL slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-medium rounded-xl shadow-sm"
          />
        </div>
      </div>

      {/* CAMPAIGNS GRID */}
      {filteredCampaigns.length === 0 ? (
        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">
            {searchQuery ? "ไม่พบแคมเปญที่ตรงกับการค้นหา" : "ยังไม่มีแคมเปญใบประกาศ"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? "ลองค้นหาด้วยคำอื่น" : "คลิกปุ่ม 'สร้างแคมเปญใหม่' เพื่อเริ่มต้นออกใบประกาศ"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const publicUrl = `/cert/${camp.slug}`;
            return (
              <Card
                key={camp.id}
                className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
              >
                <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Top Status & Delete */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                        /cert/{camp.slug}
                      </span>

                      <Button
                        onClick={() => handleDelete(camp.id, camp.title)}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Title & Date */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1">
                        วันที่ออกใบประกาศ: {camp.issueDate}
                      </p>
                    </div>

                    {/* Recipient Count Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800 flex items-center justify-between font-mono text-xs">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">จำนวนผู้ได้รับใบประกาศ:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                        {(camp._count?.certificates || 0).toLocaleString()} คน
                      </span>
                    </div>

                    {/* Template Badge */}
                    {camp.certTemplate && (
                      <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span className="truncate">แม่แบบ: {camp.certTemplate.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copyPublicUrl(camp.slug)}
                        variant="outline"
                        className="flex-1 h-9 text-xs font-mono font-bold border-slate-200 dark:border-zinc-800 rounded-xl"
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
                        <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-500 hover:text-purple-600 rounded-xl">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setIsImportOpen(true);
                      }}
                      className="w-full h-10 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      นำเข้ารายชื่อ Excel (ชื่อ + อีเมล)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE CAMPAIGN */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              สร้างแคมเปญใบประกาศนียบัตร
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              กำหนดชื่อกิจกรรม URL Slug และแม่แบบสำหรับออกใบประกาศแบบไม่ต้องสร้าง Event
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-zinc-300">
                ชื่อแคมเปญ/กิจกรรม <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="เช่น อบรมความมั่นคงปลอดภัยไซเบอร์ 2026"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-10 bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-zinc-300">
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
                  className="h-10 bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-zinc-300">
                วันที่ระบุบนใบประกาศ
              </Label>
              <Input
                type="text"
                required
                placeholder="เช่น 31 สิงหาคม 2569"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-10 bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-zinc-300">
                เลือกแม่แบบใบประกาศ (Template)
              </Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl">
                  <SelectValue placeholder="เลือกแม่แบบ" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl">
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
              className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl mt-2 shadow-md shadow-purple-600/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              ยืนยันการสร้างแคมเปญ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EXCEL BULK IMPORT */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>นำเข้ารายชื่อผ่าน Excel (2 คอลัมน์)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              สำหรับแคมเปญ <strong className="text-slate-900 dark:text-white">{selectedCampaign?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs space-y-1.5 font-medium">
              <p className="font-bold">📌 ข้อแนะนำไฟล์ Excel (2 คอลัมน์):</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] font-sans">
                <li>คอลัมน์ที่ 1: <strong>ชื่อ-นามสกุล</strong> (Name / FullName)</li>
                <li>คอลัมน์ที่ 2: <strong>อีเมล</strong> (Email / E-mail)</li>
                <li>ระบบจะข้ามรายชื่อที่ซ้ำกันให้อัตโนมัติใน <strong className="text-emerald-700 dark:text-emerald-400">&lt;0.5 วินาที</strong></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-zinc-300">
                เลือกไฟล์ Excel (.xlsx / .csv)
              </Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                required
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="h-10 bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700"
              />
            </div>

            <Button
              type="submit"
              disabled={isImporting || !importFile}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 mt-2"
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
