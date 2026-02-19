"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Download, Filter, Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { EditRegistrationDialog } from "@/components/admin/edit-registration-dialog"
import { extractAttendeeInfo } from "@/lib/attendee-utils"

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
  checkIn?: {
      scannedAt: Date
  } | null
  event: {
      title: string
      slug: string
      formFields: any
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

  // Local State for input (debounced update)
  const [searchTerm, setSearchTerm] = useState(currentQuery)
  const debouncedSearchTerm = useDebounceValue(searchTerm, 500)

  // Edit State
  const [editingRegistration, setEditingRegistration] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

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
          allData.forEach(reg => {
              if (reg.event.formFields) {
                  reg.event.formFields.forEach((f: any) => uniqueLabels.add(f.label))
              }
          })
          customHeaders = Array.from(uniqueLabels).sort()

          const headers = ["Ref Code", "Name", "Email", "Phone", "Event", "Status", "Date", "Check-in", ...customHeaders]
          
          const rows = allData.map(reg => {
              const { name, email, phone } = extractAttendeeInfo(reg.formData as Record<string, unknown>)
              const formData = reg.formData as Record<string, unknown> || {}
              
              // Standard Fields
              const standardCols = [
                  reg.referenceCode,
                  `"${name}"`, 
                  email,
                  phone || "",
                  `"${reg.event.title}"`,
                  reg.status,
                  new Date(reg.createdAt).toLocaleDateString(),
                  reg.checkIn ? new Date(reg.checkIn.scannedAt).toLocaleString() : ''
              ]

              // Dynamic Fields
              const dynamicCols = customHeaders.map(header => {
                  const val = formData[header]
                  if (Array.isArray(val)) return `"${val.join(', ')}"`
                  if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"` // Escape quotes
                  return val ? `"${val}"` : ""
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
    <div className="space-y-4">
        {/* FILTERS & EXPORT */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between transition-all">
             <div className="flex gap-2 items-center flex-1">
                 <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search ref code..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Select value={currentEventId} onValueChange={handleEventChange}>
                    <SelectTrigger className="w-[200px]">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filter by Event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
            </div>
            <Button variant="outline" onClick={exportCSV} disabled={isExporting}>
                <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
        </div>

        {/* TABLE */}
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ref Code</TableHead>
                        <TableHead>Attendee</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reg. Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                No registrations found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        initialData.map((reg) => {
                            const { name, email } = extractAttendeeInfo(reg.formData as Record<string, unknown>)
                            return (
                                <TableRow key={reg.id}>
                                    <TableCell className="font-mono text-xs">{reg.referenceCode}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{name}</span>
                                            <span className="text-xs text-muted-foreground">{email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{reg.event.title}</TableCell>
                                    <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`
                                            ${reg.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                            ${reg.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                            ${reg.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                        `}>
                                            {reg.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {reg.checkIn ? (
                                            <div className="flex flex-col">
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 w-fit">
                                                    Checked In
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground mt-1">
                                                    {new Date(reg.checkIn.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              navigator.clipboard.writeText(reg.referenceCode)
                                            }}
                                          >
                                            Copy Ref Code
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                              setEditingRegistration(reg)
                                              setIsEditOpen(true)
                                          }}>
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
        <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Page {metadata.page} of {metadata.totalPages} ({metadata.total} total)
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(Math.max(1, metadata.page - 1))}
                    disabled={metadata.page <= 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(Math.min(metadata.totalPages, metadata.page + 1))}
                    disabled={metadata.page >= metadata.totalPages}
                >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>

        <EditRegistrationDialog 
            registration={editingRegistration} 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
        />
    </div>
  )
}
