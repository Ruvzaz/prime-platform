"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { updateRegistration, deleteCheckIn, createCheckIn } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { Trash2, AlertCircle, Save, X, User, CheckCircle2, Copy } from "lucide-react"
import { RegStatus } from "@prisma/client"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { cn } from "@/lib/utils"
import { extractAttendeeInfo } from "@/lib/attendee-utils"

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
  createdAt: Date
  formData: Record<string, any>
  checkIn: { scannedAt: Date } | null
  event: {
    title: string
    slug: string
    formFields: FormField[]
  }
}

interface RegistrationEditSheetProps {
  registration: Registration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegistrationEditSheet({ registration, open, onOpenChange }: RegistrationEditSheetProps) {
  const [status, setStatus] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, any>>({})
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

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleCheckboxChange = (key: string, option: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev[key] || []
      const currentArray = Array.isArray(current) ? current : [current].filter(Boolean)
      
      let newArray
      if (checked) {
        newArray = [...currentArray, option]
      } else {
        newArray = currentArray.filter((item: string) => item !== option)
      }
      return { ...prev, [key]: newArray }
    })
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

  const handleCreateCheckIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
        const result = await createCheckIn(registration!.id)
        if (result.success) {
            router.refresh()
            onOpenChange(false)
        } else {
            setErrorMessage(result.error || "Failed to check in.")
        }
    } catch (e) {
        console.error(e)
        setErrorMessage("An error occurred while checking in.")
    } finally {
        setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!registration) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      // Clean up formData to remove undefined/null but keep arrays intact
      const cleanedData: Record<string, any> = {}
      
      Object.entries(formData).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
              cleanedData[key] = val
          }
      })
      
      const result = await updateRegistration(registration.id, status as RegStatus, cleanedData)
      
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
  const formFields = event.formFields && event.formFields.length > 0 
    ? event.formFields 
    : [
        { id: "name", label: "Name", type: "TEXT", required: false, options: [], order: 0 },
        { id: "email", label: "Email", type: "EMAIL", required: false, options: [], order: 1 }
      ]

  const { name, email } = extractAttendeeInfo(registration.formData, event?.formFields)
  const initials = name.substring(0, 2).toUpperCase()

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full" side="right">
          
          {/* HEADER */}
          {/* HEADER */}
          <SheetHeader className="p-6 border-b bg-muted/10 space-y-4 text-left">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {initials}
                    </div>
                    <div>
                        <SheetTitle className="text-lg font-semibold leading-tight">{name}</SheetTitle>
                        <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs bg-background/50">
                    {registration.referenceCode}
                </Badge>
             </div>
             <SheetDescription className="sr-only">
                Edit registration details for {name}
             </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* CHECK-IN STATUS CARD (PREMIUM DESIGN) */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm ring-1 ring-gray-900/5 transition-all">
                {/* Decorative background elements */ }
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-5">
                    {registration.checkIn ? (
                        <>
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 shadow-inner ring-1 ring-green-100">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold tracking-tight text-green-700">Checked In</h3>
                                <p className="text-sm font-medium text-muted-foreground">
                                    at {new Date(registration.checkIn.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>

                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setResetCheckInOpen(true)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors text-xs uppercase tracking-wider h-8 px-4"
                            >
                                Undo Check-in
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 shadow-inner ring-1 ring-gray-200">
                                <User className="h-10 w-10 text-gray-400" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-gray-900">Not Checked In</h3>
                                <p className="text-sm text-muted-foreground">Ready to admit attendee</p>
                            </div>

                            <Button 
                                onClick={handleCreateCheckIn} 
                                disabled={isLoading}
                                className="w-full max-w-[200px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? "Processing..." : "Check In Now"}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Separator />

            {/* DYNAMIC FORM */}
            <div className="space-y-5">
                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Copy className="w-4 h-4" />
                    Response Data
                </h3>
                {formFields.map((field) => (
                <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm font-medium text-foreground/80">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === "TEXT" || field.type === "EMAIL" || field.type === "PHONE" || field.type === "NUMBER" ? (
                    <Input
                        id={field.id}
                        value={String(formData[field.id] || "")}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        type={field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : "text"}
                        className="bg-muted/10 focus:bg-background transition-colors"
                        autoComplete="off"
                    />
                    ) : field.type === "SELECT" ? (
                    <div className="space-y-2">
                        <Select 
                            value={String(formData[field.id] || "")} 
                            onValueChange={(val) => handleInputChange(field.id, val)}
                        >
                            <SelectTrigger id={field.id} className="bg-muted/10 focus:bg-background transition-colors">
                            <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                            {field.options.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                            {/* If the current value is completely custom and not in options, append it so the UI doesn't visually break */}
                            {(formData[field.id] && !field.options.includes(String(formData[field.id]))) && (
                                <SelectItem value={String(formData[field.id])}>
                                    {String(formData[field.id])}
                                </SelectItem>
                            )}
                            </SelectContent>
                        </Select>
                        
                        {/* Optional Input if they want to edit their custom text */}
                        {(formData[field.id] && !field.options.includes(String(formData[field.id]))) && (
                            <Input
                                value={String(formData[field.id])}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="bg-muted/10 border-dashed"
                                placeholder="แก้ไขข้อความแบบกำหนดเอง"
                            />
                        )}
                    </div>
                    ) : (field.type as string) === "RADIO" ? (
                    <div className="flex flex-col gap-2 p-3 rounded-md border bg-muted/10">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/20 p-1.5 rounded-md transition-colors">
                                <div className="relative flex items-center">
                                    <input 
                                        type="radio" 
                                        name={field.id} 
                                        checked={String(formData[field.id]) === opt}
                                        onChange={() => handleInputChange(field.id, opt)}
                                        className="peer sr-only "
                                    />
                                    <div className="w-4 h-4 border border-input rounded-full peer-checked:border-primary peer-checked:border-4 transition-all"></div>
                                </div>
                                <span className="text-foreground/90">{opt}</span>
                            </label>
                        ))}

                        {/* If the current value is completely custom and not in options, append it so the UI doesn't visually break */}
                        {(formData[field.id] && !field.options.includes(String(formData[field.id]))) && (
                            <div className="flex flex-col gap-2 p-1.5">
                                <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/20 rounded-md transition-colors">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="radio" 
                                            name={field.id} 
                                            checked={true}
                                            readOnly
                                            className="peer sr-only "
                                        />
                                        <div className="w-4 h-4 border border-input rounded-full peer-checked:border-primary peer-checked:border-4 transition-all"></div>
                                    </div>
                                    <span className="text-foreground/90">อื่นๆ (โปรดระบุ)</span>
                                </label>
                                <Input
                                    value={String(formData[field.id])}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className="bg-muted/10 border-dashed ml-7 w-auto"
                                    placeholder="แก้ไขข้อความแบบกำหนดเอง"
                                />
                            </div>
                        )}
                    </div>
                    ) : field.type === "CHECKBOX" ? (
                        <div className="flex flex-col gap-2 p-3 rounded-md border bg-muted/10">
                            {field.options.map((opt) => {
                                const currentVal = formData[field.id]
                                const isChecked = Array.isArray(currentVal) 
                                    ? currentVal.includes(opt) 
                                    : String(currentVal) === opt 
                                return (
                                    <div key={opt} className="flex items-center space-x-2 hover:bg-muted/20 p-1.5 rounded-md transition-colors">
                                        <Checkbox 
                                            id={`${field.id}-${opt}`} 
                                            checked={isChecked}
                                            onCheckedChange={(checked) => handleCheckboxChange(field.id, opt, checked as boolean)}
                                        />
                                        <Label htmlFor={`${field.id}-${opt}`} className="font-normal cursor-pointer text-foreground/90 w-full ml-2">
                                            {opt}
                                        </Label>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <Input
                            id={field.id}
                            value={String(formData[field.id] || "")}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                             className="bg-muted/10"
                        />
                    )}
                </div>
                ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t bg-background mt-auto">
             {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" />
                   {errorMessage}
                </div>
             )}

             <div className="flex items-center justify-end gap-4">
                 {/* Left side empty or status info if needed, but cleaner to just have actions on right */}
                  
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                      <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[100px]">
                         {isLoading ? (
                             <span className="flex items-center gap-2">Saving...</span>
                         ) : (
                             <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save</span>
                         )}
                      </Button>
                  </div>
             </div>
          </div>
        </SheetContent>
      </Sheet>

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
