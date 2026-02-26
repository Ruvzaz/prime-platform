import Link from "next/link"
import { logout } from "@/app/actions/auth"
import { auth } from "@/auth"
import { LayoutDashboard, Calendar, Users, Settings, LogOut, QrCode, Table } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
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
      <div className="flex min-h-screen w-full">
        <AppSidebar userName={session?.user?.name} userRole={session?.user?.role} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="flex h-16 items-center border-b border-border bg-card px-6 shadow-sm">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Prime Digital Admin</h1>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}

function AppSidebar({ userName, userRole }: { userName?: string | null; userRole?: string }) {
  const displayName = userName || "User"
  const displayRole = userRole === "ADMIN" ? "Administrator" : "Staff"
  const initials = displayName.substring(0, 1).toUpperCase()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <h2 className="text-xl font-bold tracking-tight text-primary">Prime Digital</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/events">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Events</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/registrations">
                <Users className="mr-2 h-4 w-4" />
                <span>Registrations</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/responses">
                <Table className="mr-2 h-4 w-4" />
                <span>Responses</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/check-in" target="_blank">
                <QrCode className="mr-2 h-4 w-4" />
                <span>Scan QR (Check-in)</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{displayRole}</p>
                </div>
            </div>
            <form action={logout}>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

