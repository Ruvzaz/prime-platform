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
      include: { event: true }
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
      
      {/* STATS GRID - USING GLASS UTILITIES */}
      <div className="grid gap-4 md:grid-cols-3">
        
        <div className="glass-card p-6 rounded-xl hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Events</h3>
            <CalendarCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold">{stats.eventCount}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" /> Active campaigns
            </p>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-xl hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Registrations</h3>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold">{stats.registrationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Global sign-ups</p>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-xl hover:shadow-md transition-all border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Checked In</h3>
            <UserCheck className="h-4 w-4 text-pink-500" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold">{stats.checkInCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.registrationCount > 0 
                ? `${Math.round((stats.checkInCount / stats.registrationCount) * 100)}% attendance rate`
                : "No data yet"}
            </p>
          </div>
        </div>
      </div>
      
      {/* CONTENT GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* RECENT ACTIVITY */}
        <div className="col-span-4 glass-card rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Registrations</h3>
            <Link href="/registrations" className="text-xs text-primary hover:underline">
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
                      const { name, email } = extractAttendeeInfo(reg.formData as Record<string, unknown>);
                      return (
                          <div key={reg.id} className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-transparent hover:border-border transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                                      {name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="space-y-0.5">
                                      <p className="font-medium text-sm leading-none text-foreground">{name}</p>
                                      <p className="text-xs text-muted-foreground">{email}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs font-medium text-primary">{reg.event.title}</p>
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
             <div className="glass-card rounded-xl border p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/40 dark:to-purple-900/40">
                <h3 className="font-semibold text-lg mb-2 text-primary">Quick Actions</h3>
                <p className="text-sm text-muted-foreground mb-4">Jump straight into tasks.</p>
                <div className="space-y-3">
                    <Button className="w-full justify-start h-10 shadow-sm" asChild>
                        <Link href="/events/new">
                            <CalendarCheck className="mr-2 h-4 w-4" /> Create New Event
                        </Link>
                    </Button>
                    <Button className="w-full justify-start h-10 shadow-sm bg-white dark:bg-black border hover:bg-muted/50 text-foreground" variant="outline" asChild>
                        <Link href="/check-in">
                            <UserCheck className="mr-2 h-4 w-4" /> Open Check-in Scanner
                        </Link>
                    </Button>
                </div>
            </div>

            {/* TIP CARD */}
             <div className="glass-card rounded-xl border p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                <h3 className="font-semibold text-sm mb-1 text-yellow-700 dark:text-yellow-400">Pro Tip</h3>
                <p className="text-xs text-muted-foreground">
                    Upload high-quality banners (16:9) for public events to increase conversion rates by up to 20%.
                </p>
            </div>
        </div>

      </div>
    </div>
  )
}
