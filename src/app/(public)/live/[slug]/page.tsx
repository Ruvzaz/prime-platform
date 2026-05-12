"use client"

import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react"
import { Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

const Clock = memo(() => {
  const [time, setTime] = useState<Date | null>(null)
  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!time) return null
  return <>{time.toLocaleTimeString('en-US', { hour12: false })}</>
})

const maskName = (name: string, shouldMask: boolean) => {
  if (!shouldMask || !name) return name;
  const len = name.length;
  let maskCount = 3;
  if (len <= 5) maskCount = 2;
  else if (len <= 10) maskCount = 3;
  else if (len <= 15) maskCount = 4;
  else maskCount = 5;
  const safeMaskCount = Math.min(maskCount, len - 1);
  return name.substring(0, len - safeMaskCount) + "*".repeat(safeMaskCount);
}

const Spotlight = memo(({ latest, maskNames, themeColor = '#4f46e5' }: { latest: CheckInEntry | null, maskNames?: boolean, themeColor?: string }) => {
  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center opacity-40 h-full w-full">
         <Users className="w-20 h-20 mb-6 text-slate-400"/>
         <div className="text-sm font-medium uppercase tracking-[0.5em] text-slate-500">Standby Mode</div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={latest.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex flex-col items-center justify-center text-center w-full h-full relative"
      >
         <div className="relative w-full max-w-[320px] md:max-w-[400px] lg:max-w-[460px] xl:max-w-[500px] aspect-square flex flex-col items-center justify-center shrink-0">
            {/* The Floating Bubble Background */}
            {/* The Floating Bubble Background */}
            <div className="absolute inset-0 pointer-events-none animate-aura-breathe">
               <div className="absolute inset-0 animate-aura-spin">
                  {/* Base Glow */}
                  <div className="absolute inset-0 rounded-full bg-white opacity-80 blur-3xl will-change-transform" />
                  
                  {/* Primary Theme Orb */}
                  <div 
                    className="absolute top-[-5%] left-[-5%] w-[65%] h-[65%] rounded-full opacity-80 blur-[40px] animate-aura-pulse-1" 
                    style={{ backgroundColor: themeColor }}
                  />
                  
                  {/* Violet Orb */}
                  <div 
                    className="absolute bottom-[-5%] right-[-5%] w-[70%] h-[70%] rounded-full bg-violet-500 opacity-70 blur-[50px] animate-aura-pulse-2" 
                  />
                  
                  {/* Pink Orb */}
                  <div 
                    className="absolute top-[5%] right-[-5%] w-[55%] h-[55%] rounded-full bg-pink-400 opacity-70 blur-[40px] animate-aura-pulse-1" 
                    style={{ animationDelay: '2s' }}
                  />
                  
                  {/* Sky Blue Orb */}
                  <div 
                    className="absolute bottom-[5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-sky-400 opacity-60 blur-[40px] animate-aura-pulse-2" 
                    style={{ animationDelay: '4s' }}
                  />
                  
                  {/* Center Soft Purple */}
                  <div 
                    className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-fuchsia-400 opacity-50 blur-[50px] animate-aura-pulse-3" 
                  />
               </div>
            </div>

            {/* Inner Content on top of the glowing bubble */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full px-8">
               <span className="text-[40px] lg:text-[64px] xl:text-[72px] font-bold text-white tracking-tight drop-shadow-lg leading-none mb-3 lg:mb-4">
                  Welcome
               </span>
               <h2 className="text-2xl lg:text-[32px] xl:text-[36px] font-medium text-white leading-snug tracking-tight drop-shadow-md w-full max-w-[95%] truncate">
                  {maskName(latest.name, maskNames ?? false)}
               </h2>
               
               <div className="mt-6 lg:mt-8 px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white font-mono text-sm lg:text-base font-bold tracking-widest drop-shadow-sm">
                  {latest.referenceCode}
               </div>
            </div>
         </div>
      </motion.div>
    </AnimatePresence>
  )
})

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

function getBubbleColors(hexColor: string) {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  };
  const rgb = hexToRgb(hexColor);
  return { first: rgb, second: rgb, third: rgb, fourth: rgb, fifth: rgb, sixth: rgb };
}

