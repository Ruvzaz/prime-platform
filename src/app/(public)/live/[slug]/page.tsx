"use client"

import React, { useState, useEffect, useCallback, useRef, memo } from "react"
import { Users, Sparkles, CheckCircle2, RefreshCw } from "lucide-react"
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion"
import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble"

interface CheckInEntry {
  id: string
  referenceCode: string
  name: string
  scannedAt: string
}

interface EventInfo {
  title: string
  imageUrl: string | null
  liveConfig?: {
    logoUrl?: string | null;
    bannerUrl?: string | null;
    welcomeMessage?: string | null;
    themeColor?: string | null;
    showStats?: boolean;
    showLog?: boolean;
    layoutMode?: string;
    maskNames?: boolean;
    bubbleColor?: string | null;
    bubbleOpacity?: number | null;
  } | null
}

// --- Memoized Sub-components for absolute stability ---

const Header = memo(({ title, imageUrl, total, liveConfig }: { title: string, imageUrl: string | null, total: number, liveConfig?: EventInfo['liveConfig'] }) => {
  const springTotal = useSpring(total, { stiffness: 10, damping: 20 })
  const displayTotal = useTransform(springTotal, (value) => Math.floor(value))

  useEffect(() => {
    springTotal.set(total)
  }, [total, springTotal])

  const logoToUse = liveConfig?.logoUrl || imageUrl;
  const showStats = liveConfig?.showStats !== false;

  return (
    <header className="relative z-30 pt-14 px-14 pb-10 flex-shrink-0">
      <div className="max-w-[85rem] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-7">
          <div className="w-14 h-14 rounded-[1.25rem] bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-0.5">
            {logoToUse ? (
              <img src={logoToUse} alt="" className="w-full h-full object-cover rounded-[1rem]" />
            ) : (
              <Sparkles className="w-6 h-6 text-indigo-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{liveConfig?.welcomeMessage || title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.25em]">Live Monitoring</span>
            </div>
          </div>
        </div>

        {showStats && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-2">Total Presence</span>
            <div className="flex items-baseline gap-2">
              <motion.span className="text-6xl font-bold text-indigo-600 tracking-tighter tabular-nums leading-none" style={{ color: liveConfig?.themeColor || undefined }}>
                {displayTotal}
              </motion.span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
})

const Spotlight = memo(({ latest, imageUrl, liveConfig }: { latest: CheckInEntry | null, imageUrl: string | null, liveConfig?: EventInfo['liveConfig'] }) => {
  const themeColor = liveConfig?.themeColor || '#4f46e5'; // indigo-600

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
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-200/50 text-[10px] font-bold uppercase tracking-[0.5em] mb-12" style={{ color: themeColor }}>
                  <RefreshCw className="w-4 h-4 animate-spin-slow opacity-60" />
                  Now Arriving
                </div>

                <div className="relative w-44 h-44 mx-auto mb-12">
                  <div className="absolute inset-0 rounded-full blur-[90px]" style={{ backgroundColor: `${themeColor}33` }} />
                  <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center text-7xl font-bold border-[10px] border-indigo-100/50 overflow-hidden shadow-2xl" style={{ color: themeColor }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-90" />
                    ) : (
                      latest.name.substring(0, 1)
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl text-white border-4 border-white" style={{ backgroundColor: themeColor }}>
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
                  <span className="text-3xl font-medium mt-1" style={{ color: themeColor }}>
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

const maskName = (name: string, shouldMask: boolean) => {
  if (!shouldMask || !name) return name;
  const len = name.length;
  let maskCount = 3; // Default
  
  if (len <= 5) maskCount = 2;
  else if (len <= 10) maskCount = 3;
  else if (len <= 15) maskCount = 4;
  else maskCount = 5;

  const safeMaskCount = Math.min(maskCount, len - 1);
  return name.substring(0, len - safeMaskCount) + "*".repeat(safeMaskCount);
}

const FeedList = memo(({ items, highlightId, themeColor, layoutMode, maskNames }: { items: CheckInEntry[], highlightId: string | null, themeColor?: string | null, layoutMode?: string, maskNames?: boolean }) => {
  const isFullscreen = layoutMode === 'fullscreen';
  const displayItems = isFullscreen ? items.slice(0, 4) : items.slice(0, 8);
  const color = themeColor || '#4f46e5';
  
  return (
    <div className={`${isFullscreen ? 'lg:col-span-6 h-full flex flex-col justify-center gap-4 pl-5' : 'lg:col-span-6 h-full flex flex-col overflow-hidden py-6'}`}>
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-8 px-4 shrink-0">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Recent Activity
            </h3>
        </div>
      )}

      <div className={`flex-1 space-y-4 pb-10 overflow-hidden ${!isFullscreen ? 'custom-scrollbar overflow-y-auto px-2' : 'flex flex-col justify-center'}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {displayItems.map((ci) => {
            const isNew = ci.id === highlightId;
            const maskedName = maskName(ci.name, maskNames ?? false);
            
            return (
              <motion.div
                key={ci.id}
                layout
                initial={isNew ? { opacity: 0, x: isFullscreen ? -60 : 20, scale: 0.8, filter: 'blur(10px)' } : false}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: isFullscreen ? -30 : -20, scale: 0.9, filter: 'blur(10px)' }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 18,
                  mass: 1,
                  layout: { duration: 0.4, ease: "easeInOut" }
                }}
                className={`
                  relative transition-all duration-700
                  ${isFullscreen 
                    ? "bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-7 flex items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60" 
                    : isNew 
                      ? "bg-white dark:bg-slate-800 shadow-xl border border-white dark:border-slate-700 p-6 rounded-[2rem]" 
                      : "bg-slate-50/30 dark:bg-slate-900/30 border border-transparent p-6 rounded-[2rem]"
                  }
                `}
              >
                <div className="flex items-center gap-6 w-full">
                   <div className={`${isFullscreen ? 'w-14 h-14 rounded-full text-xl' : 'w-12 h-12 rounded-2xl text-lg'} flex items-center justify-center font-black shrink-0 shadow-sm border border-white dark:border-slate-800`}
                    style={{ 
                      backgroundColor: isNew ? color : isFullscreen ? '#f1f5f9' : 'white', 
                      color: isNew ? 'white' : color,
                    }}>
                     {ci.name.substring(0, 1).toUpperCase()}
                   </div>
                   
                   {isFullscreen ? (
                     <div className="flex-1 flex items-center gap-12 min-w-0">
                        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 shrink-0 tabular-nums">
                            {ci.referenceCode}
                        </span>
                        <h4 className="text-2xl font-black text-slate-900 truncate uppercase tracking-tight">
                            {maskedName}
                        </h4>
                     </div>
                   ) : (
                     <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                            {maskedName}
                        </h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                            {ci.referenceCode}
                        </p>
                     </div>
                   )}

                   <div className="text-right shrink-0">
                     <span className={`${isFullscreen ? 'text-2xl' : 'text-lg'} font-black tabular-nums text-slate-700 dark:text-slate-400`}>
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

function getBubbleColors(hexColor: string) {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };

  const rgb = hexToRgb(hexColor);
  return {
    first: rgb,
    second: rgb,
    third: rgb,
    fourth: rgb,
    fifth: rgb,
    sixth: rgb,
  };
}

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

  const bubbleColors = React.useMemo(() => 
    getBubbleColors(data.event?.liveConfig?.bubbleColor || '#4f46e5'),
    [data.event?.liveConfig?.bubbleColor]
  );

  if (!data.event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center live-root">
        <div className="w-10 h-10 border-[3px] border-slate-50 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  const isFullscreen = data.event.liveConfig?.layoutMode === 'fullscreen';
  const themeColor = data.event.liveConfig?.themeColor || '#4f46e5';

  return (
    <div className="h-screen w-screen relative bg-white overflow-hidden select-none">
      {/* 1. BASE LAYER: CUSTOM BANNER */}
      {data.event.liveConfig?.bannerUrl && (
        <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isFullscreen ? 'opacity-100' : 'opacity-10'}`}>
          <img src={data.event.liveConfig.bannerUrl} alt="" className="w-full h-full object-cover" />
          {!isFullscreen && <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />}
        </div>
      )}

      <BubbleBackground 
        className="absolute inset-0 z-10 bg-transparent"
        colors={bubbleColors}
        bubbleOpacity={data.event.liveConfig?.bubbleOpacity ?? 0.1}
      >
        {/* 3. TOP LAYER: ACTUAL CONTENT */}
        <div className="relative z-20 h-full w-full flex flex-col">
          {!isFullscreen && (
            <Header title={data.event.title} imageUrl={data.event.imageUrl} total={data.total} liveConfig={data.event.liveConfig} />
          )}

          <main className={`relative z-20 max-w-full mx-auto w-full px-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center overflow-hidden ${isFullscreen ? 'py-12' : ''}`}>
            
            {!isFullscreen && (
              <Spotlight latest={data.checkIns[0] || null} imageUrl={data.event.imageUrl} liveConfig={data.event.liveConfig} />
            )}

          {data.event.liveConfig?.showLog !== false && (
            <FeedList 
              items={data.checkIns} 
              highlightId={highlightId} 
              themeColor={themeColor} 
              layoutMode={data.event.liveConfig?.layoutMode}
              maskNames={data.event.liveConfig?.maskNames}
            />
          )}
          
        </main>

        {!isFullscreen && (
          <footer className="relative z-30 px-14 py-10 mt-auto opacity-30 flex-shrink-0">
              <div className="max-w-[85rem] mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.5em] text-slate-600">
              <span>Synchronized Terminal</span>
              <span>Prime Digital &copy; 2026</span>
              </div>
          </footer>
        )}
      </div>
    </BubbleBackground>
    </div>
  )
}
