import Link from "next/link"
import { ArrowLeft, FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* 
        The global background (body::before/after) from globals.css will render underneath this 
        so we just use abstract transparency to let the animated blue blobs shine through.
      */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8 p-10 backdrop-blur-3xl bg-white/40 border border-white/50 rounded-[2rem] shadow-2xl shadow-black/5 dark:bg-zinc-950/40 dark:border-zinc-800/50">
        
        {/* Animated Icon Container */}
        <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative shadow-inner ring-1 ring-primary/20 backdrop-blur-md">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary"></div>
          <FileQuestion className="w-12 h-12 text-primary relative z-10" />
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-7xl font-black tracking-tighter text-foreground">
            404
          </h1>
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90">
            ขออภัย ไม่พบหน้าที่คุณต้องการ
          </h2>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
            หน้าเว็บที่คุณกำลังค้นหาอาจถูกลบออก เปลี่ยนชื่อ หรือไม่มีอยู่จริงในระบบชั่วคราว
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-foreground text-background font-bold hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-lg shadow-black/5 gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
      
      {/* Powered by Signature */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
         <p className="text-[11px] font-bold tracking-[0.2em] text-foreground/30 uppercase">
            Powered by Prime Digital
         </p>
      </div>
    </div>
  )
}
