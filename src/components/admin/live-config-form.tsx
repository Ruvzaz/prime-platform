"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AdminFileUpload } from "@/components/admin/admin-file-upload"
import { Loader2, Save, ArrowLeft, Layout, Image as ImageIcon, Palette, MessageSquare } from "lucide-react"
import Link from "next/link"
import { updateLiveConfig } from "@/app/actions/live-config"
import { useRouter } from "next/navigation"

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
  } | null
}

export function LiveBoardSettingsForm({ eventId, eventSlug, initialData }: LiveBoardSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      const data = {
        logoUrl: formData.get('logoUrl') as string || null,
        bannerUrl: formData.get('bannerUrl') as string || null,
        welcomeMessage: formData.get('welcomeMessage') as string || null,
        themeColor: formData.get('themeColor') as string || "#4f46e5",
        showStats: formData.get('showStats') === 'on',
        showLog: formData.get('showLog') === 'on',
      }

      const result = await updateLiveConfig(eventId, data)
      if (result.success) {
        setMessage({ type: 'success', text: "Live Board configuration updated successfully!" })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error || "Failed to update configuration" })
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/events/${eventSlug}/dashboard`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Board Settings</h1>
            <p className="text-muted-foreground">Customize the branding and layout of your live check-in screen.</p>
          </div>
        </div>
        
        <Link href={`/live/${eventSlug}`} target="_blank">
            <Button variant="outline" className="rounded-full gap-2 border-indigo-200 text-indigo-600">
                Preview Live Board
            </Button>
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message.text}
        </div>
      )}

      <form action={handleSubmit} className="grid gap-8 md:grid-cols-2">
        {/* Branding Section */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              Branding & Assets
            </CardTitle>
            <CardDescription>Upload logos and banners to personalize the experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Live Logo</Label>
              <p className="text-[11px] text-muted-foreground">This logo appears in the header of the live board. <span className="text-indigo-500 font-medium">แนะนำขนาด 512 x 512 px (1:1)</span></p>
              <AdminFileUpload 
                id="logoUrl"
                name="logoUrl"
                defaultValue={initialData?.logoUrl}
                folder="live-assets"
                eventSlug={eventSlug}
                label="Upload Live Logo"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Background Banner</Label>
              <p className="text-[11px] text-muted-foreground">A subtle background image that blurs behind the content. <span className="text-indigo-500 font-medium">แนะนำขนาด 1920 x 1080 px (16:9)</span></p>
              <AdminFileUpload 
                id="bannerUrl"
                name="bannerUrl"
                defaultValue={initialData?.bannerUrl}
                folder="live-assets"
                eventSlug={eventSlug}
                label="Upload Background Banner"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visual Theme Section */}
        <div className="space-y-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                Visual Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label htmlFor="themeColor" className="text-sm font-semibold">Accent Color</Label>
                <div className="flex gap-4">
                  <Input 
                    id="themeColor" 
                    name="themeColor" 
                    type="color" 
                    className="w-16 h-10 p-1 cursor-pointer border-2" 
                    defaultValue={initialData?.themeColor || "#4f46e5"} 
                  />
                  <Input 
                    type="text" 
                    value={initialData?.themeColor || "#4f46e5"} 
                    readOnly 
                    className="flex-1 bg-slate-50 text-slate-500 font-mono" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="welcomeMessage" className="text-sm font-semibold">Custom Header Text</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    id="welcomeMessage" 
                    name="welcomeMessage" 
                    className="pl-10" 
                    placeholder="Welcome to our event!" 
                    defaultValue={initialData?.welcomeMessage || ""} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Controls */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-500" />
                Layout & Toggles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <Label htmlFor="showStats" className="text-sm font-bold">Show Statistics</Label>
                  <p className="text-[10px] text-muted-foreground">Display the total presence counter in header.</p>
                </div>
                <Switch 
                  id="showStats" 
                  name="showStats" 
                  defaultChecked={initialData?.showStats ?? true} 
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <Label htmlFor="showLog" className="text-sm font-bold">Show Activity Log</Label>
                  <p className="text-[10px] text-muted-foreground">Show the scrollable list of latest check-ins.</p>
                </div>
                <Switch 
                  id="showLog" 
                  name="showLog" 
                  defaultChecked={initialData?.showLog ?? true} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button disabled={isPending} className="px-10 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Live Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}
