import { Suspense } from "react"
import { getRegistrations } from "@/app/actions/registration"
import { getEvents } from "@/app/actions/events"
import { RegistrationsTable } from "@/components/admin/registrations-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default async function RegistrationsPage({
    searchParams,
}: {
    searchParams: Promise<{ eventId?: string; page?: string; q?: string }>
}) {
    // Await search params in Next.js 15+ convention
    const params = await searchParams;
    const eventId = params.eventId || "all";
    const page = Number(params.page) || 1;
    const query = params.q || "";

    // Fetch data in parallel
    const [registrationsData, events] = await Promise.all([
        getRegistrations(eventId, page, 20, query), // Page size 20
        getEvents()
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Registrations</h2>
                <p className="text-muted-foreground">
                    View and manage attendee list for all events.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendee List</CardTitle>
                    <CardDescription>
                        {eventId && eventId !== "all"
                            ? `Showing registrations for selected event.` 
                            : "All registrations across the platform."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
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
