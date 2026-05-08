"use client"

import React, { useState, useEffect, useCallback, useRef, memo } from "react"
import { Users, Sparkles, CheckCircle2, RefreshCw } from "lucide-react"
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion"

interface CheckInEntry {
  id: string
  referenceCode: string
  name: string
  scannedAt: string
}

interface EventInfo {
  title: string
  imageUrl: string | null
}

// --- Memoized Sub-components for absolute stability ---

const Header = memo(({ title, imageUrl, total }: { title: string, imageUrl: string | null, total: number }) => {
  const springTotal = useSpring(total, { stiffness: 10, damping: 20 })
  const displayTotal = useTransform(springTotal, (value) => Math.floor(value))

  useEffect(() => {
    springTotal.set(total)
  }, [total, springTotal])

  return (
    <header className="relative z-30 pt-14 px-14 pb-10 flex-shrink-0">
      <div className="max-w-[85rem] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-7">
          <div className="w-14 h-14 rounded-[1.25rem] bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-0.5">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover rounded-[1rem]" />
            ) : (
              <Sparkles className="w-6 h-6 text-indigo-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.25em]">Live Monitoring</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-2">Total Presence</span>
          <div className="flex items-baseline gap-2">
            <motion.span className="text-6xl font-bold text-indigo-600 tracking-tighter tabular-nums leading-none">
              {displayTotal}
            </motion.span>
          </div>
        </div>
      </div>
    </header>
  )
})

