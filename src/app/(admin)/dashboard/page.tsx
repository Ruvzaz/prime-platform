import Link from "next/link"
import { Users, CalendarCheck, UserCheck, ArrowUpRight, TrendingUp, Activity } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { unstable_cache } from "next/cache"
import { extractAttendeeInfo } from "@/lib/attendee-utils"

const getCachedCounts = unstable_cache(
  async () => {
    const [eventCount, registrationCount, checkInCount] = await Promise.all([
      prisma.event.count(),
      prisma.registration.count(),
      prisma.checkIn.count(),
    ])
    return { eventCount, registrationCount, checkInCount }
  },
  ['dashboard-counts'],
  { revalidate: 60 }
)

async function getDashboardStats() {
  const [counts, recentRegistrations] = await Promise.all([
    getCachedCounts(),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { event: { include: { formFields: true } } }
    })
  ])

  return { ...counts, recentRegistrations }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
             <p className="text-muted-foreground mt-1">Real-time insights and performance metrics.</p>
         </div>
         <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span>System Operational</span>
         </div>
      </div>
      
      {/* STATS GRID - DASHBOARD THEME */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Card 1: Blue Background */}
        <div className="bg-[#4a89c8] text-white p-7 rounded-[1.5rem] shadow-[0_15px_30px_rgba(74,137,200,0.15)] transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#fae29c] flex items-center justify-center mb-6 shadow-sm">
             <CalendarCheck className="h-5 w-5 text-[#2c4059]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90 mb-1 tracking-wide">Total Events</h3>
            <div className="text-4xl font-black tracking-tight">{stats.eventCount}</div>
            <p className="text-xs text-white/70 mt-2 flex items-center gap-1 font-medium">
                on track
            </p>
          </div>
        </div>
        
        {/* Card 2: Blue Background */}
        <div className="bg-[#4a89c8] text-white p-7 rounded-[1.5rem] shadow-[0_15px_30px_rgba(74,137,200,0.15)] transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#fae29c] flex items-center justify-center mb-6 shadow-sm">
             <Users className="h-5 w-5 text-[#2c4059]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90 mb-1 tracking-wide">Registrations</h3>
            <div className="text-4xl font-black tracking-tight">
               +{stats.registrationCount}
            </div>
            <p className="text-xs text-white/70 mt-2 font-medium">projected growth</p>
          </div>
        </div>
        
        {/* Card 3: White Background / Ring Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-border p-7 rounded-[1.5rem] shadow-sm transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#2c4059] flex items-center justify-center mb-6 shadow-sm">
             <UserCheck className="h-5 w-5 text-[#fae29c]" />
          </div>
          <div className="flex flex-col h-full z-10">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wide">Checked In</h3>
            <div className="text-4xl font-black text-foreground tracking-tight">{stats.checkInCount}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {stats.registrationCount > 0 
                ? `${Math.round((stats.checkInCount / stats.registrationCount) * 100)}% achieved`
                : "No data yet"}
            </p>
          </div>
        </div>
      </div>
      
      {/* CONTENT GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* RECENT ACTIVITY */}
        <div className="col-span-4 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Registrations</h3>
            <Link href="/registrations" className="text-xs text-primary hover:underline font-medium">
                View All
            </Link>
          </div>
          <div className="space-y-4">
             {stats.recentRegistrations.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm">No recent activity.</p>
                 </div>
             ) : (
                  stats.recentRegistrations.map((reg) => {
                      const { name, email } = extractAttendeeInfo(reg.formData as Record<string, unknown>, reg.event.formFields);
                      return (
                          <div key={reg.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-transparent hover:border-border transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                      {name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="space-y-0.5">
                                      <p className="font-medium text-sm leading-none text-foreground">{name}</p>
                                      <p className="text-xs text-muted-foreground">{email}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs font-medium text-foreground">{reg.event.title}</p>
                                  <time className="text-[10px] text-muted-foreground">
                                      {new Date(reg.createdAt).toLocaleDateString()}
                                  </time>
                              </div>
                          </div>
                      )
                  })
             )}
          </div>
        </div>
        
        {/* QUICK ACTIONS */}
        <div className="col-span-3 space-y-6">
             <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Quick Actions</h3>
                <p className="text-sm text-muted-foreground mb-4">Jump straight into tasks.</p>
                <div className="space-y-3">
                    <Button className="w-full justify-start h-10 shadow-sm" asChild>
                        <Link href="/events/new">
                            <CalendarCheck className="mr-2 h-4 w-4" /> Create New Event
                        </Link>
                    </Button>
                    <Button className="w-full justify-start h-10 shadow-sm bg-background border hover:bg-muted text-foreground" variant="outline" asChild>
                        <Link href="/check-in">
                            <UserCheck className="mr-2 h-4 w-4" /> Open Check-in Scanner
                        </Link>
                    </Button>
                </div>
            </div>

            {/* TIP CARD */}
             <div className="bg-muted/50 rounded-xl border border-border p-6">
                <h3 className="font-semibold text-sm mb-1 text-foreground">Pro Tip</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload high-quality banners (16:9) for public events to increase conversion rates by up to 20%. Ensure imagery matches the premium aesthetic.
                </p>
            </div>
        </div>

      </div>
    </div>
  )
}
