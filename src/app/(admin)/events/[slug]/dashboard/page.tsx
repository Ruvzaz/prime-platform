
import { getEventDashboardStats } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckInPieChart, FieldBarChart, SessionProgressBars } from "@/components/admin/event-dashboard-charts"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardRefresher } from "@/components/admin/dashboard-refresher"
import { Activity, ArrowLeft, Users, UserCheck, Percent, Sparkles } from "lucide-react"

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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <DashboardRefresher />
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
                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full border border-green-500/20 mr-2">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                            <span className="font-medium text-green-600 dark:text-green-400">Live</span>
                        </div>
                        <div className="w-px h-3 bg-border" />
                        <span className="text-[10px] font-medium tabular-nums">
                            Updated: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                    
                    <Link href={`/events/${slug}/live`}>
                        <Button variant="outline" className="rounded-full gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
                            <Sparkles className="w-4 h-4" />
                            Live Board Settings
                        </Button>
                    </Link>
                    
                    <Link href={`/live/${slug}`} target="_blank">
                        <Button className="rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200">
                            <Activity className="w-4 h-4" />
                            View Live Board
                        </Button>
                    </Link>
                </div>
            </div>

            {/* TOP STATS ROW - PREMIUM THEME */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Registrations - Blue Card */}
                <div className="bg-[#4a89c8] text-white p-6 rounded-[1.5rem] shadow-sm relative overflow-hidden group">
                    <div className="w-10 h-10 rounded-xl bg-[#fae29c] flex items-center justify-center mb-4">
                        <Users className="h-5 w-5 text-[#2c4059]" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/90 mb-1">Total Registrations</h3>
                    <div className="text-4xl font-black">{stats.totalRegistrations}</div>
                </div>

                {/* Checked In - Blue Card */}
                <div className="bg-[#4a89c8] text-white p-6 rounded-[1.5rem] shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#fae29c] flex items-center justify-center mb-4">
                        <UserCheck className="h-5 w-5 text-[#2c4059]" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/90 mb-1">Checked In</h3>
                    <div className="text-4xl font-black">{stats.totalCheckedIn}</div>
                    <p className="text-xs text-white/70 mt-2">Active attendees</p>
                </div>

                {/* Check-in Rate - White/Ring Card */}
                <div className="bg-white dark:bg-zinc-900 border border-border p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#2c4059] flex items-center justify-center mb-4">
                        <Percent className="h-5 w-5 text-[#fae29c]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Check-in Rate</h3>
                        <div className="text-4xl font-black text-foreground">{stats.checkInRate.toFixed(1)}%</div>
                        <div className="h-2 w-full bg-secondary mt-3 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-1000" 
                                style={{ width: `${stats.checkInRate}%` }}
                            />
                        </div>
                    </div>
                </div>
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
                 <Card className="col-span-4 flex flex-col p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle>Session Check-ins Pulse</CardTitle>
                        <CardDescription>Live tracking across different event sessions</CardDescription>
                    </CardHeader>
                    <div className="flex-1 mt-4">
                        <SessionProgressBars 
                            sessionCheckIns={stats.sessionCheckIns} 
                            totalRegistrations={stats.totalRegistrations} 
                        />
                    </div>
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
