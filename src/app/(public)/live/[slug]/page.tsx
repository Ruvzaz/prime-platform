"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Radio, ArrowRight, Sparkles } from "lucide-react"

interface CheckInEntry {
  id: string
  referenceCode: string
  name: string
  scannedAt: string
}

interface EventInfo {
  title: string
  imageUrl: string | null
  themeColor: string | null
  startDate: string
}

export default function LiveBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("")
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  const fetchData = useCallback(async () => {
    if (!slug) return
    try {
      const res = await fetch(`/api/checkins/${slug}`)
      if (!res.ok) {
        setError("Event not found")
        return
      }
      const data = await res.json()
      
      // Detect new check-in for highlight animation
      if (data.checkIns.length > 0 && checkIns.length > 0) {
        const latestNew = data.checkIns[0].id
        const latestOld = checkIns[0]?.id
        if (latestNew !== latestOld) {
          setHighlightId(latestNew)
          setTimeout(() => setHighlightId(null), 8000)
        }
      }
      
      setEvent(data.event)
      setCheckIns(data.checkIns)
      setTotal(data.total)
      setLastUpdate(new Date())
      setError(null)
    } catch {
      setError("Connection error")
    }
  }, [slug, checkIns])

  // Poll every 5 seconds
  useEffect(() => {
    if (!slug) return
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [slug])

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-xl text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">กำลังเชื่อมต่อสัญญาณสด...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">
      {/* Background Decorators - Clean White Tone with Grain & Soft Globs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-slate-50 dark:bg-zinc-950">
        {/* Soft Gradients (Purple & Blue mapped to light/pastel colors) */}
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vh] bg-[#f3e8ff] dark:bg-[#3b0764] rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen opacity-80"></div>
        <div className="absolute top-[30%] -right-[15%] w-[50vw] h-[70vh] bg-[#dbeafe] dark:bg-[#1e3a8a] rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen opacity-80"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40vw] h-[40vh] bg-[#fce7f3] dark:bg-[#831843] rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-60"></div>
        
        {/* Noise overlay for texture */}
        <div 
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.2] mix-blend-overlay" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-transparent">
        <div className="max-w-[85rem] mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="Event logo" className="w-12 h-12 rounded-2xl object-cover shadow-[0_2px_10px_rgb(0,0,0,0.08)] hidden sm:block" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center hidden sm:flex shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-black/5 dark:border-white/5">
                <Sparkles className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">{event.title}</h1>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                Live Check-in Board
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Attendees</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{total.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[85rem] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Spotlight (Latest Check-in) */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end lg:pt-10">
          {checkIns.length > 0 ? (
            <div className="w-full relative group">
              <div className="relative bg-white dark:bg-zinc-950 rounded-[3.5rem] p-12 lg:p-16 text-center shadow-[0_30px_60px_rgba(0,0,0,0.04)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-transparent dark:border-white/5 transition-all duration-500 overflow-hidden">
                {/* Decorative background logo (Bottom Right Subtle Graphic) */}
                <div className="absolute -right-16 -bottom-16 text-slate-100 dark:text-zinc-900 pointer-events-none">
                  <Sparkles className="w-80 h-80" strokeWidth={1} />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  {/* Pill: Latest Arrival */}
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/80 dark:bg-zinc-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 border border-slate-200/50 dark:border-white/5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                    Latest Arrival
                  </div>

                  {/* Avatar */}
                  <div className="relative w-40 h-40 mx-auto mb-10">
                    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-black/5 dark:bg-black/40 rounded-full blur-2xl -z-10 transform scale-90 translate-y-6"></div>
                    <div className="relative w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-5xl font-black text-slate-900 dark:text-white shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-slate-50 dark:border-zinc-800 overflow-hidden">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        checkIns[0].name.substring(0, 2)
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h2 className="text-4xl lg:text-[40px] font-black mb-8 text-slate-800 dark:text-gray-100 tracking-tight leading-tight">
                    {checkIns[0].name}
                  </h2>
                  
                  {/* Pill: Ref Code */}
                  <div className="inline-flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-sm bg-slate-100/60 dark:bg-zinc-800/60 py-2 px-5 rounded-2xl mx-auto border border-slate-200/50 dark:border-white/5 mb-12">
                    <span className="text-slate-400">#</span>
                    <span>{checkIns[0].referenceCode}</span>
                  </div>

                  {/* Time */}
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.1em] uppercase">
                    Checked in at {new Date(checkIns[0].scannedAt).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-square border border-dashed border-slate-300 dark:border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm">
              <div className="w-24 h-24 bg-white dark:bg-zinc-800 shadow-sm rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Waiting for guests...</h3>
              <p className="text-base text-slate-500 dark:text-slate-400 max-w-[280px]">The spotlight will automatically appear when the first guest checks in.</p>
            </div>
          )}
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-6 flex flex-col h-[700px] lg:h-[850px] pt-10">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <ArrowRight className="w-4 h-4" />
              Recent Activity Feed
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-white/60 dark:bg-zinc-900/60 rounded-full px-4 py-1.5 border border-slate-200/50 dark:border-white/5 uppercase tracking-widest">Auto-updating</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
            {checkIns.map((ci, index) => {
              const isNew = ci.id === highlightId;
              return (
                <div
                  key={ci.id}
                  className={`
                    group relative p-5 md:px-6 md:py-5 rounded-[1.5rem] transition-all duration-500
                    ${isNew 
                      ? "bg-white dark:bg-zinc-900 shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.25)] -translate-y-1 z-10" 
                      : "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-transparent hover:bg-white dark:hover:bg-zinc-900 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
                    }
                  `}
                >
                  <div className="flex items-center gap-5 md:gap-6">
                     <div className={`
                       w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0 transition-colors
                       ${isNew ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400"}
                     `}>
                       {ci.name.substring(0, 2)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-lg md:text-xl font-bold text-slate-800 dark:text-gray-100 truncate">{ci.name}</h4>
                       <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                           {ci.referenceCode}
                         </span>
                       </div>
                     </div>
                     <div className="text-right shrink-0 flex flex-col items-end justify-center">
                       <span className="text-lg md:text-xl font-bold text-slate-800 dark:text-gray-100 leading-none">
                         {new Date(ci.scannedAt).toLocaleTimeString("th-TH", {
                           hour: "2-digit",
                           minute: "2-digit",
                         })}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.1em]">
                         Today
                       </span>
                     </div>
                  </div>
                </div>
              )
            })}
            
            {checkIns.length === 0 && (
               <div className="text-center py-24 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[1.5rem] bg-white/30 dark:bg-zinc-900/30">
                 <p className="text-base text-slate-400 font-medium">No activity yet. Waiting for guests.</p>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <div className="max-w-[85rem] mx-auto px-6 py-4 flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-widest relative z-10">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </span>
          <span>Last sync: {lastUpdate.toLocaleTimeString("th-TH")}</span>
        </div>
      </div>
      
      {/* Global Style for scrollbar hiding/styling if needed */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 20px;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}} />
    </div>
  )
}
