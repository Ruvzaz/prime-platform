import Link from "next/link"
import { logout } from "@/app/actions/auth"
import { auth } from "@/auth"
import { LayoutDashboard, Calendar, Users, LogOut, QrCode, Table, Search, Bell, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { cookies } from "next/headers"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const session = await auth()

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen w-full font-sans text-sm">
        <AppSidebar userName={session?.user?.name} userRole={session?.user?.role} />
        <SidebarInset className="bg-[#F8FAFC] dark:bg-background">
          {/* Neo-Minimalist Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear glass border-b border-border/50 px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 ml-4 hidden md:flex max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search everything..." 
                className="pl-10 bg-white/50 border-none shadow-none ring-1 ring-border/50 focus-visible:ring-primary/20 focus-visible:bg-white transition-all w-full h-10 rounded-xl"
              />
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="w-px h-6 bg-border/50 mx-2" />
              <ThemeToggle />
            </div>
          </header>
          
          <main className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function AppSidebar({ userName, userRole }: { userName?: string | null; userRole?: string }) {
  const displayName = userName || "User"
  const displayRole = userRole === "ADMIN" ? "Administrator" : "Staff"
  const initials = displayName.substring(0, 1).toUpperCase()

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Calendar className="size-4" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Prime<span className="text-primary">Admin</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu className="gap-1 mt-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard" className="h-11 px-4">
              <Link href="/dashboard" prefetch={true}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Events" className="h-11 px-4">
              <Link href="/events" prefetch={true}>
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Events</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Registrations" className="h-11 px-4">
              <Link href="/registrations" prefetch={true}>
                <Users className="h-5 w-5" />
                <span className="font-medium">Registrations</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Responses" className="h-11 px-4">
              <Link href="/responses" prefetch={true}>
                <Table className="h-5 w-5" />
                <span className="font-medium">Responses</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Scan QR" className="h-11 px-4">
              <Link href="/check-in" target="_blank" prefetch={false}>
                <QrCode className="h-5 w-5" />
                <span className="font-medium">Scan QR</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                    {initials}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{displayRole}</p>
                </div>
            </div>
            <form action={logout}>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-9 rounded-xl" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

