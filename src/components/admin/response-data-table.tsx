"use client"

import { useState, useEffect } from "react"
import { Download, Search, Filter, Pencil, FileIcon, ExternalLink, ChevronLeft } from "lucide-react"
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
    
    // Edit Sheet State
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
        // We need to pass the FULL event structure to the sheet because it uses it to render the form.
        // The registration from getRegistrations has `event` but minimal fields. 
        // We should merge or ensure the sheet has what it needs.
        // The sheet expects registration.event.formFields.
        // getRegistrations sends event object. Let's check if it includes formFields.
        // Yes, getRegistrations includes `formFields: { orderBy: { order: 'asc' } }`.
        setEditingRegistration(reg)
        setIsEditOpen(true)
    }

    // Dynamic Columns
    const rawCustomFields = selectedEvent?.formFields || []
    const standardFieldIds = getStandardFieldIds(rawCustomFields)
    const customFields = rawCustomFields.filter((f: any) => !standardFieldIds.includes(f.id))

    return (
        <div className="space-y-4">
            {/* TOOLBAR (Matched with Registrations UI) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between transition-all">
                 <div className="flex gap-2 items-center flex-1">
                     <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search data..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="w-[200px]">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Filter by Event" />
                        </SelectTrigger>
                        <SelectContent>
                            {initialEvents.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                    {event.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <Button variant="outline" disabled={isLoading} onClick={fetchData}>
                    Refresh
                </Button>
            </div>

            {/* DATA TABLE */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead 
                                className="w-[100px] cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => {
                                    if (sortBy === "referenceCode") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                                    else { setSortBy("referenceCode"); setSortOrder("asc"); }
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    Ref Code {sortBy === "referenceCode" && (sortOrder === "asc" ? "↑" : "↓")}
                                </div>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead 
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => {
                                    if (sortBy === "createdAt") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                                    else { setSortBy("createdAt"); setSortOrder("desc"); }
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    Date {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                                </div>
                            </TableHead>
                            <TableHead>Check-in</TableHead>
                            {/* Dynamic Headers */}
                            {customFields.map((field: any) => (
                                <TableHead key={field.id} className="min-w-[150px]">
                                    {field.label}
                                </TableHead>
                            ))}
                            <TableHead className="w-[100px] text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6 + customFields.length} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6 + customFields.length} className="h-24 text-center text-muted-foreground">
                                    No data found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => {
                                const { name, email } = extractAttendeeInfo(reg.formData, selectedEvent?.formFields)
                                return (
                                <TableRow key={reg.id} className="group">
                                    <TableCell className="font-mono text-xs font-medium">
                                        {reg.referenceCode}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {email}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(reg.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {reg.checkIn ? (
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                {new Date(reg.checkIn.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground/50 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    {/* Dynamic Cells */}
                                    {customFields.map((field: any) => {
                                        // Try label first (most likely), then ID
                                        const val = (reg.formData as any)?.[field.label] || (reg.formData as any)?.[field.id]
                                        
                                        let displayContent: React.ReactNode = <span className="text-muted-foreground/30">-</span>
                                        
                                        if (val) {
                                            if (field.type === "FILE" && typeof val === "string") {
                                                displayContent = (
                                                    <a 
                                                        href={val} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors whitespace-nowrap"
                                                    >
                                                        <FileIcon className="w-3.5 h-3.5" />
                                                        <span>แฟ้มแนบ</span>
                                                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                                                    </a>
                                                )
                                            } else {
                                                const displayVal = Array.isArray(val) ? val.join(", ") : val
                                                displayContent = displayVal
                                            }
                                        }

                                        return (
                                            <TableCell 
                                                key={`${reg.id}-${field.id}`} 
                                                className="text-sm max-w-[200px] truncate"
                                                title={typeof displayContent === 'string' ? displayContent : ''}
                                            >
                                                {displayContent}
                                            </TableCell>
                                        )
                                    })}
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleEdit(reg)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <span className="sr-only">Edit</span>
                                            <Pencil className="h-4 w-4" />
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
            <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
                <div className="text-xs text-muted-foreground">
                    Showing {registrations.length} of {metadata.total} responses
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1 || isLoading}
                        className="h-8 gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <div className="text-xs font-medium px-2">
                        Page {currentPage} of {metadata.totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(metadata.totalPages, prev + 1))}
                        disabled={currentPage >= metadata.totalPages || isLoading}
                        className="h-8 gap-1"
                    >
                        Next <ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                </div>
            </div>

            <div className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">
                    Use search to filter across all records. Sorting affects all pages.
                </p>
            </div>

            <RegistrationEditSheet 
                registration={editingRegistration} 
                open={isEditOpen} 
                onOpenChange={(open) => {
                    setIsEditOpen(open)
                    if (!open) fetchData() // Refresh on close
                }} 
            />
        </div>
    )
}
