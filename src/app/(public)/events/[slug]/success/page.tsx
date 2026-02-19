import Link from "next/link"
import { CheckCircle, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { QRCodeDisplay } from "@/components/ui/qr-code-display"
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

  const themeColor = event.themeColor || '#10b981'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const checkInUrl = code ? `${baseUrl}/check-in/auto/${code}` : ''

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white">

      {/* === BACKGROUND EFFECTS === */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] animate-pulse" style={{ background: themeColor, opacity: 0.25 }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] animate-pulse" style={{ background: themeColor, opacity: 0.15, animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">

        {/* White Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden text-center">

          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)` }} />

          {/* Success Icon & Title */}
          <div className="px-6 md:px-8 pt-8 pb-0">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: `${themeColor}15` }}>
              <CheckCircle className="w-8 h-8" style={{ color: themeColor }} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">ลงทะเบียนสำเร็จ!</h1>
            <p className="text-gray-500 text-sm">
              คุณได้ลงทะเบียนงาน <span className="font-semibold text-gray-900">{event.title}</span> เรียบร้อยแล้ว
            </p>
          </div>

          {/* Reference Code */}
          <div className="px-6 md:px-8 pt-6">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${themeColor}50, transparent)` }} />
              <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: themeColor }}>รหัสอ้างอิง</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-gray-900">{code || "UNKNOWN"}</p>
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
            <div className="flex items-center justify-center gap-2 text-sm p-3 rounded-lg" style={{ background: `${themeColor}10`, color: themeColor }}>
              <Mail className="w-4 h-4" />
              <span>อีเมลยืนยันถูกส่งเรียบร้อยแล้ว</span>
            </div>
          </div>

          {/* Info text */}
          <div className="px-6 md:px-8 pt-4">
            <p className="text-xs text-gray-400">
              แสดง QR Code หรือรหัสอ้างอิงนี้ที่จุดลงทะเบียน
            </p>
          </div>

          {/* Back button */}
          <div className="px-6 md:px-8 py-6">
            <Button
              variant="outline"
              asChild
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Link href={`/events/${slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> กลับไปหน้างาน
              </Link>
            </Button>
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
