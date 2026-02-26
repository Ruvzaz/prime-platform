import { prisma } from "@/lib/prisma"
import { ResponseDataTable } from "../../../components/admin/response-data-table"
import { Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ResponsesPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    where: { isActive: true }, // Filter only active events? Or all? User might want to see old data. Let's show active first. 
    // Actually for responses, we probably want all events that exist.
    select: {
        id: true,
        title: true, 
        slug: true,
        formFields: {
            orderBy: { order: 'asc' },
            select: {
                id: true,
                label: true,
                required: true,
                type: true,
                options: true,
                order: true
            }
        }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Responses</h1>
      </div>
      
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 min-h-[500px]">
          {events.length > 0 ? (
             <ResponseDataTable 
                initialEvents={events} 
             />
          ) : (
             <div className="text-center py-20 text-muted-foreground">
                 <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <p>No events found. Create an event to see responses.</p>
             </div>
          )}
      </div>
    </div>
  )
}
