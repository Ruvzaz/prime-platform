import { notFound } from "next/navigation"
import { Calendar, MapPin, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/prisma"
import { registerAttendee } from "@/app/actions/registration"
import { ThemeToggle } from "@/components/theme-toggle"

async function getEvent(slug: string) {
  const event = await prisma.event.findFirst({
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 bg-foreground text-background">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            เปิดรับลงทะเบียน
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

        {/* Form Block */}
        <div className="p-6 md:p-10 bg-muted/30 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-bold text-foreground">
              ลงทะเบียนเข้าร่วมงาน
            </h2>
            <div className="flex-1 h-px bg-border/40" />
          </div>
          
          <form action={registerAttendee} className="space-y-6">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="eventSlug" value={event.slug} />

            <div className="space-y-5">
              {event.formFields.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id} className="text-sm font-bold tracking-tight text-foreground">
                    {q.label} {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  {q.type === "TEXT" || q.type === "EMAIL" || q.type === "PHONE" ? (
                    <Input
                      id={q.id}
                      name={`field_${q.id}`}
                      type={q.type === "EMAIL" ? "email" : "text"}
                      placeholder={`กรอก${q.label}`}
                      required={q.required}
                      className="bg-background dark:bg-zinc-900 border-border/50 h-12 rounded-xl px-4 transition-all focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground placeholder:text-muted-foreground/50"
                    />
                  ) : q.type === "SELECT" ? (
                    <div className="group/select relative">
                        <select
                          id={q.id}
                          name={`field_${q.id}`}
                          className="flex h-12 w-full items-center rounded-xl border border-border/50 bg-background dark:bg-zinc-900 px-4 py-2 text-sm text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground appearance-none cursor-pointer"
                          required={q.required}
                        >
                          <option value="">เลือกตัวเลือก</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                    </div>
                  ) : (q.type as string) === "RADIO" ? (
                    <div className="space-y-3 pt-2">
                        {q.options.map((opt) => (
                           <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                             <input
                               type="radio"
                               name={`field_${q.id}`}
                               value={opt}
                               required={q.required}
                               className="peer h-5 w-5 shrink-0 rounded-full border border-border/50 text-foreground bg-background dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 checked:bg-foreground checked:border-foreground appearance-none flex items-center justify-center transition-all before:content-[''] before:block before:w-2 before:h-2 before:rounded-full before:bg-background before:scale-0 checked:before:scale-100 before:transition-transform"
                             />
                             <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-foreground/80 transition-colors">
                               {opt}
                             </span>
                           </label>
                        ))}
                        {(q as any).allowOther && (
                           <div className="space-y-3 group/other">
                             <label className="flex items-center gap-3 cursor-pointer group">
                               <input
                                 type="radio"
                                 name={`field_${q.id}`}
                                 value="__other__"
                                 required={q.required}
                                 className="peer hidden-radio h-5 w-5 shrink-0 rounded-full border border-border/50 text-foreground bg-background dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 checked:bg-foreground checked:border-foreground appearance-none flex items-center justify-center transition-all before:content-[''] before:block before:w-2 before:h-2 before:rounded-full before:bg-background before:scale-0 checked:before:scale-100 before:transition-transform"
                               />
                               <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-foreground/80 transition-colors">
                                 อื่นๆ (โปรดระบุ)
                               </span>
                             </label>
                             <div className="hidden group-has-[:checked]/other:block mt-3 animate-in fade-in slide-in-from-top-1 ml-8"> {/* Adjusted margin to align input */}
                                 <Input
                                     type="text"
                                     name={`field_${q.id}_other`}
                                     placeholder="โปรดระบุ..."
                                     className="bg-background dark:bg-zinc-900 border-border/50 h-12 rounded-xl px-4 transition-all focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground placeholder:text-muted-foreground/50 w-full"
                                     required={false}
                                 />
                             </div>
                           </div>
                        )}
                    </div>
                  ) : q.type === "CHECKBOX" ? (
                    <div className="space-y-3 pt-2">
                        {q.options.map((opt) => (
                          <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              name={`field_${q.id}`}
                              value={opt}
                              className="mt-0.5 mt-0.5 peer h-5 w-5 shrink-0 rounded-[4px] border border-border/50 text-foreground bg-background dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 checked:bg-foreground checked:border-foreground checked:text-background appearance-none flex items-center justify-center transition-all before:content-[''] before:block before:w-full before:h-full before:rounded-[2px] before:scale-0 checked:before:scale-100 before:transition-transform before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDYgOSAxNyA0 12Ij48L3BvbHlsaW5lPjwvc3ZnPg==')] before:bg-no-repeat before:bg-center before:bg-[length:12px_12px]"
                            />
                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight pt-0.5 content-center">
                              {opt}
                            </span>
                          </label>
                        ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="pt-6">
              <SubmitButton
                type="submit"
                loadingText="กำลังดำเนินการ..."
                className="w-full text-base py-6 font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-lg shadow-black/5"
              >
                ลงทะเบียน
              </SubmitButton>
            </div>
          </form>

          <p className="mt-8 text-[11px] text-muted-foreground/60 text-center font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <span>Powered by Prime Digital</span>
          </p>
        </div>

      </div>
    </div>
  )
}
