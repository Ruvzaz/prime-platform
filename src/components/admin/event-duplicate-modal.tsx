'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  getDuplicateRegistrationsGrouped,
  deleteRegistrations,
} from '@/app/actions/registration';

interface RegistrationItem {
  id: string;
  referenceCode: string;
  status: string;
  createdAt: Date;
  eventTitle: string;
  hasCheckIn: boolean;
  checkInsCount: number;
  checkInSessions: string[];
}

interface DuplicateGroup {
  key: string;
  email: string;
  name: string;
  registrations: RegistrationItem[];
}

interface EventDuplicateModalProps {
  currentEventId?: string;
  onRefresh?: () => void;
}

export function EventDuplicateModal({ currentEventId = 'all', onRefresh }: EventDuplicateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [totalDuplicatesCount, setTotalDuplicatesCount] = useState(0);
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
  const router = useRouter();

  const fetchDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDuplicateRegistrationsGrouped(currentEventId);
      if (res.success) {
        setGroups(res.groups);
        setTotalDuplicatesCount(res.totalDuplicatesCount);
      } else {
        toast.error(res.error || 'ไม่สามารถโหลดข้อมูลรายการซ้ำได้');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    if (open) {
      setSelectedToDelete([]);
      fetchDuplicates();
    }
  }, [open, fetchDuplicates]);

  const toggleSelect = (id: string) => {
    setSelectedToDelete((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectGroupUnchecked = (group: DuplicateGroup) => {
    const uncheckedIds = group.registrations
      .filter((r) => !r.hasCheckIn)
      .map((r) => r.id);

    const idsToAdd = uncheckedIds.length > 0
      ? uncheckedIds
      : group.registrations.slice(1).map((r) => r.id);

    setSelectedToDelete((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    toast.success(`เลือกรายการในกลุ่ม ${group.name} เรียบร้อยแล้ว`);
  };

  const selectGroupExceptNewest = (group: DuplicateGroup) => {
    const olderIds = group.registrations.slice(1).map((r) => r.id);
    setSelectedToDelete((prev) => Array.from(new Set([...prev, ...olderIds])));
    toast.success(`เลือกรายการซ้ำเก่าของ ${group.name} เรียบร้อยแล้ว`);
  };

  const handleDeleteSelected = async (targetIds?: string[]) => {
    const ids = targetIds || selectedToDelete;
    if (ids.length === 0) {
      toast.error('กรุณาเลือกรายการซ้ำที่ต้องการลบ');
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการลงทะเบียนซ้ำจำนวน ${ids.length} รายการ?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteRegistrations(ids);
      if (res.message && res.message.includes('successfully')) {
        toast.success(`ลบรายการลงทะเบียนซ้ำสำเร็จ (${ids.length} รายการ)`);
        setSelectedToDelete((prev) => prev.filter((i) => !ids.includes(i)));
        await fetchDuplicates();
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message || 'ไม่สามารถลบรายการได้');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl h-11 px-5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold gap-2 shadow-sm"
        >
          <Search className="w-4 h-4 text-amber-500" />
          <span>ตรวจจับรายการซ้ำ (Duplicates)</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[85vh] bg-card text-foreground border rounded-[2rem] shadow-2xl flex flex-col p-6 sm:p-8">
        <DialogHeader className="border-b border-border pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-slate-900 dark:text-white">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span>ระบบตรวจจับและลบการลงทะเบียนซ้ำ (Event Duplicates)</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDuplicates}
              disabled={loading}
              className="h-8 font-mono text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            แสดงรายการผู้ลงทะเบียนที่มี Email หรือ ชื่อ-นามสกุล ซ้ำกันในกิจกรรม
            ท่านสามารถเลือกติ๊กลบแต่ละใบด้วยตนเอง หรือใช้ปุ่มช่วยเลือกอัตโนมัติได้
          </DialogDescription>
        </DialogHeader>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <p className="text-sm font-mono text-muted-foreground animate-pulse">
                กำลังวิเคราะห์และจัดกลุ่มผู้ลงทะเบียนซ้ำ...
              </p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ไม่พบผู้ลงทะเบียนซ้ำในระบบ
              </h3>
              <p className="text-xs text-muted-foreground max-w-md">
                ข้อมูลการลงทะเบียนในกิจกรรมถูกต้องเรียบร้อย ไม่มีอีเมลหรือรายชื่อที่ลงทะเบียนซ้ำซ้อน
              </p>
            </div>
          ) : (
            <>
              {/* SUMMARY STATS BAR */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                    {groups.length}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      พบรายชื่อผู้ลงทะเบียนซ้ำ {groups.length} คน
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      รวมทั้งหมด {totalDuplicatesCount} เรคคอร์ดในระบบ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allDeletable = groups.flatMap((g) => g.registrations.slice(1).map((r) => r.id));
                      setSelectedToDelete(allDeletable);
                      toast.success(`เลือกรายการซ้ำให้อัตโนมัติ (${allDeletable.length} ใบ)`);
                    }}
                    className="text-xs font-mono font-bold bg-white dark:bg-slate-800"
                  >
                    ⚡ เลือกใบซ้ำให้อัตโนมัติ
                  </Button>
                </div>
              </div>

              {/* DUPLICATE GROUPS LIST */}
              <div className="space-y-6">
                {groups.map((group) => {
                  return (
                    <div
                      key={group.key}
                      className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                    >
                      {/* GROUP HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900 dark:text-white">
                                {group.name}
                              </span>
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-mono">
                                ซ้ำ {group.registrations.length} ครั้ง
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {group.email}
                            </p>
                          </div>
                        </div>

                        {/* GROUP QUICK ACTIONS */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectGroupUnchecked(group)}
                            className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 h-7"
                          >
                            เลือกใบที่ไม่เคย Check-in
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectGroupExceptNewest(group)}
                            className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 h-7"
                          >
                            เลือกใบเก่ายกเว้นใบใหม่สุด
                          </Button>
                        </div>
                      </div>

                      {/* REGISTRATION INSTANCES IN GROUP */}
                      <div className="space-y-2.5">
                        {group.registrations.map((reg, idx) => {
                          const isChecked = selectedToDelete.includes(reg.id);

                          return (
                            <div
                              key={reg.id}
                              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isChecked
                                  ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                                  : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleSelect(reg.id)}
                                  className="mt-1 sm:mt-0"
                                />

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-black text-amber-500">
                                      {reg.referenceCode}
                                    </span>
                                    {idx === 0 && (
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[9px] font-mono">
                                        ล่าสุด (Newest)
                                      </Badge>
                                    )}
                                    {reg.hasCheckIn ? (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[9px] font-mono">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Checked In ({reg.checkInSessions.join(', ')})
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/30 text-[9px] font-mono">
                                        ยังไม่เคย Check-in
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
                                    <span>{reg.eventTitle}</span>
                                    <span>•</span>
                                    <span>
                                      ลงทะเบียนเมื่อ: {new Date(reg.createdAt).toLocaleString('th-TH')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 justify-end shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSelected([reg.id])}
                                  disabled={isDeleting}
                                  className="text-xs text-rose-500 hover:bg-rose-500/10 h-8 px-3 rounded-lg font-mono font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  ลบใบนี้
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <DialogFooter className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-muted-foreground">
            {selectedToDelete.length > 0 ? (
              <span>
                เลือกแล้ว <strong className="text-rose-500 font-bold">{selectedToDelete.length}</strong> รายการสำหรับลบ
              </span>
            ) : (
              <span>ติ๊กเลือกรายการซ้ำที่ต้องการลบเพื่อดำเนินการ</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="rounded-xl h-11 px-5"
            >
              ปิดหน้าต่าง
            </Button>

            <Button
              onClick={() => handleDeleteSelected()}
              disabled={selectedToDelete.length === 0 || isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-rose-600/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  ลบรายการซ้ำที่เลือก ({selectedToDelete.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
