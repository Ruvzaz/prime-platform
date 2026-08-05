"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, Users, Trash2, MoreHorizontal, BarChart3, Radio, Pencil, Globe, AlertCircle, AlertTriangle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
import { deleteEvents, toggleEventStatus } from "@/app/actions/events"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"

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
  const [togglingId, setTogglingId] = useState<string | null>(null)
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

  const handleToggleStatus = async (eventId: string, currentStatus: boolean) => {
    setTogglingId(eventId)
    await toggleEventStatus(eventId, currentStatus)
    setTogglingId(null)
    router.refresh()
  }

  return (
    <>
    <div className="relative">
      {/* FLOATING ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 duration-500 border border-white/10 backdrop-blur-xl bg-opacity-90">
            <span className="font-bold text-sm tracking-wide">{selectedIds.length} items selected</span>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex gap-2">
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => openDeleteDialog(selectedIds)} 
                    disabled={isDeleting}
                    className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-destructive/20"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedIds([])}
                    className="text-white hover:bg-white/10 rounded-xl h-10 px-6 font-bold"
                >
                    Cancel
                </Button>
            </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b-border/40">
            <TableHead className="w-[60px] px-8">
                <Checkbox 
                    checked={selectedIds.length === initialEvents.length && initialEvents.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="rounded-md"
                />
            </TableHead>
            <TableHead>Event Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Registrations</TableHead>
            <TableHead className="text-right px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-32 text-muted-foreground bg-slate-50/10">
                <div className="flex flex-col items-center gap-3">
                    <Calendar className="w-12 h-12 opacity-10" />
                    <p className="text-base font-medium">No events found</p>
                    <p className="text-sm opacity-70">Get started by creating your first event.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            initialEvents.map((event) => (
              <TableRow key={event.id} className="group hover:bg-slate-50/50 border-b-border/30" data-state={selectedIds.includes(event.id) ? "selected" : undefined}>
                <TableCell className="px-8">
                    <Checkbox 
                        checked={selectedIds.includes(event.id)}
                        onCheckedChange={() => toggleSelect(event.id)}
                        className="rounded-md"
                    />
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-white">
                  <div className="flex flex-col">
                    <span className="text-sm">{event.title}</span>
                    <span className="text-[10px] font-black text-primary/50 uppercase tracking-tighter">/{event.slug}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={event.isActive}
                      disabled={togglingId === event.id}
                      onCheckedChange={() => handleToggleStatus(event.id, event.isActive)}
                      className="data-[state=checked]:bg-emerald-500 shadow-sm"
                    />
                    <Badge variant="outline" className={`
                        rounded-full px-3 py-0.5 border-none shadow-sm font-bold text-[10px]
                        ${event.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}
                    `}>
                        {event.isActive ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 opacity-40" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 opacity-40" />
                    {event.location || "Online"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end font-bold text-slate-900 dark:text-white">
                    <Users className="mr-2 h-4 w-4 text-primary opacity-50" />
                    {event._count?.registrations || 0}
                  </div>
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
                        <DropdownMenuItem className="rounded-lg" asChild>
                          <Link href={`/admin/events/${event.slug}/dashboard`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg" asChild>
                            <Link href={`/live/${event.slug}`} target="_blank">
                                <Radio className="mr-2 h-4 w-4" />
                                Live View
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg" asChild>
                            <Link href={`/admin/events/${event.slug}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Event
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg" asChild>
                            <Link href={`/admin/events/${event.slug}/live`}>
                                <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />
                                Live Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg" asChild>
                             <Link href={`/events/${event.slug}`} target="_blank">
                                <Globe className="mr-2 h-4 w-4" />
                                Public Page
                             </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-rose-600 focus:text-rose-600 rounded-lg"
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
