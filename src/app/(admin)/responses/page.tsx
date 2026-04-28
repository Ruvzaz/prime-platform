import { prisma } from "@/lib/prisma"
import { ResponseDataTable } from "../../../components/admin/response-data-table"
import { Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function ResponsesPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Form Responses</h1>
        </div>
      </div>
      
      <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none dark:bg-slate-900/50 rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
              {events.length > 0 ? (
                 <ResponseDataTable 
                    initialEvents={events} 
                 />
              ) : (
                 <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                     <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
                        <Users className="w-10 h-10 opacity-30" />
                     </div>
                     <p className="text-lg font-medium">No events found.</p>
                     <p className="text-sm opacity-70 mt-1">Create an event to begin collecting and viewing responses.</p>
                 </div>
              )}
          </CardContent>
      </Card>
    </div>
  )
}
