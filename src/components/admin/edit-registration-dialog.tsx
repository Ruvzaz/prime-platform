"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateRegistration, deleteCheckIn } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { Trash2, AlertCircle } from "lucide-react"
import { RegStatus } from "@prisma/client"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"

interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  options: string[]
  order: number
}

interface Registration {
  id: string
  referenceCode: string
  status: RegStatus
  formData: Record<string, string>
  checkIn: { scannedAt: Date } | null
  event: {
    title: string
    slug: string
    formFields: FormField[]
  }
}

interface EditRegistrationDialogProps {
  registration: Registration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRegistrationDialog({ registration, open, onOpenChange }: EditRegistrationDialogProps) {
  const [status, setStatus] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [resetCheckInOpen, setResetCheckInOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (registration) {
      setStatus(registration.status)
      setFormData(registration.formData || {})
    }
  }, [registration])

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleResetCheckIn = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
          const result = await deleteCheckIn(registration!.id)
          if (result.success) {
              router.refresh()
              onOpenChange(false)
          } else {
              setErrorMessage("Failed to reset check-in status.")
          }
      } catch (e) {
            console.error(e)
            setErrorMessage("An error occurred while resetting check-in.")
      } finally {
          setIsLoading(false)
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registration) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const result = await updateRegistration(registration!.id, status as RegStatus, formData)
      if (result.success) {
        onOpenChange(false)
        router.refresh()
      } else {
        setErrorMessage("Failed to update registration.")
      }
    } catch (error) {
      console.error(error)
      setErrorMessage("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!registration) return null

  const event = registration.event
  const formFields = event.formFields || []
  // Check if we should show default fields (if no custom fields defined)
  const showDefaultFields = formFields.length === 0

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Registration</DialogTitle>
          <DialogDescription>
            Update registration status and details for {registration.referenceCode}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showDefaultFields ? (
             <>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="field_default_name" className="text-right">Name</Label>
                    <Input
                        id="field_default_name"
                        value={String(formData["name"] || formData["field_default_name"] || "")}
                        onChange={(e) => handleInputChange("name", e.target.value)} // Saving as "name" for consistency with action
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="field_default_email" className="text-right">Email</Label>
                    <Input
                        id="field_default_email"
                        value={String(formData["email"] || formData["field_default_email"] || "")}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="col-span-3"
                    />
                </div>
             </>
          ) : (
            formFields.map((field: any) => (
               <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field.id} className="text-right">
                      {field.label}
                  </Label>
                  <div className="col-span-3">
                       {/* Simplified rendering for now - mostly Text inputs */}
                       {/* Check field type if needed, but Input usually works for Text/Email/Phone/Number */}
                       <Input 
                            id={field.id}
                            value={String(formData[field.id] || "")}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                       />
                  </div>
               </div>
            ))
          )}

          {/* Error banner */}
          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {registration.checkIn && (
                 <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => setResetCheckInOpen(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                 >
                    <Trash2 className="w-4 h-4" />
                    Reset Check-in
                 </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <DeleteConfirmDialog
      open={resetCheckInOpen}
      onOpenChange={setResetCheckInOpen}
      title="Reset Check-in Status"
      description="Are you sure you want to reset the check-in status? This will allow the attendee to check in again."
      variant="warning"
      onConfirm={handleResetCheckIn}
    />
    </>
  )
}
