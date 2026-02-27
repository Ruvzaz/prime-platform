"use client"

import { useState, useEffect } from "react"
import { Download, Search, Filter, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
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

export function ResponseDataTable({ initialEvents }: ResponseDataTableProps) {
    const [selectedEventId, setSelectedEventId] = useState<string>(initialEvents[0]?.id || "")

    const [isLoading, setIsLoading] = useState(false)
    const [registrations, setRegistrations] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    
    // Edit Sheet State
    const [editingRegistration, setEditingRegistration] = useState<any>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const selectedEvent = initialEvents.find(e => e.id === selectedEventId)

    useEffect(() => {
        if (selectedEventId) {
            fetchData()
        }
    }, [selectedEventId, searchTerm]) // Debounce search in real app, simplistic for now

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Reusing existing action, might need modification if we need strict all data?
            // getRegistrations supports searching and event filtering.
            // Note: it uses pagination by default (10 items). 
            // For a data grid, we might want more, or implement pagination control. 
            // For now, let's fetch 50 items to fill the screen.
            const result = await getRegistrations(selectedEventId, 1, 50, searchTerm)
            setRegistrations(result.data)
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
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-2">
                    {/* Event Selector */}
                    <div className="w-[300px]">
                        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select event..." />
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

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search data..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Actions */}
                <Button variant="outline" disabled={isLoading} onClick={fetchData}>
                    Refresh
                </Button>
            </div>

            {/* DATA TABLE */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[100px]">Ref Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
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
                                        // Handle arrays (Checkbox)
                                        const displayVal = Array.isArray(val) ? val.join(", ") : val
                                        return (
                                            <TableCell key={`${reg.id}-${field.id}`} className="text-sm">
                                                {displayVal || <span className="text-muted-foreground/30">-</span>}
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
            
            <div className="text-xs text-muted-foreground text-center">
                Showing top 50 results. Use search to filter.
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
