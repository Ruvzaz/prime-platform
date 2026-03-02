import { notFound } from "next/navigation"
import { Calendar, MapPin, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { prisma } from "@/lib/prisma"
import { ThemeToggle } from "@/components/theme-toggle"
import { RegistrationForm } from "@/components/public/registration-form"

async function getEvent(slug: string) {
  const event = await prisma.event.findFirst({
    where: { slug },
    include: {
      formFields: {
        orderBy: { order: 'asc' }
      }
    }
  })
  return event
}

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-500 overflow-x-hidden">
      
      {/* FULL-SCREEN BACKGROUND IMAGE (BLURRED) */}
      <div className="fixed inset-0 z-0">
        {event.imageUrl ? (
          <>
            <img
              src={event.imageUrl}
              alt="Background"
              className="w-full h-full object-cover blur-xl scale-110 opacity-60 dark:opacity-30 transition-opacity duration-500"
            />
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-background/40 dark:bg-zinc-950/60 mix-blend-multiply" />
          </>
        ) : (
          <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950">
            <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] rounded-full blur-[120px] bg-black/5 dark:bg-white/5" />
            <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full blur-[140px] bg-black/5 dark:bg-white/5" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.06] mix-blend-overlay"></div>
          </div>
        )}
      </div>

      {/* FLOATING THEME TOGGLE */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
        <ThemeToggle />
      </div>

      {/* CENTERED REGISTRATION CARD */}
      <div className="relative z-10 w-full max-w-2xl bg-card dark:bg-zinc-900 border border-border/40 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header Block */}
        <div className="p-6 md:p-10 pb-6 border-b border-border/40">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${event.isActive ? 'bg-foreground text-background' : 'bg-destructive/10 text-destructive'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${event.isActive ? 'text-yellow-500' : 'text-destructive'}`} />
            {event.isActive ? 'เปิดรับลงทะเบียน' : 'ปิดรับลงทะเบียนแล้ว'}
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-foreground">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium bg-muted/50 text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{new Date(event.startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium bg-muted/50 text-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{new Date(event.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {event.location && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium bg-muted/50 text-foreground">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-6 text-muted-foreground text-sm leading-relaxed border-l-2 border-primary/30 pl-4 py-1">
              {event.description}
            </p>
          )}
        </div>

        {/* Form Block or Closed UI */}
        {event.isActive ? (
          <RegistrationForm event={event} />
        ) : (
          <div className="p-10 md:p-14 bg-muted/30 dark:bg-zinc-950/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              ปิดรับลงทะเบียนแล้ว
            </h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              ขออภัย กิจกรรมนี้ได้ปิดรับลงทะเบียนเรียบร้อยแล้ว หากมีข้อสงสัยเพิ่มเติม กรุณาติดต่อผู้จัดงาน
            </p>
            <div className="w-full h-px bg-border/40" />
            <p className="mt-8 text-[11px] text-muted-foreground/60 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
              <span>Powered by Prime Digital</span>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
