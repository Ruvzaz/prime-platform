"use client"

import { useState, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormBuilder, FormFieldConfig } from "@/components/admin/form-builder"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

interface EventFormProps {
  action: (prevState: any, payload: FormData) => Promise<any> 
  initialData?: {
    id?: string
    title: string
    description?: string | null
    slug: string
    startDate: Date
    endDate: Date
    location?: string | null
    themeColor?: string | null
    imageUrl?: string | null
    emailSubject?: string | null
    emailBody?: string | null
    emailAttachmentUrl?: string | null
    formFields: FormFieldConfig[]
  }
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isEditing ? "Update Event" : "Create Event"}
    </Button>
  )
}



export function EventForm({ action, initialData }: EventFormProps) {
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(initialData?.formFields || [])
  const isEditing = !!initialData?.id
  
  // Initialize state for useActionState
  const initialState = { message: "", errors: {} };
  // @ts-ignore
  const [state, dispatch] = useActionState(action, initialState);

  // Date formatting helpers
  const formatDate = (date?: Date) => {
    if (!date) return ""
    return new Date(date).toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm for datetime-local
  }

  return (
    <form action={dispatch} className="space-y-6">
      {state?.message && (
          <div className={`p-4 rounded-md ${state.message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {state.message}
          </div>
      )}
      <input type="hidden" name="formFields" value={JSON.stringify(formFields)} />
      {isEditing && <input type="hidden" name="id" value={initialData?.id} />}
      {isEditing && initialData?.imageUrl && <input type="hidden" name="currentImageUrl" value={initialData.imageUrl} />}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={state?.errors?.title ? "text-destructive" : ""}>Event Title</Label>
              <Input id="title" name="title" required defaultValue={state?.data?.title ?? initialData?.title} placeholder="e.g. Tech Conference 2024" className={state?.errors?.title ? "border-destructive" : ""} />
              {state?.errors?.title && <p className="text-[0.8rem] font-medium text-destructive">{state.errors.title}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug" className={state?.errors?.slug ? "text-destructive" : ""}>URL Slug</Label>
              <Input id="slug" name="slug" required defaultValue={state?.data?.slug ?? initialData?.slug} placeholder="tech-conf-2024" className={state?.errors?.slug ? "border-destructive" : ""} />
              {state?.errors?.slug && <p className="text-[0.8rem] font-medium text-destructive">{state.errors.slug[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={state?.errors?.description ? "text-destructive" : ""}>Description</Label>
              <Textarea id="description" name="description" defaultValue={state?.data?.description ?? initialData?.description ?? ""} className={state?.errors?.description ? "border-destructive" : ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className={state?.errors?.startDate ? "text-destructive" : ""}>Start Date</Label>
                <Input 
                    id="startDate" 
                    name="startDate" 
                    type="datetime-local" 
                    required 
                    defaultValue={state?.data?.startDate ?? formatDate(initialData?.startDate)} 
                    className={state?.errors?.startDate ? "border-destructive" : ""}
                />
                {state?.errors?.startDate && <p className="text-[0.8rem] font-medium text-destructive">{state.errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className={state?.errors?.endDate ? "text-destructive" : ""}>End Date</Label>
                <Input 
                    id="endDate" 
                    name="endDate" 
                    type="datetime-local" 
                    required 
                    defaultValue={state?.data?.endDate ?? formatDate(initialData?.endDate)} 
                    className={state?.errors?.endDate ? "border-destructive" : ""}
                />
                 {state?.errors?.endDate && <p className="text-[0.8rem] font-medium text-destructive">{state.errors.endDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className={state?.errors?.location ? "text-destructive" : ""}>Location</Label>
              <Input id="location" name="location" defaultValue={state?.data?.location ?? initialData?.location ?? ""} placeholder="e.g. Bangkok Hall / Online" className={state?.errors?.location ? "border-destructive" : ""} />
            </div>

             <div className="space-y-2">
              <Label htmlFor="themeColor">Theme Color</Label>
              <div className="flex gap-2">
                  <Input id="themeColor" name="themeColor" type="color" className="w-12 h-10 p-1 cursor-pointer" defaultValue={state?.data?.themeColor ?? initialData?.themeColor ?? "#000000"} />
                  <Input type="text" value={state?.data?.themeColor ?? initialData?.themeColor ?? "#000000"} readOnly className="flex-1 bg-muted" />
              </div>
            </div>

             <div className="space-y-2">
              <Label htmlFor="image">Event Banner</Label>
              <Input id="image" name="image" type="file" accept="image/*" />
              {initialData?.imageUrl && (
                  <div className="mt-2 text-xs text-muted-foreground">
                      Current image: <a href={initialData.imageUrl} target="_blank" className="underline">View</a>
                  </div>
              )}
            </div>

            <hr className="my-6 border-muted" />
            
            <div className="space-y-4">
              <div className="mb-2">
                  <h3 className="text-sm font-semibold">Email Customization (Optional)</h3>
                  <p className="text-xs text-muted-foreground">Custom details for the confirmation email.</p>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="emailSubject">Custom Subject</Label>
                  <Input id="emailSubject" name="emailSubject" defaultValue={state?.data?.emailSubject ?? initialData?.emailSubject ?? ""} placeholder="e.g. Your ticket to Prime Party!" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="emailBody">Custom Body Message</Label>
                  <Textarea id="emailBody" name="emailBody" defaultValue={state?.data?.emailBody ?? initialData?.emailBody ?? ""} placeholder="Add extra details, instructions, or welcome notes here..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="emailAttachment">Email Attachment</Label>
                  <Input id="emailAttachment" name="emailAttachment" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                  {initialData?.emailAttachmentUrl && (
                      <div className="mt-2 text-xs text-muted-foreground">
                          Current attachment: <a href={initialData.emailAttachmentUrl} target="_blank" className="underline">View File</a>
                          <input type="hidden" name="currentAttachmentUrl" value={initialData.emailAttachmentUrl} />
                      </div>
                  )}
                  <p className="text-xs text-muted-foreground">Attach a PDF, Image, or Document. Max 5MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <FormBuilder onChange={setFormFields} initialFields={initialData?.formFields} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  )
}
