"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Pencil, FileIcon, ExternalLink, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { getRegistrations } from "@/app/actions/registration"
import { RegistrationEditSheet } from "./registration-edit-sheet"
import { Badge } from "@/components/ui/badge"
import { extractAttendeeInfo, getStandardFieldIds } from "@/lib/attendee-utils"

interface Event {
    id: string
    title: string
    slug: string
    formFields: any[]
}

interface ResponseDataTableProps {
    initialEvents: Event[]
}

// Debounce hook
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

export function ResponseDataTable({ initialEvents }: ResponseDataTableProps) {
    const [selectedEventId, setSelectedEventId] = useState<string>(initialEvents[0]?.id || "")

    const [isLoading, setIsLoading] = useState(false)
    const [registrations, setRegistrations] = useState<any[]>([])
    const [metadata, setMetadata] = useState<any>({ total: 0, page: 1, pageSize: 50, totalPages: 0 })
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    
    const debouncedSearchTerm = useDebounceValue(searchTerm, 2000)
    
    const [editingRegistration, setEditingRegistration] = useState<any>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const selectedEvent = initialEvents.find(e => e.id === selectedEventId)

    useEffect(() => {
        if (selectedEventId) {
            setCurrentPage(1)
        }
    }, [selectedEventId, debouncedSearchTerm])

    useEffect(() => {
        if (selectedEventId) {
            fetchData()
        }
    }, [selectedEventId, debouncedSearchTerm, sortBy, sortOrder, currentPage])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const result = await getRegistrations(selectedEventId, currentPage, 50, debouncedSearchTerm, sortBy, sortOrder)
            setRegistrations(result.data)
            setMetadata(result.metadata)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (reg: any) => {
        setEditingRegistration(reg)
        setIsEditOpen(true)
    }

    const rawCustomFields = selectedEvent?.formFields || []
    const standardFieldIds = getStandardFieldIds(rawCustomFields)
    const customFields = rawCustomFields.filter((f: any) => !standardFieldIds.includes(f.id))

    return (
        <div className="space-y-0">
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center transition-all p-6 px-6 sm:px-8 bg-white dark:bg-slate-900 border-b border-border/50">
                 <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
                     <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search responses..." 
                            className="pl-10 h-11 w-full rounded-xl bg-slate-50 border-none shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="w-full sm:w-[280px] h-11 rounded-xl bg-slate-50 border-none shadow-none focus:ring-1 focus:ring-primary/20 transition-all font-bold">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select Event" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            {initialEvents.map((event) => (
                                <SelectItem key={event.id} value={event.id} className="rounded-lg">
                                    {event.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <Button 
                    variant="outline" 
                    className="rounded-xl h-11 px-6 border-border/60 hover:bg-slate-50 shadow-sm font-bold"
                    disabled={isLoading} 
                    onClick={fetchData}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* DATA TABLE */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b-border/40">
                            <TableHead 
                                className="w-[150px] px-8 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                onClick={() => {
                                    if (sortBy === "referenceCode") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                                    else { setSortBy("referenceCode"); setSortOrder("asc"); }
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    Ref Code {sortBy === "referenceCode" && (sortOrder === "asc" ? "↑" : "↓")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[200px]">Attendee</TableHead>
                            <TableHead 
                                className="min-w-[140px] cursor-pointer hover:bg-slate-100/50 transition-colors"
                                onClick={() => {
                                    if (sortBy === "createdAt") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                                    else { setSortBy("createdAt"); setSortOrder("desc"); }
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    Submitted {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                                </div>
                            </TableHead>
                            <TableHead className="w-[120px]">Check-in</TableHead>
                            {customFields.map((field: any) => (
                                <TableHead key={field.id} className="min-w-[150px] w-[200px]">
                                    {field.label}
                                </TableHead>
                            ))}
                            <TableHead className="text-right px-8 w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={10 + customFields.length} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full border-4 border-indigo-50 dark:border-indigo-900 animate-pulse"></div>
                                            <RefreshCw className="absolute top-0 left-0 w-12 h-12 text-primary animate-spin" />
                                        </div>
                                        <p className="text-muted-foreground font-bold animate-pulse">Fetching responses...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10 + customFields.length} className="h-64 text-center text-muted-foreground bg-slate-50/10">
                                    <div className="flex flex-col items-center gap-3">
                                        <AlertCircle className="w-12 h-12 opacity-10" />
                                        <p className="text-lg font-bold">No responses found</p>
                                        <p className="text-sm opacity-70">No submissions have been recorded for this event yet.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => {
                                const { name, email } = extractAttendeeInfo(reg.formData, selectedEvent?.formFields)
                                return (
                                <TableRow key={reg.id} className="group hover:bg-slate-50/50 border-b-border/30">
                                    <TableCell className="px-8 font-mono text-xs font-bold text-slate-500">
                                        {reg.referenceCode}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                                            <span className="text-xs text-muted-foreground font-medium">{email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                                        {new Date(reg.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {reg.checkIn ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-100 border-none shadow-sm rounded-full px-3 py-0.5 font-bold text-[10px] w-fit">
                                                    Checked In
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground font-bold tracking-tight px-1">
                                                    {new Date(reg.checkIn.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/40 font-bold ml-4">—</span>
                                        )}
                                    </TableCell>
                                    {customFields.map((field: any) => {
                                        const val = (reg.formData as any)?.[field.label] || (reg.formData as any)?.[field.id]
                                        let displayContent: React.ReactNode = <span className="text-muted-foreground/30">—</span>
                                        if (val) {
                                            if (field.type === "FILE" && typeof val === "string") {
                                                displayContent = (
                                                    <a href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 whitespace-nowrap active:scale-95">
                                                        <FileIcon className="w-3.5 h-3.5" />
                                                        <span>VIEW FILE</span>
                                                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                                                    </a>
                                                )
                                            } else {
                                                const displayVal = Array.isArray(val) ? val.join(", ") : val
                                                displayContent = <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{displayVal}</span>
                                            }
                                        }
                                        return (
                                            <TableCell 
                                                key={`${reg.id}-${field.id}`} 
                                                className="max-w-[200px] truncate" 
                                                title={typeof val === 'string' ? val : ''}
                                            >
                                                {displayContent}
                                            </TableCell>
                                        )
                                    })}
                                    <TableCell className="text-right px-8">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(reg)} className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <Pencil className="h-5 w-5 text-slate-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-6 px-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-border/40">
                <div className="text-sm font-bold text-muted-foreground bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-border/40">
                    Showing <span className="text-primary">{registrations.length}</span> of <span className="text-primary">{metadata.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="default"
                        className="rounded-xl h-10 px-6 border-border/50 bg-white hover:bg-slate-50 transition-all font-bold shadow-sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <div className="text-sm font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-border/40">
                        Page {currentPage} / {metadata.totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="default"
                        className="rounded-xl h-10 px-6 border-border/50 bg-white hover:bg-slate-50 transition-all font-bold shadow-sm"
                        onClick={() => setCurrentPage(prev => Math.min(metadata.totalPages, prev + 1))}
                        disabled={currentPage >= metadata.totalPages || isLoading}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>

            <div className="p-6 bg-slate-50/30 dark:bg-slate-800/10 text-center border-t border-border/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                    Use search to filter across all records • Results are real-time
                </p>
            </div>

            <RegistrationEditSheet 
                registration={editingRegistration} 
                open={isEditOpen} 
                onOpenChange={(open) => {
                    setIsEditOpen(open)
                    if (!open) fetchData()
                }} 
            />
        </div>
    )
}
