import { notFound } from "next/navigation"
import { Calendar, MapPin, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/prisma"
import { registerAttendee } from "@/app/actions/registration"

async function getEvent(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug, isActive: true },
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

  const themeColor = event.themeColor || '#6366f1'

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white">

      {/* === BACKGROUND EFFECTS === */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] animate-pulse" style={{ background: themeColor, opacity: 0.25 }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] animate-pulse" style={{ background: themeColor, opacity: 0.15, animationDelay: '2s' }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: themeColor, opacity: 0.05 }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">

        {/* Banner Image */}
        {event.imageUrl && (
          <div className="w-full max-w-2xl mb-0 rounded-t-2xl overflow-hidden shadow-2xl">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-auto block"
            />
          </div>
        )}

        {/* Main Card - White Theme */}
        <div className={`w-full max-w-2xl bg-white shadow-2xl overflow-hidden ${event.imageUrl ? 'rounded-b-2xl' : 'rounded-2xl'}`}>

          {/* Top accent bar (only when no image) */}
          {!event.imageUrl && (
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)` }} />
          )}

          {/* Header */}
          <div className="p-6 md:p-8 pb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ color: themeColor, background: `${themeColor}12` }}>
              <Sparkles className="w-3 h-3" />
              เปิดรับลงทะเบียน
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
              {event.title}
            </h1>

            {event.description && (
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Event Info Pills */}
            <div className="flex flex-wrap gap-3 mt-5">
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100" style={{ color: themeColor }}>
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-gray-600">{new Date(event.startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100" style={{ color: themeColor }}>
                <Clock className="w-3.5 h-3.5" />
                <span className="text-gray-600">{new Date(event.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5 text-xs bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100" style={{ color: themeColor }}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-gray-600">{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 md:mx-8 my-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Form Section */}
          <div className="px-6 md:px-8 pb-8">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 md:p-7 relative overflow-hidden">
              {/* Subtle theme glow at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${themeColor}50, transparent)` }} />

              <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: themeColor }}>ลงทะเบียน</h2>

              <form action={registerAttendee} className="space-y-5">
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="eventSlug" value={event.slug} />

                {event.formFields.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label htmlFor={q.id} className="text-sm text-gray-600 font-medium">
                      {q.label} {q.required && <span style={{ color: themeColor }}>*</span>}
                    </Label>

                    {q.type === "TEXT" || q.type === "EMAIL" || q.type === "PHONE" ? (
                      <Input
                        id={q.id}
                        name={`field_${q.id}`}
                        type={q.type === "EMAIL" ? "email" : "text"}
                        placeholder={`กรอก${q.label}`}
                        required={q.required}
                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 h-12 rounded-lg transition-all focus:ring-2 focus:ring-offset-0"
                        style={{ '--tw-ring-color': `${themeColor}30`, borderColor: undefined } as React.CSSProperties}
                      />
                    ) : q.type === "SELECT" ? (
                      <select
                        id={q.id}
                        name={`field_${q.id}`}
                        className="flex h-12 w-full items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
                        style={{ '--tw-ring-color': `${themeColor}30` } as React.CSSProperties}
                        required={q.required}
                      >
                        <option value="">เลือกตัวเลือก</option>
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}


                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full text-base py-6 font-semibold rounded-xl text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                      boxShadow: `0 8px 32px ${themeColor}25`,
                    }}
                  >
                    ลงทะเบียน
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/40 mt-6">
          Powered by Prime Digital Consultant
        </p>
      </div>
    </div>
  )
}
