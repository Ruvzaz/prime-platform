"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, Users, Trash2, MoreHorizontal, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteEvents } from "@/app/actions/events"
import { useRouter } from "next/navigation"

interface Event {
  id: string
  title: string
  slug: string
  isActive: boolean
  startDate: Date
  location: string | null
  _count: { registrations: number }
}

interface EventsTableProps {
  initialEvents: Event[]
}

export function EventsTable({ initialEvents }: EventsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([])
  const router = useRouter()

  const toggleSelectAll = () => {
    if (selectedIds.length === initialEvents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(initialEvents.map(e => e.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(s => s !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const openDeleteDialog = (ids: string[]) => {
    setDeleteTargetIds(ids)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    await deleteEvents(deleteTargetIds)
    setSelectedIds(prev => prev.filter(id => !deleteTargetIds.includes(id)))
    setDeleteTargetIds([])
    setIsDeleting(false)
    router.refresh()
  }

  return (
    <>
    <div className="relative">
      {/* FLOATING ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <span className="font-medium text-sm">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-background/20" />
            <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => openDeleteDialog(selectedIds)} 
                disabled={isDeleting}
                className="hover:bg-red-600"
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedIds([])}
                className="text-background hover:bg-background/20 hover:text-white"
            >
                Cancel
            </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
                <Checkbox 
                    checked={selectedIds.length === initialEvents.length && initialEvents.length > 0}
                    onCheckedChange={toggleSelectAll}
                />
            </TableHead>
            <TableHead>Event Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Registrations</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                No events found. Create your first one.
              </TableCell>
            </TableRow>
          ) : (
            initialEvents.map((event) => (
              <TableRow key={event.id} data-state={selectedIds.includes(event.id) ? "selected" : undefined}>
                <TableCell>
                    <Checkbox 
                        checked={selectedIds.includes(event.id)}
                        onCheckedChange={() => toggleSelect(event.id)}
                    />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{event.title}</span>
                    <span className="text-xs text-muted-foreground">/{event.slug}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {event.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {event.location || "Online"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    {event._count?.registrations || 0}
                  </div>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${event.slug}/dashboard`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/events/${event.id}/edit`}>Edit Event</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link href={`/events/${event.slug}`}>View Public Page</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => openDeleteDialog([event.id])}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    <DeleteConfirmDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      title="Confirm Delete Event"
      itemCount={deleteTargetIds.length}
      itemNames={deleteTargetIds.map(id => initialEvents.find(e => e.id === id)?.title || '')} 
      onConfirm={handleConfirmDelete}
    />
    </>
  )
}
