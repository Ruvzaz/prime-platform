import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Staff Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <ShieldCheck className="h-6 w-6" />
            <span>Prime Staff Portal</span>
          </div>

          <form action={logout}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600 gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </form>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-white border-t py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Prime Digital. Authorized Personnel Only.
      </footer>
    </div>
  );
}
