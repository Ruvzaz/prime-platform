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
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear glass border-b border-border/40 px-6">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary transition-colors" />
            <div className="w-px h-6 bg-border/40 mx-2 hidden md:block" />
            
            <div className="flex-1 ml-2 hidden md:flex max-w-md relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search everything..." 
                className="pl-10 bg-slate-100/50 dark:bg-slate-800/50 border-none shadow-none ring-1 ring-border/50 focus-visible:ring-primary/20 focus-visible:bg-white dark:focus-visible:bg-slate-900 transition-all w-full h-10 rounded-xl"
              />
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="w-px h-6 bg-border/40 mx-2" />
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
    <Sidebar className="border-r border-border/40" collapsible="icon">
      <SidebarHeader className="h-16 group-data-[state=expanded]:h-20 flex items-center px-6 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center transition-all duration-300">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex items-center transition-transform duration-300 hover:scale-[1.02]">
            <img 
              src="/logo.svg" 
              alt="Prime Digital Consultant" 
              className="h-9 w-auto object-contain dark:brightness-200 group-data-[state=collapsed]:hidden" 
            />
            <img 
              src="/logo-icon.svg" 
              alt="P" 
              className="h-6 w-6 object-contain dark:brightness-200 hidden group-data-[state=collapsed]:block" 
            />
          </div>
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
      <SidebarFooter className="p-3 group-data-[state=collapsed]:p-1.5 transition-all duration-300">
        <div className="p-3 group-data-[state=collapsed]:p-1 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center gap-3 group-data-[state=collapsed]:gap-0 mb-4 group-data-[state=collapsed]:mb-1">
                <div className="w-10 h-10 group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner shrink-0 transition-all">
                    {initials}
                </div>
                <div className="overflow-hidden group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 transition-all duration-300">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{displayRole}</p>
                </div>
            </div>
            <form action={logout}>
                <Button variant="ghost" className="w-full justify-start group-data-[state=collapsed]:justify-center text-destructive hover:text-destructive hover:bg-destructive/10 h-9 group-data-[state=collapsed]:h-8 rounded-xl transition-all" size="sm">
                    <LogOut className="mr-2 group-data-[state=collapsed]:mr-0 h-4 w-4" />
                    <span className="group-data-[state=collapsed]:hidden">Sign Out</span>
                </Button>
            </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

