import Link from "next/link"
import { CheckCircle, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { QRCodeDisplay } from "@/components/ui/qr-code-display"
import { ThemeToggle } from "@/components/theme-toggle"
import { notFound } from "next/navigation"

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code: string }>;
}) {
  const { slug } = await params
  const { code } = await searchParams

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { title: true, imageUrl: true, themeColor: true }
  });

  if (!event) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const checkInUrl = code ? `${baseUrl}/check-in/auto/${code}` : ''

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground transition-colors duration-500">
      {/* === BACKGROUND EFFECTS === */}
      <div className="absolute inset-0 z-0 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
         {/* Subtle premium glows instead of colorful pulses */}
         <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] rounded-full blur-[120px] bg-black/5 dark:bg-white/5" />
         <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full blur-[140px] bg-black/5 dark:bg-white/5" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.06] mix-blend-overlay"></div>
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
           <ThemeToggle />
        </div>

        {/* Theme Aware Card */}
        <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl shadow-xl overflow-hidden text-center transition-colors duration-500">


          {/* Success Icon & Title */}
          <div className="px-6 md:px-8 pt-8 pb-0">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-primary/10 text-primary">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2">ลงทะเบียนสำเร็จ!</h1>
            <p className="text-muted-foreground text-sm">
              คุณได้ลงทะเบียนงาน <span className="font-semibold text-foreground">{event.title}</span> เรียบร้อยแล้ว
            </p>
          </div>

          {/* Reference Code */}
          <div className="px-6 md:px-8 pt-6">
            <div className="rounded-xl border border-border bg-muted/30 p-5 relative overflow-hidden">
              <p className="text-xs uppercase tracking-wider font-semibold mb-2 text-foreground/70">รหัสอ้างอิง</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-foreground">{code || "UNKNOWN"}</p>
            </div>
          </div>

          {/* QR Code */}
          {checkInUrl && (
            <div className="px-6 md:px-8 pt-5">
              <QRCodeDisplay value={checkInUrl} size={180} />
            </div>
          )}

          {/* Email notification */}
          <div className="px-6 md:px-8 pt-5">
            <div className="flex items-center justify-center gap-2 text-sm p-3 rounded-lg bg-primary/5 text-primary">
              <Mail className="w-4 h-4" />
              <span>อีเมลยืนยันถูกส่งเรียบร้อยแล้ว</span>
            </div>
          </div>

          {/* Info text */}
          <div className="px-6 md:px-8 pt-4">
            <p className="text-xs text-muted-foreground/80">
              แสดง QR Code หรือรหัสอ้างอิงนี้ที่จุดลงทะเบียน
            </p>
          </div>

          {/* Back button */}
          <div className="px-6 md:px-8 py-6">
            <Button
              variant="outline"
              asChild
              className="w-full border-border text-foreground hover:bg-muted"
            >
              <Link href={`/events/${slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> กลับไปหน้างาน
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-6">
          Powered by Prime Digital Consultant
        </p>
      </div>
    </div>
  )
}
