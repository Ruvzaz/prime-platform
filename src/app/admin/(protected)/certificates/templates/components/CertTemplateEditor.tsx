"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CertLayoutConfig, DEFAULT_LAYOUT_CONFIG } from "@/types/cert-template";
import { upsertCertTemplate } from "@/app/actions/cert-template";
import {
  Upload,
  Save,
  ArrowLeft,
  Move,
  CheckCircle2,
  Type,
  Calendar,
  QrCode,
  FileCode,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CertTemplateEditorProps {
  initialTemplate?: {
    id: string;
    name: string;
    backgroundImageUrl: string;
    layoutConfig: any;
    isDefault: boolean;
  } | null;
}

export function CertTemplateEditor({ initialTemplate }: CertTemplateEditorProps) {
  const router = useRouter();
  const [templateName, setTemplateName] = useState(initialTemplate?.name || "แม่แบบใบประกาศใหม่");
  const [bgUrl, setBgUrl] = useState(initialTemplate?.backgroundImageUrl || "");
  const [isDefault, setIsDefault] = useState(initialTemplate?.isDefault || false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sampleDateText, setSampleDateText] = useState("31 สิงหาคม 2569");

  const [layout, setLayout] = useState<CertLayoutConfig>(
    initialTemplate?.layoutConfig
      ? { ...DEFAULT_LAYOUT_CONFIG, ...(initialTemplate.layoutConfig as CertLayoutConfig) }
      : DEFAULT_LAYOUT_CONFIG
  );

  const [activeElement, setActiveElement] = useState<"name" | "team" | "date" | "qr" | "code">("name");

  // Dragging state
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<"name" | "team" | "date" | "qr" | "code" | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/ecert/upload-template", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setBgUrl(data.url);
        toast.success("อัปโหลดภาพแม่แบบเรียบร้อยแล้ว");
      } else {
        toast.error(data.error || "ไม่สามารถอัปโหลดภาพแม่แบบได้");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    } finally {
      setIsUploading(false);
    }
  };

  // Mouse Dragging inside Canvas Container
  const handlePointerDown = (elementKey: "name" | "team" | "date" | "qr" | "code", e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveElement(elementKey);
    setDraggingTarget(elementKey);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTarget || !canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse coordinates to percentages (0 - 100)
    let percentX = Math.round((mouseX / rect.width) * 100);
    let percentY = Math.round((mouseY / rect.height) * 100);

    percentX = Math.max(2, Math.min(98, percentX));
    percentY = Math.max(2, Math.min(98, percentY));

    if (draggingTarget === "name") {
      setLayout((prev) => ({ ...prev, nameX: percentX, nameY: percentY }));
    } else if (draggingTarget === "team") {
      setLayout((prev) => ({ ...prev, teamX: percentX, teamY: percentY }));
    } else if (draggingTarget === "date") {
      setLayout((prev) => ({ ...prev, dateX: percentX, dateY: percentY }));
    } else if (draggingTarget === "qr") {
      setLayout((prev) => ({ ...prev, qrX: percentX, qrY: percentY }));
    } else if (draggingTarget === "code") {
      setLayout((prev) => ({ ...prev, codeX: percentX, codeY: percentY }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingTarget) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingTarget(null);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("กรุณาระบุชื่อแม่แบบ");
      return;
    }
    if (!bgUrl) {
      toast.error("กรุณาอัปโหลดภาพพื้นหลังแม่แบบ (JPG/PNG)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await upsertCertTemplate({
        id: initialTemplate?.id,
        name: templateName.trim(),
        backgroundImageUrl: bgUrl,
        layoutConfig: layout,
        isDefault,
      });

      if (res.success) {
        toast.success("บันทึกแม่แบบและพิกัดการลากวางสำเร็จ!");
        router.push("/admin/certificates/templates");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      toast.error("ไม่สามารถทำรายการได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="space-y-1">
          <Link href="/admin/certificates/templates">
            <Button variant="ghost" className="text-slate-500 text-xs font-mono uppercase tracking-wider p-0 mb-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับไปรายการแม่แบบ
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {initialTemplate ? "แก้ไขพิกัดแม่แบบใบประกาศ" : "สร้างแม่แบบใบประกาศใหม่ (Visual Editor)"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            อัปโหลดภาพแม่แบบ JPG/PNG และลากวางตำแหน่งข้อความที่ต้องการพิมพ์บนใบประกาศ
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || !bgUrl}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm px-6 h-11 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              บันทึกแม่แบบและตำแหน่ง
            </>
          )}
        </Button>
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Drag & Drop Canvas Preview Area (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-2">
              <Move className="w-4 h-4 text-indigo-500" />
              พื้นที่ลากวางตำแหน่งบนใบประกาศ (DRAG & DROP CANVAS)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              อัตราส่วน 1.414:1 (A4 Landscape)
            </span>
          </div>

          <div
            ref={canvasContainerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ containerType: "inline-size" }}
            className="relative w-full aspect-[2000/1414] bg-slate-200 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 overflow-hidden shadow-2xl select-none"
          >
            {bgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bgUrl}
                alt="Template Background"
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Upload className="w-12 h-12 mb-3 text-slate-300 dark:text-zinc-600" />
                <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">ยังไม่ได้อัปโหลดภาพพื้นหลังแม่แบบ</p>
                <p className="text-xs text-slate-400 mt-1">กรุณาอัปโหลดภาพ JPG หรือ PNG ฝั่งแผงควบคุมขวามือ</p>
              </div>
            )}

            {/* DRAGGABLE ELEMENT 1: Recipient Name (ชื่อ-นามสกุล) */}
            {bgUrl && layout.showName && (
              <div
                onPointerDown={(e) => handlePointerDown("name", e)}
                style={{
                  left: `${layout.nameX}%`,
                  top: `${layout.nameY}%`,
                  color: layout.nameColor,
                  textAlign: layout.nameAlign,
                  fontSize: `${((layout.nameFontSize || 56) / 2000) * 100}cqw`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute cursor-move px-3 py-1.5 rounded-lg border-2 font-bold transition-shadow ${
                  activeElement === "name"
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg ring-2 ring-indigo-500/30 z-30"
                    : "border-indigo-400/50 bg-white/40 dark:bg-black/40 z-20"
                }`}
              >
                <span className="absolute -top-2 -translate-y-full left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-indigo-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow z-40">
                  ชื่อ-นามสกุล
                </span>
                <span className="whitespace-nowrap font-serif">นายสมชาย ใจดี (ตัวอย่างชื่อ)</span>
              </div>
            )}

            {/* DRAGGABLE ELEMENT 5: Team Name (ชื่อทีมสำหรับ Challenge) */}
            {bgUrl && layout.showTeam && (
              <div
                onPointerDown={(e) => handlePointerDown("team", e)}
                style={{
                  left: `${layout.teamX ?? 50}%`,
                  top: `${layout.teamY ?? 58}%`,
                  color: layout.teamColor ?? "#2563eb",
                  textAlign: layout.teamAlign ?? "center",
                  fontSize: `${((layout.teamFontSize || 32) / 2000) * 100}cqw`,
                  maxWidth: `${((layout.teamMaxWidth || 650) / 2000) * 100}cqw`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute cursor-move px-3 py-1 rounded-lg border-2 font-bold transition-shadow overflow-hidden text-ellipsis whitespace-nowrap ${
                  activeElement === "team"
                    ? "border-purple-500 bg-purple-500/10 shadow-lg ring-2 ring-purple-500/30 z-30"
                    : "border-purple-400/50 bg-white/40 dark:bg-black/40 z-20"
                }`}
              >
                <span className="absolute -top-2 -translate-y-full left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-purple-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow z-40">
                  ชื่อทีม
                </span>
                <span className="whitespace-nowrap font-sans truncate block max-w-full">CyberDefender X (ตัวอย่างชื่อทีม)</span>
              </div>
            )}

            {/* DRAGGABLE ELEMENT 2: Issue Date (วันที่ออกใบประกาศ) */}
            {bgUrl && layout.showDate && (
              <div
                onPointerDown={(e) => handlePointerDown("date", e)}
                style={{
                  left: `${layout.dateX}%`,
                  top: `${layout.dateY}%`,
                  color: layout.dateColor,
                  textAlign: layout.dateAlign,
                  fontSize: `${((layout.dateFontSize || 24) / 2000) * 100}cqw`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute cursor-move px-3 py-1 rounded-lg border-2 font-mono transition-shadow ${
                  activeElement === "date"
                    ? "border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-500/30 z-30"
                    : "border-amber-400/50 bg-white/40 dark:bg-black/40 z-20"
                }`}
              >
                <span className="absolute -top-2 -translate-y-full left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-amber-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow z-40">
                  วันที่ออก
                </span>
                <span className="whitespace-nowrap">
                  {(() => {
                    const extractDay = (str: string) => {
                      const match = /\d+/.exec(str);
                      return match ? match[0] : str;
                    };
                    const mode = layout.dateFormatMode || "FULL_WITH_PREFIX";
                    if (mode === "DAY_NUMBER_ONLY") return extractDay(sampleDateText);
                    if (mode === "DATE_ONLY") return sampleDateText;
                    if (mode === "CUSTOM_PREFIX") return `${layout.dateCustomPrefix || ""}${sampleDateText}`;
                    const prefix = layout.dateCustomPrefix !== undefined ? layout.dateCustomPrefix : "ให้ไว้ ณ วันที่ ";
                    return `${prefix}${sampleDateText}`;
                  })()}
                </span>
              </div>
            )}

            {/* DRAGGABLE ELEMENT 3: Verification QR Code */}
            {bgUrl && layout.showQr && (
              <div
                onPointerDown={(e) => handlePointerDown("qr", e)}
                style={{
                  left: `${layout.qrX}%`,
                  top: `${layout.qrY}%`,
                  width: `${((layout.qrSize || 140) / 2000) * 100}cqw`,
                  height: `${((layout.qrSize || 140) / 2000) * 100}cqw`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute cursor-move p-1.5 rounded-xl border-2 bg-white flex flex-col items-center justify-center transition-shadow ${
                  activeElement === "qr"
                    ? "border-emerald-500 shadow-lg ring-2 ring-emerald-500/30 z-30"
                    : "border-emerald-400/50 z-20"
                }`}
              >
                <span className="absolute -top-2 -translate-y-full left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow z-40">
                  QR Code
                </span>
                <QrCode className="w-full h-full text-slate-900" />
              </div>
            )}

            {/* DRAGGABLE ELEMENT 4: Certificate Code */}
            {bgUrl && layout.showCode && (
              <div
                onPointerDown={(e) => handlePointerDown("code", e)}
                style={{
                  left: `${layout.codeX}%`,
                  top: `${layout.codeY}%`,
                  color: layout.codeColor,
                  textAlign: layout.codeAlign,
                  fontSize: `${((layout.codeFontSize || 20) / 2000) * 100}cqw`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute cursor-move px-2.5 py-1 rounded-lg border-2 font-mono font-bold transition-shadow ${
                  activeElement === "code"
                    ? "border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500/30 z-30"
                    : "border-blue-400/50 bg-white/40 dark:bg-black/40 z-20"
                }`}
              >
                <span className="whitespace-nowrap">CERT-2026-X8K9L2</span>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  รหัสอ้างอิง
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Configuration Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Template Settings & Image Upload */}
          <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                1. ข้อมูลแม่แบบ & อัปโหลดภาพ
              </h3>

              <div className="space-y-2">
                <Label className="text-xs font-mono font-bold">ชื่อแม่แบบ (Template Name)</Label>
                <Input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="เช่น แม่แบบประกาศนียบัตร งานอบรม 2026"
                  className="h-10 text-xs font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-mono font-bold">อัปโหลดภาพแม่แบบ (JPG / PNG)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  แนวนอน (Landscape) ความละเอียดแนะนำ 2000 x 1414 px
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Label className="text-xs font-mono font-bold">ตั้งเป็นแม่แบบเริ่มต้น (Default)</Label>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Element Toggles (Checkboxes) */}
          <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                2. เลือกเปิด/ปิดข้อความทับภาพ
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">ชื่อ-นามสกุล (Recipient Name)</span>
                  </div>
                  <Switch
                    checked={layout.showName}
                    onCheckedChange={(checked) => setLayout((p) => ({ ...p, showName: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">ชื่อทีม (Team Name - สำหรับ Challenge)</span>
                  </div>
                  <Switch
                    checked={layout.showTeam ?? false}
                    onCheckedChange={(checked) => setLayout((p) => ({ ...p, showTeam: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">วันที่ออกใบประกาศ (Issue Date)</span>
                  </div>
                  <Switch
                    checked={layout.showDate}
                    onCheckedChange={(checked) => setLayout((p) => ({ ...p, showDate: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Verify QR Code</span>
                  </div>
                  <Switch
                    checked={layout.showQr}
                    onCheckedChange={(checked) => setLayout((p) => ({ ...p, showQr: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">รหัสใบประกาศ (Cert Code)</span>
                  </div>
                  <Switch
                    checked={layout.showCode}
                    onCheckedChange={(checked) => setLayout((p) => ({ ...p, showCode: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Active Element Styling Settings */}
          <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                  3. ตกแต่งฟอนต์ & พิกัด ({activeElement.toUpperCase()})
                </h3>
                <div className="flex items-center gap-1 flex-wrap">
                  {(["name", "team", "date", "qr", "code"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveElement(key)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        activeElement === key
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {activeElement === "name" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด X (%)</Label>
                      <Input
                        type="number"
                        value={layout.nameX}
                        onChange={(e) => setLayout((p) => ({ ...p, nameX: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด Y (%)</Label>
                      <Input
                        type="number"
                        value={layout.nameY}
                        onChange={(e) => setLayout((p) => ({ ...p, nameY: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">ขนาดฟอนต์ (px)</Label>
                      <Input
                        type="number"
                        value={layout.nameFontSize}
                        onChange={(e) => setLayout((p) => ({ ...p, nameFontSize: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">สีตัวอักษร (Color)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.nameColor}
                          onChange={(e) => setLayout((p) => ({ ...p, nameColor: e.target.value }))}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={layout.nameColor}
                          onChange={(e) => setLayout((p) => ({ ...p, nameColor: e.target.value }))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeElement === "team" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด X (%)</Label>
                      <Input
                        type="number"
                        value={layout.teamX ?? 50}
                        onChange={(e) => setLayout((p) => ({ ...p, teamX: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด Y (%)</Label>
                      <Input
                        type="number"
                        value={layout.teamY ?? 58}
                        onChange={(e) => setLayout((p) => ({ ...p, teamY: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">ขนาดฟอนต์ (px)</Label>
                      <Input
                        type="number"
                        value={layout.teamFontSize ?? 32}
                        onChange={(e) => setLayout((p) => ({ ...p, teamFontSize: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">ความกว้างสูงสุด (px)</Label>
                      <Input
                        type="number"
                        value={layout.teamMaxWidth ?? 650}
                        onChange={(e) => setLayout((p) => ({ ...p, teamMaxWidth: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">สีตัวอักษร (Color)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.teamColor ?? "#2563eb"}
                          onChange={(e) => setLayout((p) => ({ ...p, teamColor: e.target.value }))}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={layout.teamColor ?? "#2563eb"}
                          onChange={(e) => setLayout((p) => ({ ...p, teamColor: e.target.value }))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeElement === "date" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด X (%)</Label>
                      <Input
                        type="number"
                        value={layout.dateX}
                        onChange={(e) => setLayout((p) => ({ ...p, dateX: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด Y (%)</Label>
                      <Input
                        type="number"
                        value={layout.dateY}
                        onChange={(e) => setLayout((p) => ({ ...p, dateY: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">ขนาดฟอนต์ (px)</Label>
                      <Input
                        type="number"
                        value={layout.dateFontSize}
                        onChange={(e) => setLayout((p) => ({ ...p, dateFontSize: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">สีตัวอักษร (Color)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.dateColor}
                          onChange={(e) => setLayout((p) => ({ ...p, dateColor: e.target.value }))}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={layout.dateColor}
                          onChange={(e) => setLayout((p) => ({ ...p, dateColor: e.target.value }))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <Label className="text-[10px] uppercase font-bold text-slate-700 dark:text-zinc-300">
                      รูปแบบการแสดงผลวันที่ (Date Format)
                    </Label>
                    <Select
                      value={layout.dateFormatMode || "FULL_WITH_PREFIX"}
                      onValueChange={(val: any) =>
                        setLayout((p) => ({ ...p, dateFormatMode: val }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 rounded-lg">
                        <SelectValue placeholder="เลือกรูปแบบวันที่" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs">
                        <SelectItem value="FULL_WITH_PREFIX">
                          แสดงครบ + คำนำหน้า ("ให้ไว้ ณ วันที่ 31 สิงหาคม 2569")
                        </SelectItem>
                        <SelectItem value="DATE_ONLY">
                          แสดงเฉพาะ วัน เดือน ปี ("31 สิงหาคม 2569")
                        </SelectItem>
                        <SelectItem value="DAY_NUMBER_ONLY">
                          แสดงเฉพาะตัวเลขวันที่ ("31") — สำหรับภาพที่มีเดือน/ปีพิมพ์แล้ว
                        </SelectItem>
                        <SelectItem value="CUSTOM_PREFIX">
                          กำหนดคำนำหน้าเอง (Custom Prefix)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(layout.dateFormatMode === "CUSTOM_PREFIX" || layout.dateFormatMode === "FULL_WITH_PREFIX") && (
                    <div className="space-y-1 text-xs font-mono">
                      <Label className="text-[10px] uppercase font-bold text-slate-700 dark:text-zinc-300">
                        คำนำหน้าวันที่ (Prefix)
                      </Label>
                      <Input
                        type="text"
                        placeholder="เช่น ให้ไว้ ณ วันที่ หรือ ณ วันที่"
                        value={layout.dateCustomPrefix !== undefined ? layout.dateCustomPrefix : "ให้ไว้ ณ วันที่ "}
                        onChange={(e) => setLayout((p) => ({ ...p, dateCustomPrefix: e.target.value }))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-xs font-mono pt-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-700 dark:text-zinc-300">
                      ข้อความวันที่ทดสอบตัวอย่าง (Sample Date Preview)
                    </Label>
                    <Input
                      type="text"
                      placeholder="เช่น 31 สิงหาคม 2569 หรือ 15 กันยายน 2569"
                      value={sampleDateText}
                      onChange={(e) => setSampleDateText(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {activeElement === "qr" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด X (%)</Label>
                      <Input
                        type="number"
                        value={layout.qrX}
                        onChange={(e) => setLayout((p) => ({ ...p, qrX: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด Y (%)</Label>
                      <Input
                        type="number"
                        value={layout.qrY}
                        onChange={(e) => setLayout((p) => ({ ...p, qrY: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">ขนาด (px)</Label>
                      <Input
                        type="number"
                        value={layout.qrSize}
                        onChange={(e) => setLayout((p) => ({ ...p, qrSize: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeElement === "code" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด X (%)</Label>
                      <Input
                        type="number"
                        value={layout.codeX}
                        onChange={(e) => setLayout((p) => ({ ...p, codeX: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">พิกัด Y (%)</Label>
                      <Input
                        type="number"
                        value={layout.codeY}
                        onChange={(e) => setLayout((p) => ({ ...p, codeY: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <Label className="text-[10px] uppercase font-bold">ขนาดฟอนต์ (px)</Label>
                      <Input
                        type="number"
                        value={layout.codeFontSize}
                        onChange={(e) => setLayout((p) => ({ ...p, codeFontSize: Number(e.target.value) }))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold">สีตัวอักษร (Color)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.codeColor}
                          onChange={(e) => setLayout((p) => ({ ...p, codeColor: e.target.value }))}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={layout.codeColor}
                          onChange={(e) => setLayout((p) => ({ ...p, codeColor: e.target.value }))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
