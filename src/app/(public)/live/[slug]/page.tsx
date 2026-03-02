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
    <div className="h-screen overflow-hidden text-foreground relative selection:bg-primary/20 font-sans flex flex-col">


      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-transparent">
        <div className="max-w-[85rem] mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="Event logo" className="w-12 h-12 rounded-xl object-cover shadow-[0_2px_10px_rgb(0,0,0,0.05)] hidden sm:block border-[3px] border-white" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center hidden sm:flex shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-black/5 dark:border-white/5">
                <Sparkles className="w-6 h-6 text-[#4a89c8]" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2d3748] dark:text-white leading-tight">{event.title}</h1>
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                <Radio className="w-3 h-3 text-[#fbaa33] animate-pulse" />
                Live Check-in Board
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Attendees</span>
            <span className="text-3xl font-black text-[#2d3748] dark:text-white leading-none">{total.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[85rem] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start flex-1 min-h-0">
        {/* Left Column: Spotlight (Latest Check-in) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end lg:pt-4">
          {checkIns.length > 0 ? (
            <div className="w-full relative group">
              <div className="relative bg-[#4a89c8] dark:bg-blue-900 rounded-[2rem] p-10 lg:p-14 text-center shadow-[0_20px_40px_rgba(74,137,200,0.2)] dark:shadow-none transition-all duration-500 overflow-hidden">
                {/* Decorative background logo */}
                <div className="absolute -right-10 -bottom-10 text-white/5 dark:text-white/5 pointer-events-none">
                  <Sparkles className="w-72 h-72" strokeWidth={1} />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  {/* Pill: Latest Arrival (Yellow theme) */}
                  <div className="w-full flex justify-start mb-8">
                     <div className="inline-flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#fae29c] text-[#2c4059] text-[11px] font-black uppercase tracking-wider shadow-sm">
                       <Sparkles className="w-4 h-4" strokeWidth={3} />
                     </div>
                  </div>

                  {/* Avatar */}
                  <div className="relative w-36 h-36 mx-auto mb-8">
                    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[#2a5b8e]/40 rounded-full blur-xl -z-10 transform scale-90 translate-y-4"></div>
                    <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center text-5xl font-black text-[#4a89c8] shadow-lg border-[6px] border-white/20 overflow-hidden">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        checkIns[0].name.substring(0, 2)
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white tracking-tight leading-tight">
                    {checkIns[0].name}
                  </h2>
                  
                  {/* Pill: Ref Code */}
                  <div className="inline-flex items-center justify-center gap-2 text-white/90 font-bold text-sm bg-white/10 py-2.5 px-6 rounded-xl mx-auto border border-white/20 mb-8 backdrop-blur-sm">
                    <span className="opacity-60 text-xs">#</span>
                    <span>{checkIns[0].referenceCode}</span>
                  </div>

                  {/* Time */}
                  <p className="text-xs font-medium text-blue-100/70 tracking-widest uppercase mb-2">
                    Latest Check-in
                  </p>
                  <p className="text-lg font-bold text-white tracking-wide">
                    {new Date(checkIns[0].scannedAt).toLocaleTimeString("th-TH")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-square bg-[#4a89c8]/10 border border-dashed border-[#4a89c8]/30 dark:border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center text-center p-12 backdrop-blur-sm">
              <div className="w-20 h-20 bg-white dark:bg-zinc-800 shadow-sm rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-[#4a89c8]" />
              </div>
              <h3 className="text-2xl font-bold text-[#2d3748] dark:text-white mb-3 tracking-tight">Waiting for guests...</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px]">The spotlight will appear when the first guest checks in.</p>
            </div>
          )}
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-7 flex flex-col h-full pt-4 overflow-hidden">
          <div className="flex items-center justify-between mb-6 px-1 shrink-0">
            <h3 className="text-[13px] font-bold text-[#2d3748] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#4a89c8]" />
              Recent Activity Data
            </h3>
            <span className="text-[10px] font-bold text-[#4a89c8] bg-[#e8f1f8] dark:bg-blue-900/30 rounded-lg px-3 py-1.5 uppercase tracking-widest">Auto Update</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
            {checkIns.map((ci, index) => {
              const isNew = ci.id === highlightId;
              const isEven = index % 2 === 0;
              return (
                <div
                  key={ci.id}
                  className={`
                    group relative p-4 md:px-6 md:py-4 rounded-2xl transition-all duration-300
                    ${isNew 
                      ? "bg-white dark:bg-zinc-900 shadow-[0_15px_40px_rgba(74,137,200,0.15)] -translate-y-1 z-10 border border-[#b8d4f0]" 
                      : "bg-white dark:bg-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-transparent hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                    }
                  `}
                >
                  <div className="flex items-center gap-4 md:gap-5">
                     <div className={`
                       w-12 h-12 rounded-[1rem] flex items-center justify-center text-lg font-black shrink-0 shadow-sm transition-colors
                       ${isNew ? "bg-[#fae29c] text-[#2c4059]" : (isEven ? "bg-[#e5eff5] text-[#4a89c8]" : "bg-[#65cbd2] text-white")}
                     `}>
                       {ci.name.substring(0, 2)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-base md:text-lg font-bold text-[#2d3748] dark:text-white truncate">{ci.name}</h4>
                       <div className="flex items-center gap-3 mt-1">
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                           #{ci.referenceCode}
                         </span>
                       </div>
                     </div>
                     <div className="text-right shrink-0 flex flex-col items-end justify-center">
                       <span className="text-base md:text-lg font-black text-[#4a89c8] dark:text-blue-400 leading-none">
                         {new Date(ci.scannedAt).toLocaleTimeString("th-TH", {
                           hour: "2-digit",
                           minute: "2-digit",
                         })}
                       </span>
                       <span className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wide">
                         Today
                       </span>
                     </div>
                  </div>
                </div>
              )
            })}
            
            {checkIns.length === 0 && (
               <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                 <p className="text-base text-slate-400 font-medium">No activity data yet.</p>
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
