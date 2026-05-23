"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Download, Filter, Search, MoreHorizontal, ChevronLeft, ChevronRight, Copy, Pencil, Trash2, AlertCircle, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RegistrationEditSheet } from "@/components/admin/registration-edit-sheet"
import { extractAttendeeInfo, getStandardFieldIds } from "@/lib/attendee-utils"
import { deleteRegistrations } from "@/app/actions/registration"

// Simple debounce hook if not exists, for now implementing inline logic or using timeout
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface Registration {
  id: string
  referenceCode: string
  status: string
  createdAt: Date
  formData: any
  checkIns: {
      scannedAt: Date
  }[]
  event: {
      title: string
      slug: string
      formFields: { id: string; label: string; type: string }[]
  }
}

interface Event {
    id: string
    title: string
}

interface PaginationMetadata {
    total: number
    page: number
    pageSize: number
    totalPages: number
}

interface RegistrationsTableProps {
  initialData: Registration[]
  metadata: PaginationMetadata
  events: Event[]
}

export function RegistrationsTable({ initialData, metadata, events }: RegistrationsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URL State
  const currentEventId = searchParams.get("eventId") || "all"
  const currentPage = Number(searchParams.get("page")) || 1
  const currentPageSize = Number(searchParams.get("pageSize")) || 10
  const currentQuery = searchParams.get("q") || ""
  const currentSortBy = searchParams.get("sortBy") || "createdAt"
  const currentSortOrder = searchParams.get("sortOrder") || "desc"

  // Local State for input (debounced update)
  const [searchTerm, setSearchTerm] = useState(currentQuery)
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000) // Reduced to 1s for better UX
  const isSearching = searchTerm !== currentQuery

  // Edit State
  const [editingRegistration, setEditingRegistration] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [jumpPage, setJumpPage] = useState(String(currentPage))

  useEffect(() => {
    setJumpPage(String(currentPage))
  }, [currentPage])

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)

  const toggleSelectAll = () => {
    if (selectedIds.length === initialData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(initialData.map(r => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    setIsDeleting(true)
    try {
      const res = await deleteRegistrations(selectedIds)
      if (res.message.includes("successfully")) {
         setSelectedIds([])
         toast.success("Registrations deleted successfully")
         router.refresh()
      } else {
         toast.error(res.message)
      }
    } catch (e) {
      toast.error("Failed to delete registrations")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSingle = async () => {
    if (!singleDeleteId) return;
    setIsDeleting(true)
    try {
      const res = await deleteRegistrations([singleDeleteId])
      if (res.message.includes("successfully")) {
         setSingleDeleteId(null)
         toast.success("Registration deleted successfully")
         router.refresh()
      } else {
         toast.error(res.message)
      }
    } catch (e) {
      toast.error("Failed to delete registration")
    } finally {
      setIsDeleting(false)
    }
  }

  // Update URL function
  const updateUrl = (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === "") {
              params.delete(key)
          } else {
              params.set(key, String(value))
          }
      })
      router.push(`${pathname}?${params.toString()}`)
  }

  // Effect to sync search term to URL
  useEffect(() => {
      if (debouncedSearchTerm !== currentQuery) {
          updateUrl({ q: debouncedSearchTerm, page: 1 }) // Reset to page 1 on search
      }
  }, [debouncedSearchTerm])

  const handleEventChange = (value: string) => {
      updateUrl({ eventId: value, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
      updateUrl({ page: newPage })
  }

  const toggleSort = (field: string) => {
    if (currentSortBy === field) {
        updateUrl({ sortOrder: currentSortOrder === "asc" ? "desc" : "asc", page: 1 })
    } else {
        updateUrl({ sortBy: field, sortOrder: "asc", page: 1 })
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (currentSortBy !== field) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return currentSortOrder === "asc" 
        ? <ChevronLeft className="w-3 h-3 ml-1 rotate-90" /> 
        : <ChevronLeft className="w-3 h-3 ml-1 -rotate-90" />;
  }

  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = async () => {
      setIsExporting(true)
      try {
          // Dynamically import to avoid server-side issues if needed, or just call the action
          const { getRegistrationsForExport } = await import("@/app/actions/registration")
          const allData = await getRegistrationsForExport(currentEventId, currentQuery)
          
          if (allData.length === 0) {
            toast.error("No data to export.")
            return
          }

          // 1. Determine Dynamic Headers
          // We look at the first record's event fields if available (single event export)
          // OR we collect all unique keys from formData if mixed events (fallback/advanced)
          // For simplicity and user requirement "Adjust according to project theme/questions", 
          // we use the event's defined form fields if they exist in the return data.
          
          let customHeaders: string[] = []
          
          // Strategy: Collect unique labels from all events in the dataset to handle "All Events" export too
          const uniqueLabels = new Set<string>()
          const allStandardIds = new Set<string>();
          
          ;(allData as any[]).forEach((reg: any) => {
              const eventData = reg.event as any;
              if (eventData?.formFields) {
                  const stdIds = getStandardFieldIds(eventData.formFields)
                  stdIds.forEach(id => allStandardIds.add(id))
                  eventData.formFields.forEach((f: any) => {
                      if (!stdIds.includes(f.id)) {
                          uniqueLabels.add(f.label)
                      }
                  })
              }
          })
          customHeaders = Array.from(uniqueLabels).sort()

          // 2. Identify global check-in sessions
          const PREDEFINED_SESSIONS = [
            "Day 1 - Morning",
            "Day 1 - Afternoon",
            "Day 2 - Morning",
            "Day 2 - Afternoon"
          ];
          const allCheckInSessions = new Set<string>(PREDEFINED_SESSIONS)
          ;(allData as any[]).forEach((reg: any) => {
              reg.checkIns?.forEach((ci: any) => {
                  allCheckInSessions.add(ci.sessionTitle || new Date(ci.scannedAt).toLocaleDateString())
              })
          })
          
          // Custom sort to keep predefined sessions in order, then others
          const sortedSessions = Array.from(allCheckInSessions).sort((a, b) => {
              const idxA = PREDEFINED_SESSIONS.indexOf(a);
              const idxB = PREDEFINED_SESSIONS.indexOf(b);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return a.localeCompare(b);
          });
          const sessionHeaders = sortedSessions.map(session => `Check In (${session})`)

          const headers = ["Ref Code", "Name", "Email", "Phone", "Event", "Status", "Date", ...sessionHeaders, ...customHeaders]
          
          const rows = (allData as any[]).map((reg: any) => {
              const { name, email, phone } = extractAttendeeInfo(reg.formData as Record<string, unknown>, reg.event.formFields)
              const formData = reg.formData as Record<string, unknown> || {}
              
              const sessionCols = sortedSessions.map(session => {
                  const ci = reg.checkIns?.find((ci: any) => (ci.sessionTitle || new Date(ci.scannedAt).toLocaleDateString()) === session)
                  return ci ? new Date(ci.scannedAt).toLocaleString() : ''
              })

              const standardCols = [
                  reg.referenceCode,
                  name, 
                  email,
                  phone || "",
                  reg.event.title,
                  reg.status,
                  new Date(reg.createdAt).toLocaleDateString(),
                  ...sessionCols
              ]

              // Dynamic Fields
              const dynamicCols = customHeaders.map(header => {
                  const field = (reg.event.formFields as any[])?.find((f: any) => f.label === header)
                  let val = formData[header]
                  if (val === undefined && field) {
                      val = formData[field.id]
                  }
                  
                  if (val === undefined || val === null) return ""
                  if (Array.isArray(val)) return val.join(', ')
                  return val
              })

              return [...standardCols, ...dynamicCols]
          })
          
          const title = currentEventId !== "all" 
            ? `registrations-${currentEventId}` 
            : "registrations-all"
            
          const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
          const workbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations")
          XLSX.writeFile(workbook, `${title}-${new Date().toISOString().slice(0,10)}.xlsx`)
      } catch (error) {
          console.error("Export failed", error)
          toast.error("Failed to export data. Please try again.")
      } finally {
          setIsExporting(false)
      }
  }

  return (
    <div className="space-y-0">
        {/* FILTERS & EXPORT */}
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center transition-all p-6 px-8 bg-white dark:bg-slate-900 border-b border-border/50">
             <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
                 <div className="relative w-full sm:max-w-md">
                    {isSearching ? (
                        <Loader2 className="absolute left-3 top-3.5 h-4 w-4 text-primary animate-spin" />
                    ) : (
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input 
                        placeholder="Search by reference code..." 
                        className="pl-10 h-11 w-full rounded-xl bg-slate-50 border-none shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Select value={currentEventId} onValueChange={handleEventChange}>
                    <SelectTrigger className="w-full sm:w-[240px] h-11 rounded-xl bg-slate-50 border-none shadow-none focus:ring-1 focus:ring-primary/20 transition-all">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filter by Event" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
            </div>
            <div className="flex items-center gap-3">
                {selectedIds.length > 0 && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="default" className="rounded-xl h-11 px-6 shadow-lg shadow-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete ({selectedIds.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold">ยืนยันการลบข้อมูล</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm mt-2">
                                    การกระทำนี้จะลบข้อมูลผู้ลงทะเบียน <span className="text-destructive font-bold">{selectedIds.length} รายการ</span> ออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-3">
                                <AlertDialogCancel className="rounded-xl h-11 px-6">ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl h-11 px-6 shadow-lg shadow-destructive/10">
                                    {isDeleting ? "กำลังลบ..." : "ลบข้อมูลถาวร"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                )}
                
                {/* Single Delete Alert Dialog */}
                <AlertDialog open={!!singleDeleteId} onOpenChange={(open) => !open && setSingleDeleteId(null)}>
                    <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">ยืนยันการลบข้อมูล</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm mt-2">
                                การกระทำนี้จะลบข้อมูลผู้ลงทะเบียนรายการนี้ออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel className="rounded-xl h-11 px-6">ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSingle} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl h-11 px-6 shadow-lg shadow-destructive/10">
                                {isDeleting ? "กำลังลบ..." : "ลบข้อมูลถาวร"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <div className="hidden sm:flex items-center justify-center text-sm font-bold bg-white dark:bg-slate-800 px-5 h-11 rounded-xl border border-border/50 shadow-sm">
                    Total: <span className="text-primary ml-1.5">{metadata.total.toLocaleString()}</span>
                </div>

                <Button variant="outline" className="rounded-xl h-11 px-6 border-border/60 hover:bg-slate-50 shadow-sm" onClick={exportExcel} disabled={isExporting}>
                    <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                    {isExporting ? "Exporting..." : "Export Excel"}
                </Button>
            </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b-border/40">
                        <TableHead className="w-[60px] px-8 sticky left-0 z-20 bg-slate-50/90 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                            <Checkbox 
                                checked={initialData.length > 0 && selectedIds.length === initialData.length}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                                className="rounded-md"
                            />
                        </TableHead>
                        <TableHead 
                            className="w-[150px] cursor-pointer hover:bg-slate-100/50 transition-colors sticky left-[60px] z-20 bg-slate-50/90 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.1)]"
                            onClick={() => toggleSort("referenceCode")}
                        >
                            <div className="flex items-center">
                                Ref Code <SortIcon field="referenceCode" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[200px] sticky left-[210px] z-20 bg-slate-50/90 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Attendee</TableHead>
                        <TableHead className="min-w-[200px]">Event</TableHead>
                        <TableHead 
                            className="min-w-[140px] cursor-pointer hover:bg-slate-100/50 transition-colors"
                            onClick={() => toggleSort("createdAt")}
                        >
                            <div className="flex items-center">
                                Date <SortIcon field="createdAt" />
                            </div>
                        </TableHead>
                        <TableHead 
                            className="w-[120px] cursor-pointer hover:bg-slate-100/50 transition-colors"
                            onClick={() => toggleSort("status")}
                        >
                            <div className="flex items-center">
                                Status <SortIcon field="status" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[120px]">Check-in</TableHead>

                        <TableHead className="text-right px-8 w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center h-64 text-muted-foreground bg-slate-50/10">
                                <div className="flex flex-col items-center gap-3">
                                    <AlertCircle className="w-10 h-10 opacity-20" />
                                    <p className="text-lg font-medium">No registrations found</p>
                                    <p className="text-sm opacity-70">Try adjusting your filters or search terms.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        <AnimatePresence mode="popLayout">
                        {initialData.map((reg) => {
                            const { name, email } = extractAttendeeInfo(reg.formData as Record<string, unknown>, reg.event.formFields)
                            return (
                                <motion.tr 
                                    key={reg.id} 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="group hover:bg-slate-50/50 border-b-border/30 hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors" 
                                    data-state={selectedIds.includes(reg.id) && "selected"}
                                >
                                    <TableCell className="px-8 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                                        <Checkbox 
                                            checked={selectedIds.includes(reg.id)}
                                            onCheckedChange={() => toggleSelect(reg.id)}
                                            aria-label="Select row"
                                            className="rounded-md"
                                        />
                                    </TableCell>
                                    <TableCell className="w-[150px] font-mono text-xs font-bold text-slate-500 sticky left-[60px] z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">{reg.referenceCode}</TableCell>
                                    <TableCell className="sticky left-[210px] z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                                            <span className="text-xs text-muted-foreground font-medium">{email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{reg.event.title}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-400 font-medium">{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`
                                            rounded-full px-3 py-0.5 border-none shadow-sm font-bold text-[10px]
                                            ${reg.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                                            ${reg.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                                            ${reg.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : ''}
                                        `}>
                                            {reg.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {reg.checkIns?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {reg.checkIns.map((ci: any, idx: number) => (
                                                  <Badge key={ci.id || `ci-${idx}`} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-100 border-none shadow-sm rounded-full px-2 py-0.5 font-bold text-[9px] w-fit truncate max-w-[140px]" title={new Date(ci.scannedAt).toLocaleString()}>
                                                      {ci.sessionTitle || "Checked In"}
                                                  </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/40 font-bold ml-4">—</span>
                                        )}
                                    </TableCell>
                                    

                                    <TableCell className="text-right px-8">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-border/50">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem
                                            className="rounded-lg"
                                            onClick={() => {
                                              navigator.clipboard.writeText(reg.referenceCode)
                                            }}
                                          >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Ref Code
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="rounded-lg" onClick={() => {
                                              setEditingRegistration(reg)
                                              setIsEditOpen(true)
                                          }}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Registration
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator className="bg-border/50" />
                                          <DropdownMenuItem 
                                            className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10" 
                                            onClick={() => setSingleDeleteId(reg.id)}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Registration
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                </motion.tr>
                            )
                        })}
                        </AnimatePresence>
                    )}
                </TableBody>
            </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-6 px-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-border/40 gap-4">
            <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-muted-foreground bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-border/40 whitespace-nowrap">
                    Showing <span className="text-primary">{initialData.length}</span> of <span className="text-primary">{metadata.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline">Rows:</span>
                    <Select value={String(currentPageSize)} onValueChange={(v) => updateUrl({ pageSize: v, page: 1 })}>
                        <SelectTrigger className="h-10 w-[70px] rounded-xl bg-white border-border/50 shadow-sm font-bold focus:ring-primary/20">
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-xl min-w-[70px]">
                            {[10, 20, 50, 100].map(size => (
                                <SelectItem key={size} value={String(size)} className="rounded-lg">{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl shadow-sm border border-border/40 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="text-muted-foreground ml-1">Page</span>
                    <input 
                        type="text"
                        value={jumpPage}
                        onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const pageNum = parseInt(jumpPage)
                                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= metadata.totalPages) {
                                    handlePageChange(pageNum)
                                } else {
                                    setJumpPage(String(currentPage))
                                }
                            }
                        }}
                        onBlur={() => {
                            const pageNum = parseInt(jumpPage)
                            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= metadata.totalPages) {
                                handlePageChange(pageNum)
                            } else {
                                setJumpPage(String(currentPage))
                            }
                        }}
                        className="w-10 h-7 text-center bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-0 p-0 text-primary font-black"
                    />
                    <span className="text-muted-foreground mr-1">/ {metadata.totalPages || 1}</span>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="default" 
                        className="rounded-xl h-10 px-6 border-border/50 bg-white hover:bg-slate-50 transition-all font-bold shadow-sm"
                        onClick={() => handlePageChange(Math.max(1, metadata.page - 1))}
                        disabled={metadata.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <Button 
                        variant="outline" 
                        size="default" 
                        className="rounded-xl h-10 px-6 border-border/50 bg-white hover:bg-slate-50 transition-all font-bold shadow-sm"
                        onClick={() => handlePageChange(Math.min(metadata.totalPages, metadata.page + 1))}
                        disabled={metadata.page >= metadata.totalPages}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>



        <RegistrationEditSheet 
            registration={editingRegistration} 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
        />
    </div>
  )
}
