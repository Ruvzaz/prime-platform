import Link from "next/link"
import { logout } from "@/app/actions/auth"
import { auth } from "@/auth"
import { LayoutDashboard, Calendar, Users, LogOut, QrCode, Table, Search, Bell, Settings, ActivitySquare, Shield, UserCog, Mail, Award, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
export const dynamic = "force-dynamic";
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
        <SidebarInset className="bg-[#F8FAFC] dark:bg-background min-w-0 overflow-hidden">
          {/* Neo-Minimalist Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear glass border-b border-border/40 px-6">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary transition-colors" />
            <div className="w-px h-6 bg-border/40 mx-2 hidden md:block" />
            
            <div className="flex-1" />
            
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
          
          <main className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0 w-full overflow-hidden">
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
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="relative flex items-center transition-transform duration-300 hover:scale-[1.02]">
            <img 
              src="/logo.svg" 
              alt="Prime Digital Consultant" 
              className="h-9 w-auto object-contain mix-blend-multiply dark:brightness-200 group-data-[state=collapsed]:hidden" 
            />
            <img 
              src="/logo-icon.svg" 
              alt="P" 
              className="h-6 w-6 object-contain mix-blend-multiply dark:brightness-200 hidden group-data-[state=collapsed]:block" 
            />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="group-data-[state=expanded]:px-3">
        <SidebarGroup className="group-data-[collapsible=icon]:pb-1">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Events</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" className="h-11 px-4">
                  <Link href="/admin/dashboard" prefetch={true}>
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Events" className="h-11 px-4">
                  <Link href="/admin/events" prefetch={true}>
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Events</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Registrations" className="h-11 px-4">
                  <Link href="/admin/registrations" prefetch={true}>
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Registrations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Responses" className="h-11 px-4">
                  <Link href="/admin/responses" prefetch={true}>
                    <Table className="h-5 w-5" />
                    <span className="font-medium">Responses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Activity Logs" className="h-11 px-4">
                  <Link href="/admin/logs" prefetch={true}>
                    <ActivitySquare className="h-5 w-5" />
                    <span className="font-medium">Activity Logs</span>
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
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:pt-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Challenge</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="CTF Challenges" className="h-11 px-4">
                  <Link href="/admin/challenges" prefetch={true}>
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium">CTF Challenges</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Broadcast Emails" className="h-11 px-4">
                  <Link href="/admin/broadcast" prefetch={true}>
                    <Mail className="h-5 w-5 text-indigo-500" />
                    <span className="font-medium">Broadcast Emails</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Accounts" className="h-11 px-4">
                  <Link href="/admin/accounts" prefetch={true}>
                    <UserCog className="h-5 w-5" />
                    <span className="font-medium">Accounts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:pt-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Campaign & Certificates</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="E-Certificates" className="h-11 px-4">
                  <Link href="/admin/certificates" prefetch={true}>
                    <Award className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">E-Certificates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cert Campaigns (No Event)" className="h-11 px-4">
                  <Link href="/admin/certificates/campaigns" prefetch={true}>
                    <Layers className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Cert Campaigns</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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