export default function LiveBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("")
  const [data, setData] = useState<{ event: EventInfo | null, checkIns: CheckInEntry[], total: number, totalRegistrations: number }>({
    event: null,
    checkIns: [],
    total: 0,
    totalRegistrations: 0
  })
  const [highlightId, setHighlightId] = useState<string | null>(null)
  
  const stateRef = useRef(data)
  const isFetching = useRef(false)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
      
      body, html, .live-root * {
        font-family: 'Prompt', sans-serif !important;
        -webkit-font-smoothing: antialiased;
      }
      
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      
      @keyframes marquee {
        0% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(-50%, 0, 0); }
      }
      .animate-marquee {
        display: flex;
        width: max-content;
        will-change: transform;
        animation: marquee 40s linear infinite;
      }
      .animate-marquee:hover {
        animation-play-state: paused;
      }

      @keyframes aura-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes aura-breathe {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      @keyframes aura-pulse-1 {
        0%, 100% { transform: scale(1) translate(0,0); }
        50% { transform: scale(1.15) translate(5%, 5%); }
      }
      @keyframes aura-pulse-2 {
        0%, 100% { transform: scale(1) translate(0,0); }
        50% { transform: scale(1.2) translate(-5%, -5%); }
      }
      @keyframes aura-pulse-3 {
        0%, 100% { transform: scale(0.9); }
        50% { transform: scale(1.3); }
      }
      
      .animate-aura-spin { animation: aura-spin 35s linear infinite; will-change: transform; }
      .animate-aura-breathe { animation: aura-breathe 8s ease-in-out infinite; will-change: transform; }
      .animate-aura-pulse-1 { animation: aura-pulse-1 10s ease-in-out infinite; will-change: transform; }
      .animate-aura-pulse-2 { animation: aura-pulse-2 14s ease-in-out infinite; will-change: transform; }
      .animate-aura-pulse-3 { animation: aura-pulse-3 12s ease-in-out infinite; will-change: transform; }
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

      const isEventSame = prev.event?.title === next.event.title && prev.event?.imageUrl === next.event.imageUrl
      const isCheckInsSame = prev.checkIns.length === next.checkIns.length && 
                           (prev.checkIns.length === 0 || prev.checkIns[0].id === next.checkIns[0].id)
      const isTotalSame = prev.total === next.total

      if (!isEventSame || !isCheckInsSame || !isTotalSame) {
        if (!isCheckInsSame && prev.checkIns.length > 0 && next.checkIns.length > 0) {
          if (next.checkIns[0].id !== prev.checkIns[0].id) {
            setHighlightId(next.checkIns[0].id)
            setTimeout(() => setHighlightId(null), 10000)
          }
        }

        const newState = { 
          event: next.event, 
          checkIns: next.checkIns, 
          total: next.total, 
          totalRegistrations: next.totalRegistrations 
        }
        setData(newState)
        stateRef.current = newState
      }
    } catch {
      // Silent
    } finally {
      isFetching.current = false
    }
  }, [slug])

  useEffect(() => {
    if (!slug) return
    sync()
    const itv = setInterval(sync, 15000)
    return () => clearInterval(itv)
  }, [slug, sync])



  if (!data.event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center live-root">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  const isFullscreen = data.event.liveConfig?.layoutMode === 'fullscreen';
  const themeColor = data.event.liveConfig?.themeColor || '#4f46e5';
  const bubbleColors = getBubbleColors(themeColor);

  return (
    <div className="h-screen w-screen relative bg-slate-50 overflow-hidden select-none flex flex-col live-root text-slate-900">
      {isFullscreen ? (
        <div className="absolute inset-0 z-0 flex flex-col">
          {/* Base Layer: Background Image */}
          {data.event.liveConfig?.bannerUrl ? (
            <img src={data.event.liveConfig.bannerUrl} className="absolute inset-0 w-full h-full object-cover z-0" alt="background" />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-slate-950 z-0" />
          )}

          {/* Floating Bubbles Layer */}
          <BubbleBackground 
            className="absolute inset-0 z-10 bg-transparent pointer-events-none"
            colors={bubbleColors}
            bubbleOpacity={data.event.liveConfig?.bubbleOpacity ?? 0.3}
          />

          <main className="relative z-20 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden py-10 px-12">
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
        </div>
      ) : (
        <>
          {/* 1. TOP BAR */}
          <div className="relative z-30 h-[80px] bg-white border-b border-slate-300 flex items-center justify-between px-6 lg:px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border border-slate-300 rounded-full overflow-hidden flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                {data.event.liveConfig?.logoUrl || data.event.imageUrl ? (
                  <img src={data.event.liveConfig?.logoUrl || data.event.imageUrl!} className="w-full h-full object-cover rounded-full"/>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">LOGO</span>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-lg lg:text-xl font-medium text-slate-900 leading-tight">
                  {data.event.liveConfig?.welcomeMessage || "Header"}
                </span>
                <span className="text-[13px] text-slate-500 leading-tight mt-0.5">
                  {data.event.title || "SubHeader"}
                </span>
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-mono font-medium text-slate-800 tracking-widest tabular-nums">
              <Clock />
            </div>
          </div>

          {/* 2. BANNER */}
          <div className="relative z-20 w-full h-[140px] md:h-[192px] bg-slate-50 border-b border-slate-300 shrink-0">
            {data.event.liveConfig?.bannerUrl ? (
              <img src={data.event.liveConfig.bannerUrl} alt="Banner" className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <span className="font-medium">Banner</span>
                <span className="text-sm font-mono">1920*192px</span>
              </div>
            )}
          </div>

          {/* 3. MAIN CONTENT GRID */}
          <main className="relative z-20 flex-1 p-4 lg:p-8 overflow-hidden flex flex-col">
            <div className="flex-1 border border-slate-300 rounded-[2rem] bg-white shadow-sm overflow-hidden flex flex-col lg:flex-row p-6 lg:p-8 gap-8">
              
              <div className="flex-1 flex flex-col justify-center items-center relative min-w-0">
                <Spotlight latest={data.checkIns[0] || null} maskNames={data.event.liveConfig?.maskNames} themeColor={data.event.liveConfig?.themeColor || '#4f46e5'} />
              </div>

              {/* Right List Panel */}
              {data.event.liveConfig?.showLog !== false && (
                <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col border border-slate-300 rounded-3xl bg-slate-50/50 p-4 overflow-hidden shadow-sm">
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 lg:space-y-4 pr-1">
                    <FeedList 
                      items={data.checkIns} 
                      highlightId={highlightId} 
                      themeColor={themeColor} 
                      layoutMode={data.event.liveConfig?.layoutMode}
                      maskNames={data.event.liveConfig?.maskNames}
                    />
                  </div>
                </div>
              )}

            </div>
          </main>

          {/* 4. BOTTOM TICKER */}
          <div className="relative z-30 h-12 bg-white border-t border-slate-300 flex items-center overflow-hidden shrink-0 text-[13px] font-medium text-slate-700">
              {data.checkIns.length > 0 ? (() => {
                // Create a long enough base array so the ticker never runs out of width before looping
                const padCount = Math.max(1, Math.ceil(20 / data.checkIns.length));
                const baseItems = Array(padCount).fill(data.checkIns).flat();
                
                return (
                  <div className="animate-marquee flex items-center whitespace-nowrap">
                    <div className="flex items-center">
                      {baseItems.map((ci, idx) => (
                          <span key={`${ci.id}-1-${idx}`} className="mx-8 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Activity {maskName(ci.name, data.event?.liveConfig?.maskNames ?? false)} Check In
                          </span>
                      ))}
                      {/* Duplicate entire track exactly once for seamless -50% CSS looping */}
                      {baseItems.map((ci, idx) => (
                          <span key={`${ci.id}-2-${idx}`} className="mx-8 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Activity {maskName(ci.name, data.event?.liveConfig?.maskNames ?? false)} Check In
                          </span>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <div className="w-full text-center text-slate-500 tracking-wider">Activity รายชื่อ Check In Slide Run</div>
              )}
          </div>
        </>
      )}
    </div>
  )
}
