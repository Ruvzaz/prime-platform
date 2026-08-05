"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AdminFileUpload } from "@/components/admin/admin-file-upload"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Users, 
  Eye, 
  Loader2, 
  Save, 
  ArrowLeft, 
  MessageSquare,
  Layout as LayoutIcon,
  Image as ImageIcon,
  ShieldCheck,
  Activity
} from "lucide-react"
import Link from "next/link"
import { updateLiveConfig } from "@/app/actions/live-config"
import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble"

interface LiveBoardSettingsFormProps {
  eventId: string
  eventSlug: string
  initialData?: {
    logoUrl?: string | null
    bannerUrl?: string | null
    welcomeMessage?: string | null
    themeColor?: string | null
    showStats?: boolean
    showLog?: boolean
    layoutMode?: string
    maskNames?: boolean
    bubbleColor?: string | null
    bubbleOpacity?: number | null
  } | null
}

export function LiveBoardSettingsForm({ eventId, eventSlug, initialData }: LiveBoardSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Live State for Preview & Form
  const [config, setConfig] = useState({
    logoUrl: initialData?.logoUrl || "",
    bannerUrl: initialData?.bannerUrl || "",
    welcomeMessage: initialData?.welcomeMessage || "Welcome to our event!",
    themeColor: initialData?.themeColor || "#4f46e5",
    showStats: initialData?.showStats ?? true,
    showLog: initialData?.showLog ?? true,
    layoutMode: initialData?.layoutMode || 'standard',
    maskNames: initialData?.maskNames || false,
    bubbleColor: initialData?.bubbleColor || '#4f46e5',
    bubbleOpacity: initialData?.bubbleOpacity ?? 0.1,
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await updateLiveConfig(eventId, config)
      if (result.success) {
        setMessage({ type: 'success', text: "Configuration saved successfully!" })
        router.refresh()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || "Failed to update configuration" })
      }
    })
  }

  const maskName = (name: string) => {
    if (!config.maskNames) return name;
    if (!name) return "";
    const len = name.length;
    let maskCount = 3;
    
    if (len <= 5) maskCount = 2;
    else if (len <= 10) maskCount = 3;
    else if (len <= 15) maskCount = 4;
    else maskCount = 5;

    const safeMaskCount = Math.min(maskCount, len - 1);
    return name.substring(0, len - safeMaskCount) + "*".repeat(safeMaskCount);
  }

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

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-160px)]">
      {/* LEFT: CONFIGURATION PANEL */}
      <div className="w-full lg:w-[450px] space-y-6">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <Link href={`/admin/events/${eventSlug}/dashboard`}>
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 bg-white border border-border/40 shadow-sm">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-black tracking-tight">Live Setup</h1>
            </div>
            
            <Link href={`/live/${eventSlug}`} target="_blank">
                <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold bg-white shadow-sm border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                    <Eye className="w-3.5 h-3.5" />
                    View Live
                </Button>
            </Link>
        </div>

        <Card className="rounded-[2rem] border-border/40 shadow-xl shadow-indigo-500/5 overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <Tabs defaultValue="branding" className="w-full flex-1 flex flex-col">
              <div className="px-6 pt-6">
                <TabsList className="grid grid-cols-3 w-full bg-slate-100/50 p-1 rounded-2xl h-11">
                  <TabsTrigger value="branding" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Identity</TabsTrigger>
                  <TabsTrigger value="layout" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Layout</TabsTrigger>
                  <TabsTrigger value="privacy" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Privacy</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 flex-1">
                {/* IDENTITY TAB */}
                <TabsContent value="branding" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Background Image (Main)
                        </Label>
                        <AdminFileUpload 
                            id="bannerUrl"
                            name="bannerUrl"
                            defaultValue={config.bannerUrl}
                            folder="live-assets"
                            eventSlug={eventSlug}
                            onUploadComplete={(url) => setConfig(prev => ({ ...prev, bannerUrl: url }))}
                            label="Upload Main Background"
                        />
                        <p className="text-[10px] text-muted-foreground italic px-1 leading-relaxed">
                            {config.layoutMode === 'fullscreen' 
                                ? "In Fullscreen mode, this image will cover the entire screen without any blurs 16:9, 4:3." 
                                : "In Standard mode, this will be blurred as a background element."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Header Logo
                        </Label>
                        <AdminFileUpload 
                            id="logoUrl"
                            name="logoUrl"
                            defaultValue={config.logoUrl}
                            folder="live-assets"
                            eventSlug={eventSlug}
                            onUploadComplete={(url) => setConfig(prev => ({ ...prev, logoUrl: url }))}
                            label="Upload Logo"
                        />
                    </div>
                  </div>
                </TabsContent>

                {/* LAYOUT TAB */}
                <TabsContent value="layout" className="mt-0 space-y-5">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                            <LayoutIcon className="w-3 h-3" /> Display Mode
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, layoutMode: "standard" }))}
                                className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${config.layoutMode === 'standard' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.layoutMode === 'standard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-black">Standard Theme</div>
                                    <div className="text-[9px] text-muted-foreground font-medium">Dynamic header, mascot, and feed.</div>
                                </div>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, layoutMode: "fullscreen" }))}
                                className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${config.layoutMode === 'fullscreen' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.layoutMode === 'fullscreen' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <LayoutIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-black">Full Custom Background</div>
                                    <div className="text-[9px] text-muted-foreground font-medium">Pure background with overlay boxes.</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-bold">Show Counter</Label>
                                <p className="text-[9px] text-muted-foreground font-medium">Display total presence.</p>
                            </div>
                            <Switch checked={config.showStats} onCheckedChange={(val) => setConfig(prev => ({ ...prev, showStats: val }))} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-bold">Theme Color</Label>
                                <p className="text-[9px] text-muted-foreground font-medium">Accent color for UI elements.</p>
                            </div>
                            <input 
                                type="color" 
                                value={config.themeColor} 
                                onChange={(e) => setConfig(prev => ({ ...prev, themeColor: e.target.value }))}
                                className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm overflow-hidden" 
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* PRIVACY TAB */}
                <TabsContent value="privacy" className="mt-0 space-y-6">
                    <div className="space-y-4">
                        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-black flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        Privacy Masking
                                    </Label>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Mask the last 3 characters of names to protect visitor privacy on public displays.</p>
                                </div>
                                <Switch checked={config.maskNames} onCheckedChange={(val) => setConfig(prev => ({ ...prev, maskNames: val }))} />
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Example Output</p>
                                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 line-through">John Doe</span>
                                    <span className="text-xs font-black text-indigo-600">{maskName("John Doe")}</span>
                                </div>
                            </div>

                            {/* BUBBLE SETTINGS */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                    <Activity className="w-4 h-4 text-indigo-500" />
                                    <span>BUBBLE AESTHETICS</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bubble Color</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="color" 
                                                value={config.bubbleColor || '#4f46e5'}
                                                onChange={(e) => setConfig({ ...config, bubbleColor: e.target.value })}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                            />
                                            <span className="text-xs font-mono text-slate-600 uppercase">{config.bubbleColor}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            Bubble Opacity ({Math.round((config.bubbleOpacity ?? 0.1) * 100)}%)
                                        </label>
                                        <input 
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={config.bubbleOpacity ?? 0.1}
                                            onChange={(e) => setConfig({ ...config, bubbleOpacity: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
              </div>

              <div className="p-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                <Button 
                    onClick={() => handleSubmit()}
                    disabled={isPending} 
                    className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-lg transition-all active:scale-95 gap-2"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                </Button>
                <AnimatePresence>
                    {message && (
                        <motion.p 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`text-center text-[10px] font-black mt-3 uppercase tracking-widest ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                            {message.text}
                        </motion.p>
                    )}
                </AnimatePresence>
              </div>
            </Tabs>
          </form>
        </Card>
      </div>

      {/* RIGHT: LIVE PREVIEW (MATCHING USER REQUESTED LAYOUT) */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        <div className="flex items-center gap-2 mb-2 ml-1 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Preview ({config.layoutMode})
        </div>
        
        <div className="flex-1 relative rounded-[3rem] bg-white border-8 border-white shadow-2xl overflow-hidden flex flex-col">
            <BubbleBackground 
                className="absolute inset-0 z-10 bg-transparent"
                colors={getBubbleColors(config.bubbleColor || '#4f46e5')}
                bubbleOpacity={config.bubbleOpacity ?? 0.1}
            />
            
            {/* BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0">
                {config.bannerUrl ? (
                    <img src={config.bannerUrl} alt="" className={`w-full h-full object-cover transition-all duration-700 ${config.layoutMode === 'standard' ? 'blur-xl opacity-30 scale-110' : 'opacity-100'}`} />
                ) : (
                    <div className="w-full h-full bg-transparent" />
                )}
                {config.layoutMode === 'standard' && <div className="absolute inset-0 bg-white/40" />}
            </div>

            {config.layoutMode === 'standard' ? (
              <div className="relative z-20 h-full flex flex-col">
                <header className="px-10 py-8 flex items-center justify-between border-b border-black/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center p-0.5 overflow-hidden">
                            {config.logoUrl ? <img src={config.logoUrl} alt="" className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5 text-indigo-500" />}
                        </div>
                        <h3 className="text-sm font-black text-slate-900">{config.welcomeMessage}</h3>
                    </div>
                </header>
                <main className="flex-1 p-10 grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-7 flex flex-col items-center">
                        <div className="w-full max-w-[240px] aspect-square rounded-[3rem] bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex flex-col items-center justify-center p-8 gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-lg">J</div>
                            <h4 className="text-xl font-black text-slate-900">{maskName("John Doe")}</h4>
                        </div>
                    </div>
                    <div className="col-span-5 space-y-3 opacity-40">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white/50 rounded-2xl p-3 flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-slate-300" /></div>
                        ))}
                    </div>
                </main>
              </div>
            ) : (
              /* FULLSCREEN OVERLAY MODE (AS PER USER IMAGE) */
              <div className="relative z-20 h-full p-12 flex flex-col">
                  {/* DATA OVERLAY BOXES ON THE LEFT */}
                  <div className="w-[50%] h-full flex flex-col justify-center gap-4">
                      {[1, 2, 3, 4].map(i => (
                          <div key={i} className="bg-white/95 backdrop-blur-md rounded-[2rem] p-5 flex items-center gap-6 shadow-xl border border-white/50 scale-[0.9] origin-left">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black shadow-inner">U</div>
                              <div className="flex-1 flex items-center gap-8">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">REF-XXXXXX</span>
                                  <span className="text-sm font-black text-slate-900 truncate">{maskName(i % 2 === 0 ? "John Doe" : "Thanapong Sakda")}</span>
                              </div>
                              <div className="text-right">
                                  <span className="text-sm font-black text-slate-600 tabular-nums">14:15</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
