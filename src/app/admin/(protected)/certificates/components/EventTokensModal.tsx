"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Loader2,
  ExternalLink,
  Award,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateEventCertTokens, getEventCertTokens, deleteEventCertToken } from "@/app/actions/event-cert-token";
import * as XLSX from "xlsx";

interface EventTokensModalProps {
  events: any[];
}

export function EventTokensModal({ events }: EventTokensModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "");
  const [countInput, setCountInput] = useState<number | string>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const fetchTokens = async () => {
    if (!selectedEventId) return;
    setIsLoadingTokens(true);
    try {
      const data = await getEventCertTokens(selectedEventId);
      setTokens(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedEventId) {
      fetchTokens();
    }
  }, [isOpen, selectedEventId]);

  const handleGenerate = async () => {
    if (!selectedEventId) {
      toast.error("กรุณาเลือกกิจกรรม");
      return;
    }
    const numCount = typeof countInput === "number" ? countInput : parseInt(countInput, 10);
    if (!numCount || numCount < 1 || numCount > 1000) {
      toast.error("จำนวน Token ต้องอยู่ระหว่าง 1 ถึง 1000");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateEventCertTokens(selectedEventId, numCount);
      if (res.success) {
        toast.success(`สร้าง Token จำนวน ${res.count} รหัส เรียบร้อยแล้ว`);
        await fetchTokens();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการสร้าง Token");
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      const res = await deleteEventCertToken(tokenId);
      if (res.success) {
        toast.success("ลบ Token เรียบร้อยแล้ว");
        setTokens(tokens.filter((t) => t.id !== tokenId));
      } else {
        toast.error(res.error || "ไม่สามารถลบ Token ได้");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบ Token");
    }
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    toast.success(`คัดลอกลิงก์ Token ${token} เรียบร้อยแล้ว`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleExportExcel = () => {
    if (!selectedEvent || tokens.length === 0) {
      toast.error("ไม่มีข้อมูล Token สำหรับส่งออก");
      return;
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://primeevent.online";

    const exportRows = tokens.map((t) => {
      const directUrl = `${baseUrl}/certification/${selectedEvent.slug}/${t.token}`;
      return {
        "Token (6-digits)": t.token,
        "Event Title": selectedEvent.title,
        "Status": t.isUsed ? "Claimed (ใช้งานแล้ว)" : "Unused (ยังไม่ถูกใช้งาน)",
        "Claimed By": t.claimedName || "-",
        "Claimed Date": t.claimedAt ? new Date(t.claimedAt).toLocaleString("th-TH") : "-",
        "Direct Claim URL": directUrl,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Event Cert Tokens");

    XLSX.writeFile(
      workbook,
      `Cert_Tokens_${selectedEvent.slug}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("ส่งออกไฟล์ Excel สำเร็จแล้ว");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-medium">
          <KeyRound className="mr-2 h-4 w-4" />
          Event Tokens (6-digit)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col rounded-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Event E-Certificate Tokens Manager
          </DialogTitle>
          <DialogDescription>
            สร้างและจัดการรหัส Token 6 หลัก สำหรับให้ผู้เข้าร่วมงานกรอกชื่อรับใบประกาศนียบัตร
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto pr-1">
          {/* Controls: Event Selector & Generator */}
          <div className="bg-muted/40 p-5 rounded-xl space-y-4 border border-border/50">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                เลือกกิจกรรม (Event)
              </Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full h-10 rounded-lg bg-background">
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} ({e.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
              <div className="space-y-2 flex-1 sm:max-w-xs">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  จำนวน Token ที่จะสร้าง
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={countInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setCountInput("");
                    } else {
                      const parsed = parseInt(val, 10);
                      setCountInput(isNaN(parsed) ? "" : parsed);
                    }
                  }}
                  className="w-full h-10 font-mono font-bold text-base rounded-lg bg-background border-input px-3"
                  placeholder="10"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedEventId}
                className="h-10 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 rounded-lg shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    สร้าง Token
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tokens List Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 rounded-full border-amber-500/40 text-amber-600 bg-amber-500/10">
                {tokens.length} Tokens
              </Badge>
              <span className="text-xs text-muted-foreground">
                (ใช้งานแล้ว {tokens.filter((t) => t.isUsed).length} / {tokens.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTokens}
                disabled={isLoadingTokens}
                className="h-8 rounded-lg text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoadingTokens ? "animate-spin" : ""}`} />
                รีเฟรช
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={tokens.length === 0}
                className="h-8 rounded-lg text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* Tokens Table */}
          <div className="border rounded-xl overflow-hidden bg-background">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/60 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 font-mono">Token (6-digit)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Claimed Name</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoadingTokens ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                        <span>กำลังโหลดรายการ Token...</span>
                      </td>
                    </tr>
                  ) : tokens.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-muted-foreground">
                        <KeyRound className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="font-medium">ยังไม่มี Token สำหรับกิจกรรมนี้</p>
                        <p className="text-xs opacity-70 mt-1">กดปุ่มสร้างด้านบนเพื่อเพิ่มรหัส Token 6 หลัก</p>
                      </td>
                    </tr>
                  ) : (
                    tokens.map((t) => {
                      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://primeevent.online";
                      const directUrl = `${baseUrl}/certification/${selectedEvent?.slug}/${t.token}`;

                      return (
                        <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {t.token}
                          </td>
                          <td className="px-4 py-3">
                            {t.isUsed ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px]">
                                Claimed (ใช้งานแล้ว)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 text-[10px]">
                                Unused (ยังไม่ถูกใช้)
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {t.claimedName ? (
                              <div className="flex flex-col">
                                <span>{t.claimedName}</span>
                                {t.claimedAt && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(t.claimedAt).toLocaleString("th-TH")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(directUrl, t.token)}
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                title="คัดลอกลิงก์รับใบประกาศ"
                              >
                                {copiedToken === t.token ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <a
                                href={directUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="เปิดหน้าออกใบประกาศ"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteToken(t.id)}
                                className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="ลบ Token"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
