import { Suspense } from "react"
import { getRegistrations } from "@/app/actions/registration"
import { getEvents } from "@/app/actions/events"
import { RegistrationsTable } from "@/components/admin/registrations-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default async function RegistrationsPage({
    searchParams,
}: {
    searchParams: Promise<{ eventId?: string; page?: string; pageSize?: string; q?: string; sortBy?: string; sortOrder?: string }>
}) {
    // Await search params in Next.js 15+ convention
    const params = await searchParams;
    const eventId = params.eventId || "all";
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const query = params.q || "";
    const sortBy = params.sortBy || "createdAt";
    const sortOrder = (params.sortOrder as "asc" | "desc") || "desc";

    // Fetch data in parallel
    const [registrationsData, events] = await Promise.all([
        getRegistrations(eventId, page, pageSize, query, sortBy, sortOrder),
        getEvents()
    ])

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="px-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Registrations</h1>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none dark:bg-slate-900/50 rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <Suspense fallback={<div className="flex flex-col items-center justify-center p-32 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-indigo-50 dark:border-indigo-900 animate-pulse"></div>
                            <Loader2 className="absolute top-0 left-0 w-16 h-16 text-primary animate-spin" />
                        </div>
                        <p className="text-muted-foreground font-semibold text-lg animate-pulse">Processing attendee data...</p>
                    </div>}>
                         <RegistrationsTable 
                            initialData={registrationsData.data}
                            metadata={registrationsData.metadata}
                            events={events}
                         />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
