import { EventForm } from "@/components/admin/event-form"
import { createEvent } from "@/app/actions/events"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Event</h2>
          <p className="text-muted-foreground">
            Set up a new event and customize the registration form.
          </p>
        </div>
      </div>

      <EventForm action={createEvent} />
    </div>
  )
}
