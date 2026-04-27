import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent text-foreground selection:bg-primary/20">
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        
        {/* HERO HEADER */}
        <div className="max-w-4xl w-full text-center mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md text-xs font-medium text-primary">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Digital Solutions Provider</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#2d3748] dark:text-white">
            Prime Digital <span className="text-primary">Consultant</span>
          </h1>
          
          <p className="text-L text-muted-foreground max-w-2xl mx-auto">
            Platform for event management, attendee registration, and real-time analytics.
          </p>
        </div>


        <div className="mt-16 text-xs text-muted-foreground">
           {/* MINI Footer Text */}
        </div>
      </div>
    </div>
  );
}
