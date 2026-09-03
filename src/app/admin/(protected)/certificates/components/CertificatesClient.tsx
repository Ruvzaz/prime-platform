'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  Download,
  Shield,
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  ExternalLink,
  LayoutTemplate,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  toggleCertificateStatus,
  adminDeleteCertificate,
  adminCreateCertificate,
  syncAndUpdateAllCertificates,
  syncSingleCertificate,
} from '@/app/actions/admin-certificate';
import { ImportCertModal } from '../../challenges/components/ImportCertModal';
import { EventTokensModal } from './EventTokensModal';
import * as XLSX from 'xlsx';

export function CertificatesClient({
  certificates,
  challenges,
  events,
  users = [],
}: {
  certificates: any[];
  challenges: any[];
  events: any[];
  users?: any[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // ALL, CHALLENGE, EVENT
  const [challengeIdFilter, setChallengeIdFilter] = useState<string>('ALL');
  const [eventIdFilter, setEventIdFilter] = useState<string>('ALL');

  // Sync state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingCertId, setSyncingCertId] = useState<string | null>(null);

  async function handleSyncAll() {
    setIsSyncingAll(true);
    try {
      const res = await syncAndUpdateAllCertificates();
      if (res.success) {
        toast.success(`อัปเดตข้อมูลและซิงก์แม่แบบใบประกาศเรียบร้อยแล้ว (${res.count} รายการ)`);
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการซิงก์ข้อมูล");
      }
    } catch (err) {
      toast.error("ไม่สามารถเชื่อมต่อระบบซิงก์ข้อมูลได้");
    } finally {
      setIsSyncingAll(false);
    }
  }

  async function handleSyncSingle(certId: string) {
    setSyncingCertId(certId);
    try {
      const res = await syncSingleCertificate(certId);
      if (res.success) {
        toast.success("อัปเดตซิงก์ข้อมูลใบประกาศนี้เรียบร้อยแล้ว");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการซิงก์");
      }
    } catch (err) {
      toast.error("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setSyncingCertId(null);
    }
  }

  // Single cert modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<'CHALLENGE' | 'EVENT'>('CHALLENGE');
  const [createUserId, setCreateUserId] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createChallengeId, setCreateChallengeId] = useState('');
  const [createEventId, setCreateEventId] = useState('');
  const [createIssueDate, setCreateIssueDate] = useState('31 สิงหาคม 2569');
  const [createLoading, setCreateLoading] = useState(false);

  // Filter logic
  const filteredCertificates = certificates.filter((cert) => {
    // Search match
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      cert.certCode.toLowerCase().includes(searchLower) ||
      cert.recipientFullName.toLowerCase().includes(searchLower) ||
      cert.email.toLowerCase().includes(searchLower) ||
      (cert.eventTitle && cert.eventTitle.toLowerCase().includes(searchLower));

    // Type match
    const matchesType = typeFilter === 'ALL' || cert.type === typeFilter;

    // Challenge ID match
    const matchesChallengeId =
      challengeIdFilter === 'ALL' || cert.challengeId === challengeIdFilter;

    // Event ID match
    const matchesEventId =
      eventIdFilter === 'ALL' || cert.eventId === eventIdFilter;

    return matchesSearch && matchesType && matchesChallengeId && matchesEventId;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, challengeIdFilter, eventIdFilter, pageSize]);

  const totalFilteredCount = filteredCertificates.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredCount);
  const paginatedCertificates = filteredCertificates.slice(startIndex, endIndex);

  // Action handlers
  async function handleToggleStatus(certId: string, currentStatus: string) {
    const res = await toggleCertificateStatus(certId, currentStatus);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Certificate ${res.newStatus === 'ACTIVE' ? 'Activated' : 'Revoked'}`);
    }
  }

  async function handleDelete(certId: string) {
    if (!confirm('Are you sure you want to delete this certificate record?')) return;
    const res = await adminDeleteCertificate(certId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Certificate deleted');
    }
  }

  async function handleCreateSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!createEmail || !createName) {
      toast.error('Please enter email and recipient name');
      return;
    }

    setCreateLoading(true);
    const res = await adminCreateCertificate({
      email: createEmail,
      recipientFullName: createName,
      type: createType,
      userId: createUserId || undefined,
      challengeId: createChallengeId || undefined,
      eventId: createEventId || undefined,
      issueDate: createIssueDate,
    });
    setCreateLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Certificate issued successfully!');
      setIsCreateOpen(false);
      setCreateUserId('');
      setCreateEmail('');
      setCreateName('');
    }
  }

  function handleExportExcel() {
    const exportRows = filteredCertificates.map((c) => ({
      "Cert Code": c.certCode,
      "Recipient Name": c.recipientFullName,
      "Email": c.email,
      "Type": c.type,
      "Event/Challenge Title": c.eventTitle,
      "Challenge ID": c.challengeId || "-",
      "Event ID": c.eventId || "-",
      "Issue Date": c.issueDate,
      "Status": c.status,
      "Issued At": new Date(c.createdAt).toLocaleString("th-TH"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates");
    XLSX.writeFile(workbook, `ecertificates_export_${Date.now()}.xlsx`);
  }

  // Summary stats
  const totalCount = certificates.length;
  const activeCount = certificates.filter((c) => c.status === 'ACTIVE').length;
  const revokedCount = certificates.filter((c) => c.status === 'REVOKED').length;
  const challengeCount = certificates.filter((c) => c.type === 'CHALLENGE').length;
  const eventCount = certificates.filter((c) => c.type === 'EVENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-500" />
            E-Certificates Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View, issue, and manage official E-Certificates for both CTF Challenges and Events by ID.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
          >
            {isSyncingAll ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <RefreshCw className="w-4 h-4 text-white" />
            )}
            <span>ซิงก์อัปเดตแม่แบบทั้งหมด (Sync All)</span>
          </Button>

          <Link href="/admin/certificates/campaigns">
            <Button variant="outline" className="gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-bold">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              แคมเปญแจกใบประกาศ (No Event)
            </Button>
          </Link>

          <Link href="/admin/certificates/templates">
            <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">
              <LayoutTemplate className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              จัดการแม่แบบ & ลากวางพิกัด (Templates Editor)
            </Button>
          </Link>
          <EventTokensModal events={events} />
          <ImportCertModal />

          {/* Issue Single Certificate Modal */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Issue Single E-Cert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card text-foreground border rounded-xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <Award className="w-5 h-5 text-amber-500" />
                  Issue Single E-Certificate
                </DialogTitle>
                <DialogDescription>
                  Manually issue an E-Certificate to a recipient by specifying Challenge/Event ID.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSingle} className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Category
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="certType"
                        checked={createType === 'CHALLENGE'}
                        onChange={() => setCreateType('CHALLENGE')}
                      />
                      <span>CTF Challenge</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="certType"
                        checked={createType === 'EVENT'}
                        onChange={() => setCreateType('EVENT')}
                      />
                      <span>Special Event</span>
                    </label>
                  </div>
                </div>

                {createType === 'CHALLENGE' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Challenge ID / Name
                    </label>
                    <Select value={createChallengeId} onValueChange={setCreateChallengeId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select CTF Challenge..." />
                      </SelectTrigger>
                      <SelectContent>
                        {challenges.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} (ID: {c.id.substring(0, 8)}...)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Event ID / Name
                    </label>
                    <Select value={createEventId} onValueChange={setCreateEventId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Special Event..." />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title} (ID: {e.id.substring(0, 8)}...)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {users.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Target User (เลือกผู้ใช้ในระบบเพื่อระบุบัญชีอัตโนมัติ)
                    </label>
                    <Select
                      value={createUserId}
                      onValueChange={(val) => {
                        setCreateUserId(val);
                        const selected = users.find((u) => u.id === val);
                        if (selected) {
                          if (selected.email) setCreateEmail(selected.email);
                          if (selected.name || selected.username) setCreateName(selected.name || selected.username);
                        }
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="-- เลือกระบุผู้ใช้ที่มีในระบบ (หรือพิมพ์เองด้านล่าง) --" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.username} ({u.email || "No Email"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recipient Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recipient Full Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="นาย สมชาย สายลับ"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Issue Date Text
                  </label>
                  <Input
                    type="text"
                    value={createIssueDate}
                    onChange={(e) => setCreateIssueDate(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Issue Certificate
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total Issued</p>
          <p className="text-2xl font-black text-foreground">{totalCount}</p>
        </div>
        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-medium text-emerald-500 uppercase">Active Certs</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-medium text-red-500 uppercase">Revoked Certs</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">{revokedCount}</p>
        </div>
        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-medium text-blue-500 uppercase">Challenge Certs</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{challengeCount}</p>
        </div>
        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-medium text-purple-500 uppercase">Event Certs</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{eventCount}</p>
        </div>
      </div>

      {/* Search & ID Filter Bar */}
      <div className="bg-card border p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Cert Code, Name, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Category Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-44 h-10">
            <SelectValue placeholder="Category Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="CHALLENGE">CTF Challenge</SelectItem>
            <SelectItem value="EVENT">Special Event</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter by Challenge ID */}
        <Select value={challengeIdFilter} onValueChange={setChallengeIdFilter}>
          <SelectTrigger className="w-full md:w-56 h-10">
            <SelectValue placeholder="Filter Challenge ID..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Challenge IDs</SelectItem>
            {challenges.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                {ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter by Event ID */}
        <Select value={eventIdFilter} onValueChange={setEventIdFilter}>
          <SelectTrigger className="w-full md:w-56 h-10">
            <SelectValue placeholder="Filter Event ID..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Event IDs</SelectItem>
            {events.map((ev) => (
              <SelectItem key={ev.id} value={ev.id}>
                {ev.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Certificates Data Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Cert Code</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Category</th>
                <th className="p-4">Target Title & ID</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {totalFilteredCount === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground font-mono">
                    No E-Certificates found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-500">
                      {cert.certCode}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{cert.recipientFullName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{cert.email}</div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={
                          cert.type === 'CHALLENGE'
                            ? 'border-blue-500/40 text-blue-500 bg-blue-500/10'
                            : 'border-purple-500/40 text-purple-500 bg-purple-500/10'
                        }
                      >
                        {cert.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-xs text-foreground max-w-xs truncate">
                        {cert.eventTitle}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {cert.challengeId ? `Challenge ID: ${cert.challengeId}` : cert.eventId ? `Event ID: ${cert.eventId}` : 'Global'}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {cert.issueDate}
                    </td>
                    <td className="p-4">
                      {cert.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-mono">
                          <XCircle className="w-3.5 h-3.5" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {/* View / Verify */}
                      <Link href={`/verify-cert/${cert.certCode}`} target="_blank">
                        <Button variant="ghost" size="icon" title="View Verification Page">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </Button>
                      </Link>

                      {/* Sync Single Certificate */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSyncSingle(cert.id)}
                        disabled={syncingCertId === cert.id}
                        title="Sync & Repair Certificate Linkage & Purge Cache"
                      >
                        {syncingCertId === cert.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-emerald-500" />
                        )}
                      </Button>

                      {/* Toggle Status */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(cert.id, cert.status)}
                        title={cert.status === 'ACTIVE' ? 'Revoke Certificate' : 'Activate Certificate'}
                      >
                        {cert.status === 'ACTIVE' ? (
                          <XCircle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cert.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete Certificate Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalFilteredCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/20 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                แสดง <strong className="text-foreground">{startIndex + 1}</strong> - <strong className="text-foreground">{endIndex}</strong> จากทั้งหมด <strong className="text-amber-500 font-bold">{totalFilteredCount}</strong> รายการ
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-muted-foreground">ต่อหน้า:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-background border border-input rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <span className="px-2">
                หน้า <strong className="text-foreground">{currentPage}</strong> / <strong className="text-foreground">{totalPages}</strong>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
