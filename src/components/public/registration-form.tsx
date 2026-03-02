"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/submit-button"
import { registerAttendee } from "@/app/actions/registration"
import { FileUpload } from "@/components/public/file-upload"

interface RegistrationFormProps {
  event: {
    id: string
    slug: string
    formFields: any[]
  }
}

const initialState = {
  success: false,
  message: "",
  redirectUrl: ""
}

export function RegistrationForm({ event }: RegistrationFormProps) {
  const [state, formAction] = useActionState(registerAttendee, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success && state.redirectUrl) {
      // Optional: Add a slight delay for the user to read the success message
      const timer = setTimeout(() => {
        router.push(state.redirectUrl as string)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.success, state.redirectUrl, router])

  return (
    <div className="p-6 md:p-10 bg-muted/30 dark:bg-zinc-950/50">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-base font-bold text-foreground">
          ลงทะเบียนเข้าร่วมงาน
        </h2>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {state.message && !state.success && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{state.message}</p>
        </div>
      )}

      {state.success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{state.message}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
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
                  disabled={state.success}
                  className="bg-background dark:bg-zinc-900 border-border/50 h-12 rounded-xl px-4 transition-all focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground placeholder:text-muted-foreground/50"
                />
              ) : q.type === "SELECT" ? (
                <div className="group/select relative">
                  <select
                    id={q.id}
                    name={`field_${q.id}`}
                    className="flex h-12 w-full items-center rounded-xl border border-border/50 bg-background dark:bg-zinc-900 px-4 py-2 text-sm text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground appearance-none cursor-pointer disabled:opacity-50"
                    required={q.required}
                    disabled={state.success}
                  >
                    <option value="">เลือกตัวเลือก</option>
                    {q.options.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : (q.type as string) === "RADIO" ? (
                <div className="space-y-3 pt-2">
                  {q.options.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`field_${q.id}`}
                        value={opt}
                        required={q.required}
                        disabled={state.success}
                        className="peer h-5 w-5 shrink-0 rounded-full border border-border/50 text-foreground bg-background dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 checked:bg-foreground checked:border-foreground appearance-none flex items-center justify-center transition-all before:content-[''] before:block before:w-2 before:h-2 before:rounded-full before:bg-background before:scale-0 checked:before:scale-100 before:transition-transform"
                      />
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-foreground/80 transition-colors">
                        {opt}
                      </span>
                    </label>
                  ))}
                  {q.allowOther && (
                    <div className="space-y-3 group/other">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name={`field_${q.id}`}
                          value="__other__"
                          required={q.required}
                          disabled={state.success}
                          className="peer hidden-radio h-5 w-5 shrink-0 rounded-full border border-border/50 text-foreground bg-background dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 checked:bg-foreground checked:border-foreground appearance-none flex items-center justify-center transition-all before:content-[''] before:block before:w-2 before:h-2 before:rounded-full before:bg-background before:scale-0 checked:before:scale-100 before:transition-transform"
                        />
                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-foreground/80 transition-colors">
                          อื่นๆ (โปรดระบุ)
                        </span>
                      </label>
                      <div className="hidden group-has-[:checked]/other:block mt-3 animate-in fade-in slide-in-from-top-1 ml-8">
                        <Input
                          type="text"
                          name={`field_${q.id}_other`}
                          placeholder="โปรดระบุ..."
                          disabled={state.success}
                          className="bg-background dark:bg-zinc-900 border-border/50 h-12 rounded-xl px-4 transition-all focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground placeholder:text-muted-foreground/50 w-full"
                          required={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : q.type === "CHECKBOX" ? (
                <div className="space-y-3 pt-2">
                  {q.options.map((opt: string) => (
                    <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name={`field_${q.id}`}
                        value={opt}
                        disabled={state.success}
                        className="mt-0.5 peer h-5 w-5 shrink-0 rounded-[4px] border border-border/50 text-foreground bg-background dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50 checked:bg-foreground checked:border-foreground checked:text-background appearance-none flex items-center justify-center transition-all before:content-[''] before:block before:w-full before:h-full before:rounded-[2px] before:scale-0 checked:before:scale-100 before:transition-transform before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDYgOSAxNyA0 12Ij48L3BvbHlsaW5lPjwvc3ZnPg==')] before:bg-no-repeat before:bg-center before:bg-[length:12px_12px]"
                      />
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight pt-0.5 content-center">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              ) : q.type === "FILE" ? (
                <div className="pt-2">
                  <FileUpload
                    id={q.id}
                    name={`field_${q.id}`}
                    eventSlug={event.slug}
                    required={q.required}
                    disabled={state.success}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="pt-6">
          <SubmitButton
            type="submit"
            loadingText="กำลังดำเนินการ..."
            disabled={state.success}
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
  )
}
