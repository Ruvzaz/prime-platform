
import { getEventDashboardStats } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckInPieChart, FieldBarChart } from "@/components/admin/event-dashboard-charts"
import { ArrowLeft, Users, UserCheck, Percent } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EventDashboardPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const stats = await getEventDashboardStats(slug)

    if (!stats) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500">Event not found</h2>
                <Link href="/events" className="text-blue-500 hover:underline">
                    Back to Events
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/events">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Event Dashboard</h2>
                    <p className="text-muted-foreground">
                        Real-time analytics for <strong>{stats.eventTitle}</strong>
                    </p>
                </div>
            </div>

            {/* TOP STATS ROW */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCheckedIn}</div>
                        <p className="text-xs text-muted-foreground">
                            Attendees present
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.checkInRate.toFixed(1)}%</div>
                        <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500" 
                                style={{ width: `${stats.checkInRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* CHECK-IN PIE CHART */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Attendance Overview</CardTitle>
                        <CardDescription>Verified arrivals vs. pending</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <CheckInPieChart 
                            checkedIn={stats.totalCheckedIn} 
                            total={stats.totalRegistrations} 
                        />
                    </CardContent>
                </Card>
                
                {/* RIGHT COLUMN INFO or EMPTY */}
                 <Card className="col-span-4 flex flex-col justify-center items-center text-center p-6 text-muted-foreground">
                    <p>Select fields below to view detailed breakdown.</p>
                 </Card>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Form Answers Breakdown</h3>
            <div className="grid gap-6 md:grid-cols-2">
                {stats.fieldStats.length > 0 ? (
                    stats.fieldStats.map((field) => (
                        <Card key={field.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-base">{field.label}</CardTitle>
                                <CardDescription>Type: {field.type}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-[300px]">
                                <FieldBarChart field={field} />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                        No categorical fields (Select/Radio/Checkbox) found for this event.
                    </div>
                )}
            </div>
        </div>
    )
}
