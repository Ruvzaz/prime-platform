'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ImportTeamsModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel or CSV file');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import-teams', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to import teams');
        if (data.details) {
          setResult({ error: data.error, details: data.details });
        }
      } else {
        toast.success(`Successfully imported ${data.createdTeamsCount} teams and ${data.addedMembersCount} members!`);
        setResult(data);
        router.refresh();
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred during import');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
          <Upload className="w-4 h-4" />
          Import Teams (Excel)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-card text-foreground border rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Bulk Import Teams & Members
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx / .xls) or CSV file to automatically create teams and assign members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Step 1: Download Template */}
          <div className="p-4 rounded-lg bg-muted/40 border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">1. Download Template File</h4>
                <p className="text-xs text-muted-foreground">
                  Get pre-formatted sample Excel with correct headers.
                </p>
              </div>
              <a href="/api/admin/import-teams/template" download>
                <Button size="sm" variant="secondary" className="gap-2 shrink-0">
                  <Download className="w-4 h-4" />
                  Download .xlsx
                </Button>
              </a>
            </div>
          </div>

          {/* Step 2: Choose File */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">2. Choose Excel/CSV File</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="bulk-team-file-input"
              />
              <label htmlFor="bulk-team-file-input" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground opacity-60" />
                {file ? (
                  <span className="font-semibold text-sm text-primary">{file.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium">Click to select or drag & drop</span>
                    <span className="text-xs text-muted-foreground">Supports .xlsx, .xls, .csv</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Import Result Banner */}
          {result && result.success && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Import Complete!
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-500/20 text-center">
                <div>
                  <span className="block font-bold text-base">{result.createdTeamsCount}</span>
                  <span className="text-[10px] text-muted-foreground">Teams Created</span>
                </div>
                <div>
                  <span className="block font-bold text-base">{result.createdUsersCount}</span>
                  <span className="text-[10px] text-muted-foreground">New Users</span>
                </div>
                <div>
                  <span className="block font-bold text-base">{result.addedMembersCount}</span>
                  <span className="text-[10px] text-muted-foreground">Members Added</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {result && result.details && result.details.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 space-y-2 text-xs max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                Warnings / Errors ({result.details.length}):
              </div>
              <ul className="list-disc list-inside space-y-1 font-mono">
                {result.details.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Close
            </Button>
            <Button onClick={handleUpload} disabled={!file || loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Start Bulk Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
