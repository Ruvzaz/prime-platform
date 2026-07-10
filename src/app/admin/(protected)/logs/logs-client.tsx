"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { FileText, Mail, QrCode, ShieldAlert, User } from "lucide-react";
import { extractAttendeeInfo } from "@/lib/attendee-utils";

interface LogsClientProps {
  initialLogs: any[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  events: any[];
  currentEventId: string;
  currentType: string;
}

export function LogsClient({ initialLogs, metadata, events, currentEventId, currentType }: LogsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleEventChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("eventId");
    } else {
      params.set("eventId", value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "REGISTRATION": return <FileText className="h-4 w-4 text-blue-500" />;
      case "EMAIL": return <Mail className="h-4 w-4 text-purple-500" />;
      case "CHECK_IN": return <QrCode className="h-4 w-4 text-green-500" />;
      default: return <ShieldAlert className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "SUCCESS": return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">SUCCESS</Badge>;
      case "FAILED": return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">FAILED</Badge>;
      default: return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select value={currentEventId} onValueChange={handleEventChange}>
          <SelectTrigger className="w-full sm:w-[300px] h-10 rounded-xl bg-background border-border/50">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50">
            <SelectItem value="all" className="rounded-lg">All Events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id} className="rounded-lg">
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl bg-background border-border/50">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50">
            <SelectItem value="all" className="rounded-lg">All Types</SelectItem>
            <SelectItem value="REGISTRATION" className="rounded-lg">Registration</SelectItem>
            <SelectItem value="EMAIL" className="rounded-lg">Email</SelectItem>
            <SelectItem value="CHECK_IN" className="rounded-lg">Check In</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none dark:bg-slate-900/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[180px] font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="min-w-[250px] font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Attendee</TableHead>
                  <TableHead className="font-semibold">Event</TableHead>
                  <TableHead className="font-semibold">Ref Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialLogs.map((log) => (
                    <TableRow key={log.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium text-xs">
                          {getLogIcon(log.type)}
                          <span>{log.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.description}
                        {log.action === "FAILED" && log.metadata?.error && (
                            <div className="mt-1 text-xs text-red-500 bg-red-500/10 p-1.5 rounded-md border border-red-500/20">
                                {log.metadata.error}
                            </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (log.registration?.formData) {
                            const info = extractAttendeeInfo(log.registration.formData as any);
                            return (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{info.name || "-"}</span>
                                <span className="text-xs text-muted-foreground">{info.email || ""}</span>
                              </div>
                            );
                          }
                          return <span className="text-muted-foreground">-</span>;
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {log.event?.title || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.registration?.referenceCode || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Basic Pagination */}
      {metadata.totalPages > 1 && (
        <div className="flex justify-between items-center py-2">
            <p className="text-sm text-muted-foreground">
                Showing {((metadata.page - 1) * metadata.pageSize) + 1} to {Math.min(metadata.page * metadata.pageSize, metadata.total)} of {metadata.total} entries
            </p>
            <div className="flex gap-2">
                <button 
                    disabled={metadata.page <= 1}
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", (metadata.page - 1).toString());
                        router.push(`${pathname}?${params.toString()}`);
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border/50 disabled:opacity-50 hover:bg-muted"
                >
                    Previous
                </button>
                <button 
                    disabled={metadata.page >= metadata.totalPages}
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", (metadata.page + 1).toString());
                        router.push(`${pathname}?${params.toString()}`);
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border/50 disabled:opacity-50 hover:bg-muted"
                >
                    Next
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
