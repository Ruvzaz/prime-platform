import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EventForm } from "@/components/admin/event-form"
import { updateEvent } from "@/app/actions/events"
import { getAvailableEmailAccounts } from "@/lib/email"


export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { id: slug },
        { slug: slug }
      ]
    },
    include: {
      formFields: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!event) {
    notFound()
  }

  const availableSenders = getAvailableEmailAccounts()
  
  // Transform data to match FormFieldConfig (ensure types match)
  const formattedEvent = {
      ...event,
      formFields: event.formFields.map(f => ({
          ...f,
          // DB might have different types or nulls, ensure strict match
          options: f.options as string[]
      }))
  }

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Event</h2>
        <p className="text-muted-foreground">
          Update event details and registration form.
        </p>
      </div>

      <EventForm action={updateEvent} availableSenders={availableSenders} initialData={formattedEvent} />
    </div>
  )
}

