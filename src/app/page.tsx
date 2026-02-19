import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Users, QrCode, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-primary selection:text-white">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[128px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        
        {/* HERO HEADER */}
        <div className="max-w-4xl w-full text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-white/70">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span>Internal Developer Preview</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Prime Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Consultant</span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            The next-generation platform for event management, attendee registration, and real-time analytics.
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl">
          
          {/* CARD 1: ADMIN */}
          <Link href="/dashboard" className="group">
            <div className="h-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 w-fit group-hover:bg-blue-500/20 transition-colors">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Admin Portal</h3>
              <p className="text-white/50 mb-6 min-h-[3rem]">
                Secure dashboard for creating events, managing registrations, and viewing analytics.
              </p>
              <div className="flex items-center text-blue-400 font-medium group-hover:gap-2 transition-all">
                Access Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* CARD 2: PUBLIC */}
          <Link href="/events/demo-event" className="group">
            <div className="h-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 p-4 rounded-xl bg-purple-500/10 w-fit group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Public Registration</h3>
              <p className="text-white/50 mb-6 min-h-[3rem]">
                Fluid registration flow for attendees with email verification and tickets.
              </p>
              <div className="flex items-center text-purple-400 font-medium group-hover:gap-2 transition-all">
                View Mobile Preview <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* CARD 3: STAFF */}
          <Link href="/check-in" className="group">
            <div className="h-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6 p-4 rounded-xl bg-pink-500/10 w-fit group-hover:bg-pink-500/20 transition-colors">
                <QrCode className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Staff Check-in</h3>
              <p className="text-white/50 mb-6 min-h-[3rem]">
                Rapid check-in interface for ground staff. Supports manual entry and QR scanning.
              </p>
              <div className="flex items-center text-pink-400 font-medium group-hover:gap-2 transition-all">
                Launch Scanner <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

        </div>

        <div className="mt-16 text-xs text-white/30">
          Built with Next.js, OpenAI, and Antigravity.
        </div>
      </div>
    </div>
  );
}
