"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Download, Filter, Search, MoreHorizontal, ChevronLeft, ChevronRight, Copy, Pencil, Trash2, AlertCircle } from "lucide-react"
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
  const currentQuery = searchParams.get("q") || ""
  const currentSortBy = searchParams.get("sortBy") || "createdAt"
  const currentSortOrder = searchParams.get("sortOrder") || "desc"

  // Local State for input (debounced update)
  const [searchTerm, setSearchTerm] = useState(currentQuery)
  const debouncedSearchTerm = useDebounceValue(searchTerm, 2000)

  // Edit State
  const [editingRegistration, setEditingRegistration] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

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
         router.refresh()
      } else {
         alert(res.message)
      }
    } catch (e) {
      alert("Failed to delete registrations")
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

  const exportCSV = async () => {
      setIsExporting(true)
      try {
          // Dynamically import to avoid server-side issues if needed, or just call the action
          const { getRegistrationsForExport } = await import("@/app/actions/registration")
          const allData = await getRegistrationsForExport(currentEventId, currentQuery)
          
          if (allData.length === 0) {
            alert("No data to export.")
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

          // 2. Identify global check-in dates to define Day 1 and Day 2
          const allCheckInDates = new Set<string>()
          ;(allData as any[]).forEach((reg: any) => {
              reg.checkIns?.forEach((ci: any) => {
                  allCheckInDates.add(new Date(ci.scannedAt).toLocaleDateString())
              })
          })
          
          const sortedGlobalDates = Array.from(allCheckInDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          const dayHeaders = sortedGlobalDates.map((_, i) => `Check In Day ${i + 1}`)

          const headers = ["Ref Code", "Name", "Email", "Phone", "Event", "Status", "Date", ...dayHeaders, ...customHeaders]
          
          const rows = (allData as any[]).map((reg: any) => {
              const { name, email, phone } = extractAttendeeInfo(reg.formData as Record<string, unknown>, reg.event.formFields)
              const formData = reg.formData as Record<string, unknown> || {}
              
              const dayCols = sortedGlobalDates.map(dateStr => {
                  const ci = reg.checkIns?.find((ci: any) => new Date(ci.scannedAt).toLocaleDateString() === dateStr)
                  return ci ? `"${new Date(ci.scannedAt).toLocaleString()}"` : '""'
              })

              const standardCols = [
                  reg.referenceCode,
                  `"${name}"`, 
                  email,
                  phone || "",
                  `"${reg.event.title}"`,
                  reg.status,
                  `"${new Date(reg.createdAt).toLocaleDateString()}"`,
                  ...dayCols
              ]

              // Dynamic Fields
              const dynamicCols = customHeaders.map(header => {
                  const field = (reg.event.formFields as any[])?.find((f: any) => f.label === header)
                  let val = formData[header]
                  if (val === undefined && field) {
                      val = formData[field.id]
                  }
                  
                  if (val === undefined || val === null) return ""
                  if (Array.isArray(val)) return `"${val.join(', ').replace(/"/g, '""')}"`
                  if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"` // Escape quotes
                  return `"${val}"`
              })

              return [...standardCols, ...dynamicCols].join(',')
          })
          
          const title = currentEventId !== "all" 
            ? `registrations-${currentEventId}` 
            : "registrations-all"
            
          const csv = [headers.join(','), ...rows].join('\n')
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${title}-${new Date().toISOString().slice(0,10)}.csv`
          a.click()
          URL.revokeObjectURL(url)
      } catch (error) {
          console.error("Export failed", error)
          alert("Failed to export data. Please try again.")
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
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                
                <div className="hidden sm:flex items-center justify-center text-sm font-bold bg-white dark:bg-slate-800 px-5 h-11 rounded-xl border border-border/50 shadow-sm">
                    Total: <span className="text-primary ml-1.5">{metadata.total.toLocaleString()}</span>
                </div>

                <Button variant="outline" className="rounded-xl h-11 px-6 border-border/60 hover:bg-slate-50 shadow-sm" onClick={exportCSV} disabled={isExporting}>
                    <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                    {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
            </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b-border/40">
                        <TableHead className="w-[60px] px-8">
                            <Checkbox 
                                checked={initialData.length > 0 && selectedIds.length === initialData.length}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                                className="rounded-md"
                            />
                        </TableHead>
                        <TableHead 
                            className="min-w-[150px] cursor-pointer hover:bg-slate-100/50 transition-colors"
                            onClick={() => toggleSort("referenceCode")}
                        >
                            <div className="flex items-center">
                                Ref Code <SortIcon field="referenceCode" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[200px]">Attendee</TableHead>
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
                        initialData.map((reg) => {
                            const { name, email } = extractAttendeeInfo(reg.formData as Record<string, unknown>, reg.event.formFields)
                            return (
                                <TableRow key={reg.id} className="group hover:bg-slate-50/50 border-b-border/30" data-state={selectedIds.includes(reg.id) && "selected"}>
                                    <TableCell className="px-8">
                                        <Checkbox 
                                            checked={selectedIds.includes(reg.id)}
                                            onCheckedChange={() => toggleSelect(reg.id)}
                                            aria-label="Select row"
                                            className="rounded-md"
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs font-bold text-slate-500">{reg.referenceCode}</TableCell>
                                    <TableCell>
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
                                            <div className="flex flex-col gap-1">
                                                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-100 border-none shadow-sm rounded-full px-3 py-0.5 font-bold text-[10px] w-fit">
                                                    Checked In ({reg.checkIns.length})
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground font-bold tracking-tight px-1">
                                                    Latest: {new Date(reg.checkIns[reg.checkIns.length - 1].scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
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
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between p-6 px-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-border/40">
            <div className="text-sm font-bold text-muted-foreground bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-border/40">
                Page <span className="text-primary">{metadata.page}</span> of <span className="text-primary">{metadata.totalPages}</span>
            </div>
            <div className="flex gap-3">
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



        <RegistrationEditSheet 
            registration={editingRegistration} 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
        />
    </div>
  )
}