const Spotlight = memo(({ latest, imageUrl }: { latest: CheckInEntry | null, imageUrl: string | null }) => {
  return (
    <div className="lg:col-span-6 h-full flex items-center justify-center relative py-10">
      <AnimatePresence mode="popLayout">
        {latest ? (
          <motion.div 
            key={latest.id}
            initial={{ opacity: 0, x: -10, scale: 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 1.01 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="w-full max-w-xl mx-auto"
          >
            <div className="spotlight-card rounded-[3.5rem] p-14 text-center shadow-[0_50px_120px_-20px_rgba(30,58,138,0.1)] border border-indigo-100/50 relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-200/50 text-[10px] font-bold text-indigo-500 uppercase tracking-[0.5em] mb-12">
                  <RefreshCw className="w-4 h-4 animate-spin-slow opacity-60" />
                  Now Arriving
                </div>

                <div className="relative w-44 h-44 mx-auto mb-12">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[90px]" />
                  <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center text-7xl font-bold text-indigo-600 border-[10px] border-indigo-100/50 overflow-hidden shadow-2xl">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-90" />
                    ) : (
                      latest.name.substring(0, 1)
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl text-white border-4 border-white">
                     <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <h2 className="text-5xl font-bold mb-8 text-slate-900 tracking-tight leading-tight">
                  {latest.name}
                </h2>
                
                <div className="flex flex-col items-center gap-5 mt-14">
                  <div className="w-10 h-px bg-indigo-200" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.6em]">
                    Registry {latest.referenceCode}
                  </span>
                  <span className="text-indigo-600 text-3xl font-medium mt-1">
                    {new Date(latest.scannedAt).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full max-w-xl mx-auto aspect-square bg-[#f8fbff] border border-blue-50 rounded-[3.5rem] flex flex-col items-center justify-center p-20 shadow-sm opacity-50">
            <Users className="w-12 h-12 text-blue-200 mb-8" />
            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-[0.5em]">Standby Mode</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
})

const FeedList = memo(({ items, highlightId }: { items: CheckInEntry[], highlightId: string | null }) => {
  const displayItems = items.slice(0, 7);
  
  return (
    <div className="lg:col-span-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8 px-2 shrink-0">
        <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Latest Check In
        </h3>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Latest</span>
      </div>

      <div className="flex-1 space-y-3 pb-10 overflow-hidden custom-scrollbar overflow-y-auto pr-2">
        <AnimatePresence initial={false} mode="popLayout">
          {displayItems.map((ci) => {
            const isNew = ci.id === highlightId;
            return (
              <motion.div
                key={ci.id}
                layout
                initial={isNew ? { opacity: 0, y: 5, scale: 0.99 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.19, 1, 0.22, 1],
                  layout: { duration: 0.4, ease: [0.19, 1, 0.22, 1] }
                }}
                className={`
                  relative p-5 rounded-[1.5rem] transition-all duration-700
                  ${isNew 
                    ? "bg-white shadow-[0_15px_40px_-5px_rgba(0,0,0,0.04)] border border-indigo-50/50" 
                    : "bg-transparent border border-transparent"
                  }
                `}
              >
                <div className="flex items-center gap-5">
                   <div className={`
                     w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                     ${isNew ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-100"}
                   `}>
                     {ci.name.substring(0, 1).toUpperCase()}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className={`text-base font-bold tracking-tight transition-colors ${isNew ? "text-indigo-600" : "text-slate-900"}`}>
                       {ci.name}
                     </h4>
                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                       {ci.referenceCode}
                     </p>
                   </div>
                   <div className="text-right shrink-0">
                     <span className={`text-base font-bold tabular-nums transition-colors ${isNew ? "text-indigo-600" : "text-slate-600"}`}>
                       {new Date(ci.scannedAt).toLocaleTimeString("th-TH", {
                         hour: "2-digit",
                         minute: "2-digit",
                       })}
                     </span>
                   </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
})

// --- Main Application Shell ---

export default function LiveBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("")
  const [data, setData] = useState<{ event: EventInfo | null, checkIns: CheckInEntry[], total: number }>({
    event: null,
    checkIns: [],
    total: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  
  const stateRef = useRef(data)
  const isFetching = useRef(false)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  // Inject Styles ONCE
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      
      body, html, .live-root * {
        font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif !important;
        -webkit-font-smoothing: antialiased;
      }

      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #f0f0f0; border-radius: 10px; }
      
      .spotlight-card {
        background: #f8fbff;
        background: linear-gradient(165deg, #f8fbff 0%, #f0f4ff 100%);
      }

      .animate-spin-slow { animation: spin 10s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const sync = useCallback(async () => {
    if (!slug || isFetching.current) return
    
    try {
      isFetching.current = true
      const res = await fetch(`/api/checkins/${slug}`)
      if (!res.ok) return
      
      const next = await res.json()
      const prev = stateRef.current

      // Strict Equality Check to prevent ANY re-render if data is identical
      const isEventSame = prev.event?.title === next.event.title && prev.event?.imageUrl === next.event.imageUrl
      const isCheckInsSame = prev.checkIns.length === next.checkIns.length && 
                           (prev.checkIns.length === 0 || prev.checkIns[0].id === next.checkIns[0].id)
      const isTotalSame = prev.total === next.total

      if (!isEventSame || !isCheckInsSame || !isTotalSame) {
        // Handle new check-in highlight
        if (!isCheckInsSame && prev.checkIns.length > 0 && next.checkIns.length > 0) {
          if (next.checkIns[0].id !== prev.checkIns[0].id) {
            setHighlightId(next.checkIns[0].id)
            setTimeout(() => setHighlightId(null), 10000)
          }
        }
        
        const newState = { event: next.event, checkIns: next.checkIns, total: next.total }
        setData(newState)
        stateRef.current = newState
      }
      setError(null)
    } catch {
      // Silent
    } finally {
      isFetching.current = false
    }
  }, [slug])

  // Optimized Polling (10s for live feel, but 0ms re-render cost if no change)
  useEffect(() => {
    if (!slug) return
    sync()
    const itv = setInterval(sync, 15000)
    return () => clearInterval(itv)
  }, [slug, sync])

  if (!data.event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center live-root">
        <div className="w-10 h-10 border-[3px] border-slate-50 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-white text-slate-900 relative flex flex-col overflow-hidden live-root select-none">
      
      {/* Background Highlight Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/40 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-indigo-50/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] bg-cyan-50/30 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <Header title={data.event.title} imageUrl={data.event.imageUrl} total={data.total} />

      <main className="relative z-20 max-w-[85rem] mx-auto w-full px-14 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-20 items-center overflow-hidden">
        
        <Spotlight latest={data.checkIns[0] || null} imageUrl={data.event.imageUrl} />

        <FeedList items={data.checkIns} highlightId={highlightId} />
        
      </main>

      <footer className="relative z-30 px-14 py-10 mt-auto opacity-30 flex-shrink-0">
        <div className="max-w-[85rem] mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.5em] text-slate-600">
          <span>Synchronized Terminal</span>
          <span>Prime Digital &copy; 2026</span>
        </div>
      </footer>
    </div>
  )
}
