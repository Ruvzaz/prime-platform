import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CheckCircle, AlertCircle, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { extractAttendeeInfo } from "@/lib/attendee-utils"

export default async function AutoCheckInPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const session = await auth()

  // If not authenticated as ADMIN or STAFF, redirect to login
  if (!session?.user?.id || !["ADMIN", "STAFF"].includes(session.user.role || "")) {
    redirect(`/login?callbackUrl=/check-in/auto/${code}`)
  }

  // Find the registration
  const registration = await prisma.registration.findUnique({
    where: { referenceCode: code.toUpperCase() },
    include: {
      event: true,
      checkIn: true,
    },
  })

  if (!registration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">Reference code <span className="font-mono font-semibold text-foreground">{code}</span> does not match any registration.</p>
          <Button asChild>
            <Link href="/check-in">Go to Check-In</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { name, email } = extractAttendeeInfo(registration.formData as Record<string, unknown>)

  // Already checked in
  if (registration.checkIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">Already Checked In</h1>
          <div className="space-y-1 mb-4">
            <p className="text-sm font-medium">{String(name)}</p>
            <p className="text-xs text-muted-foreground">{String(email)}</p>
            <p className="text-xs text-muted-foreground">{registration.event.title}</p>
          </div>
          <p className="text-xs text-muted-foreground/70 mb-6">
            Checked in at {registration.checkIn.scannedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <Button asChild variant="outline">
            <Link href="/check-in">Back to Check-In</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Perform check-in
  try {
    await prisma.$transaction([
      prisma.checkIn.create({
        data: {
          registrationId: registration.id,
          staffId: session.user.id,
        },
      }),
      prisma.registration.update({
        where: { id: registration.id },
        data: { status: "CONFIRMED" },
      }),
    ])
  } catch (error: any) {
    if (error?.code === "P2002") {
      // Concurrent check-in
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold mb-2">Already Checked In</h1>
            <p className="text-muted-foreground text-sm mb-6">This attendee was checked in by another device.</p>
            <Button asChild variant="outline">
              <Link href="/check-in">Back to Check-In</Link>
            </Button>
          </div>
        </div>
      )
    }
    throw error
  }

  // Success
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">Check-In Successful!</h1>
        <div className="space-y-1 mb-2">
          <p className="text-sm font-medium">{String(name)}</p>
          <p className="text-xs text-muted-foreground">{String(email)}</p>
        </div>
        <div className="rounded-lg bg-muted border border-border px-3 py-2 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Event</p>
          <p className="text-sm font-semibold text-foreground">{registration.event.title}</p>
        </div>
        <Button asChild>
          <Link href="/check-in">Continue Scanning</Link>
        </Button>
      </div>
    </div>
  )
}
