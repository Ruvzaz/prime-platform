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
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" required defaultValue={initialData?.title} placeholder="e.g. Tech Conference 2024" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" name="slug" required defaultValue={initialData?.slug} placeholder="tech-conf-2024" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={initialData?.description || ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                    id="startDate" 
                    name="startDate" 
                    type="datetime-local" 
                    required 
                    defaultValue={formatDate(initialData?.startDate)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                    id="endDate" 
                    name="endDate" 
                    type="datetime-local" 
                    required 
                    defaultValue={formatDate(initialData?.endDate)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={initialData?.location || ""} placeholder="e.g. Bangkok Hall / Online" />
            </div>

             <div className="space-y-2">
              <Label htmlFor="themeColor">Theme Color</Label>
              <div className="flex gap-2">
                  <Input id="themeColor" name="themeColor" type="color" className="w-12 h-10 p-1" defaultValue={initialData?.themeColor || "#000000"} />
                  <Input type="text" value={initialData?.themeColor || "#000000"} readOnly className="flex-1 bg-muted" />
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
