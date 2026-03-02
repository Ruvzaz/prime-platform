import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Users, QrCode, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent text-foreground selection:bg-primary/20">
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        
        {/* HERO HEADER */}
        <div className="max-w-4xl w-full text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md text-xs font-medium text-primary">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Internal Developer Preview</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#2d3748] dark:text-white">
            Prime Digital <span className="text-primary">Consultant</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The next-generation platform for event management, attendee registration, and real-time analytics.
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl">
          
          {/* CARD 1: ADMIN */}
          <Link href="/dashboard" className="group">
            <div className="h-full p-8 rounded-[1.5rem] bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-[#2d3748] dark:text-white">Admin Portal</h3>
              <p className="text-muted-foreground mb-6 min-h-[3rem]">
                Secure dashboard for creating events, managing registrations, and viewing analytics.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                Access Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* CARD 2: PUBLIC */}
          <Link href="/events/demo-event" className="group">
            <div className="h-full p-8 rounded-[1.5rem] bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-[#2d3748] dark:text-white">Public Registration</h3>
              <p className="text-muted-foreground mb-6 min-h-[3rem]">
                Fluid registration flow for attendees with email verification and tickets.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                View Mobile Preview <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* CARD 3: STAFF */}
          <Link href="/check-in" className="group" prefetch={false}>
            <div className="h-full p-8 rounded-[1.5rem] bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-[#2d3748] dark:text-white">Staff Check-in</h3>
              <p className="text-muted-foreground mb-6 min-h-[3rem]">
                Rapid check-in interface for ground staff. Supports manual entry and QR scanning.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                Launch Scanner <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

        </div>

        <div className="mt-16 text-xs text-muted-foreground">
          Built with Next.js, OpenAI, and Antigravity.
        </div>
      </div>
    </div>
  );
}
