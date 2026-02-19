"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createEvent } from "@/app/actions/events"
import { FormBuilder, FormFieldConfig } from "@/components/admin/form-builder"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Event"
      )}
    </Button>
  )
}

export default function NewEventPage() {
  const [state, formAction] = useActionState(createEvent, null)
  const [formFields, setFormFields] = useState<FormFieldConfig[]>([])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create New Event</h2>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="formFields" value={JSON.stringify(formFields)} />
        
        {state?.message && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {state.message}
            </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN - BASIC INFO */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>
                        Basic information for the event page.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input id="title" name="title" placeholder="e.g. Annual Tech Summit 2026" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">URL Slug</Label>
                            <Input id="slug" name="slug" placeholder="tech-summit-2026" required />
                            <p className="text-xs text-muted-foreground">prime-platform.com/events/<strong>slug</strong></p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Brief description of the event..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date & Time</Label>
                                <Input id="startDate" name="startDate" type="datetime-local" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date & Time</Label>
                                <Input id="endDate" name="endDate" type="datetime-local" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="e.g. Grand Hall, Bangkok" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Registration Form</CardTitle>
                    <CardDescription>
                        Customize the questions attendees must answer.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormBuilder onChange={setFormFields} />
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN - SETTINGS */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance & Media</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="themeColor">Theme Color</Label>
                            <div className="flex gap-2">
                                <Input id="themeColor" name="themeColor" type="color" className="w-12 p-1 h-10" defaultValue="#000000" />
                                <Input className="flex-1" placeholder="#000000" readOnly />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Event Banner</Label>
                            <Input id="image" name="image" type="file" accept="image/*" />
                            <p className="text-xs text-muted-foreground">Recommended: 1200x630px.<br/>Max 5MB.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Publishing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <p className="text-xs text-muted-foreground">
                                Events are published immediately by default. You can change this later.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" type="button" asChild>
                                    <Link href="/events">Cancel</Link>
                                </Button>
                                <SubmitButton />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </div>
  )
}
