import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EventForm } from "@/components/admin/event-form"
import { updateEvent } from "@/app/actions/events"


export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      formFields: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!event) {
    notFound()
  }

  // Wrapper to pass properly typings to useActionState if needed, 
  // OR we can use the action directly in the form since it's a server action
  // But EventForm is a CLIENT component, so we should pass the action.
  
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
      
      {/* We pass the server action directly. Next.js handles the binding. */}
      {/* However, useActionState is usually hooked inside the component. */}
      {/* EventForm handles the form UI. We do need to handle the ACTION dispatch. */}
      {/* Since EventForm is client, we can pass `updateEvent` as a prop. */}
      
      <EventForm action={updateEvent} initialData={formattedEvent} />
    </div>
  )
}

