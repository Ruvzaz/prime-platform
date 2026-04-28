import Link from "next/link"
import { Users, CalendarCheck, UserCheck, Activity } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { unstable_cache } from "next/cache"
import { extractAttendeeInfo } from "@/lib/attendee-utils"
import { DashboardRefresher } from "@/components/admin/dashboard-refresher"

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
  { revalidate: 5 }
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <DashboardRefresher />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-base">Welcome back to Prime Digital.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>System Operational</span>
            </div>
            <Button className="rounded-xl shadow-lg shadow-primary/20 h-10 px-5 font-bold text-sm">
                Generate Report
            </Button>
         </div>
      </div>
      
      {/* STATS GRID - NEO-MINIMALIST */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Card 1: Indigo Hero */}
        <div className="bg-primary text-primary-foreground p-7 rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
             <CalendarCheck className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
               <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-[10px] font-black text-white/70 mb-1 tracking-widest uppercase">Active Events</h3>
            <div className="text-4xl font-black tracking-tight">{stats.eventCount}</div>
            <p className="text-xs text-white/60 mt-4 font-bold uppercase tracking-wide">
                Live & Upcoming
            </p>
          </div>
        </div>
        
        {/* Card 2: Clean White */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 p-7 rounded-3xl shadow-sm transition-all hover:shadow-md hover:scale-[1.02] duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
             <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-muted-foreground mb-1 tracking-widest uppercase">Total Registrations</h3>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
               {stats.registrationCount.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-4 font-black flex items-center gap-1 uppercase tracking-wide">
                +12% <span className="text-muted-foreground font-bold">vs last month</span>
            </p>
          </div>
        </div>
        
        {/* Card 3: Soft Slate/Gray */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-7 rounded-3xl shadow-sm transition-all hover:scale-[1.02] duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center mb-6">
             <UserCheck className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-muted-foreground mb-1 tracking-widest uppercase">Check-in Rate</h3>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.registrationCount > 0 
                ? `${Math.round((stats.checkInCount / stats.registrationCount) * 100)}%`
                : "0%"}
            </div>
            <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-primary h-full transition-all duration-1000" 
                    style={{ width: `${stats.registrationCount > 0 ? (stats.checkInCount / stats.registrationCount) * 100 : 0}%` }}
                />
            </div>
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
