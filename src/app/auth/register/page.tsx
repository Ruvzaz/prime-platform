'use client';

import { useActionState } from 'react';
import { registerParticipant } from '@/app/actions/challenge-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';

function RegisterButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="w-full h-12 font-mono text-sm uppercase tracking-widest px-6 py-2.5 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 shadow-[0_0_15px_rgba(255,0,0,0.3)] rounded flex items-center justify-center mt-4" aria-disabled={pending}>
      {pending ? '[ INITIALIZING PROFILE... ]' : 'REGISTER OPERATIVE'}
    </button>
  );
}

export default function ParticipantRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ParticipantRegisterContent />
    </Suspense>
  );
}

function ParticipantRegisterContent() {
  const [state, dispatch] = useActionState(registerParticipant, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/challenge';
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("privacy_accepted");
    if (accepted !== "true") {
      setHasAcceptedPrivacy(false);
      setShowPrivacyModal(true);
    }
  }, []);
  
  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0e1418] text-[#dee3e9] relative overflow-hidden font-sans">
        <div className="max-w-md w-full text-center space-y-6 relative z-10 border border-emerald-500/30 bg-[#161c21]/80 backdrop-blur-xl p-10 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto animate-in zoom-in drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <h1 className="text-3xl font-black tracking-tighter uppercase">Registration Successful!</h1>
          <p className="text-[#b9cacb] leading-relaxed font-mono text-sm">{state.message}</p>
          <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="inline-block mt-4">
            <button className="font-mono text-xs uppercase tracking-widest px-6 py-3 border border-emerald-500 text-emerald-500 font-bold hover:bg-emerald-500/10 active:scale-95 transition-all duration-150 rounded">
              Proceed to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e1418] text-[#dee3e9] p-4 relative overflow-hidden font-sans pt-12 pb-12">
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        mode="pre-auth" 
        onAcceptClient={() => {
          setHasAcceptedPrivacy(true);
          setShowPrivacyModal(false);
        }}
      />
      {/* Background Cyber Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10 mix-blend-screen pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6mrreimdAPR8FpnYEXFX-1amzuBgW1PogUqROHYlhkZ8VnZFygrGX_UOlNb-CrbktHxGhZLKnRzlpQkI1rzAnSRBznHF4pg7eBGtaxcTWdbIPPz7Sx14FOARxUiyzbG4fz-gBEIDgcmXPVYMy5lbSa1b41mR5a5axpK58s-ne7VNz8R8aabf2gbbb5J4vPvDpvSR-9S-Ph3To1GOZOkiOUA7jHuW8bjhAmb-1SDVPoANzeMnndeDMK3Tmfs1mFwracQ0hEUC-XsU')" }}></div>

      <div className="w-full max-w-2xl space-y-8 relative z-10 border border-[#3b494b] bg-[#161c21]/80 backdrop-blur-xl p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/30">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">CYBER<span className="text-red-500">HUB</span></h1>
          <p className="font-mono text-xs text-[#849495] mt-2 uppercase tracking-widest">Enlist in the Network</p>
        </div>

        <form action={dispatch} className="grid gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="font-mono text-xs uppercase tracking-widest text-[#849495]">คำนำหน้า *</Label>
              <Input id="title" type="text" name="title" defaultValue={state?.data?.title as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="นาย/นางสาว/..." />
              {state?.details?.title && <p className="text-xs text-red-500 font-mono">{state.details.title[0]}</p>}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="gender" className="font-mono text-xs uppercase tracking-widest text-[#849495]">เพศ *</Label>
              <select id="gender" name="gender" defaultValue={state?.data?.gender as string || ''} required className="flex h-11 w-full items-center justify-between rounded-md border border-[#3b494b] bg-[#0e1418] px-3 py-2 text-sm text-[#dee3e9] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono">
                <option value="">เลือกเพศ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
              {state?.details?.gender && <p className="text-xs text-red-500 font-mono">{state.details.gender[0]}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName" className="font-mono text-xs uppercase tracking-widest text-[#849495]">ชื่อ *</Label>
              <Input id="firstName" type="text" name="firstName" defaultValue={state?.data?.firstName as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="ชื่อจริง" />
              {state?.details?.firstName && <p className="text-xs text-red-500 font-mono">{state.details.firstName[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName" className="font-mono text-xs uppercase tracking-widest text-[#849495]">นามสกุล *</Label>
              <Input id="lastName" type="text" name="lastName" defaultValue={state?.data?.lastName as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="นามสกุล" />
              {state?.details?.lastName && <p className="text-xs text-red-500 font-mono">{state.details.lastName[0]}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="institution" className="font-mono text-xs uppercase tracking-widest text-[#849495]">โรงเรียน/สถาบัน/หน่วยงาน *</Label>
            <Input id="institution" type="text" name="institution" defaultValue={state?.data?.institution as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="ชื่อสถาบัน" />
            {state?.details?.institution && <p className="text-xs text-red-500 font-mono">{state.details.institution[0]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="educationLevel" className="font-mono text-xs uppercase tracking-widest text-[#849495]">ระดับการศึกษา/ชั้นปี/ตำแหน่งงาน *</Label>
            <Input id="educationLevel" type="text" name="educationLevel" defaultValue={state?.data?.educationLevel as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="ระดับการศึกษา" />
            {state?.details?.educationLevel && <p className="text-xs text-red-500 font-mono">{state.details.educationLevel[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="font-mono text-xs uppercase tracking-widest text-[#849495]">เบอร์โทร *</Label>
              <Input id="phoneNumber" type="tel" name="phoneNumber" maxLength={10} defaultValue={state?.data?.phoneNumber as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="08xxxxxxxx" />
              {state?.details?.phoneNumber && <p className="text-xs text-red-500 font-mono">{state.details.phoneNumber[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-[#849495]">อีเมล *</Label>
              <Input id="email" type="email" name="email" defaultValue={state?.data?.email as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="email@example.com" />
              {state?.details?.email && <p className="text-xs text-red-500 font-mono">{state.details.email[0]}</p>}
            </div>
          </div>

          <div className="grid gap-2 mt-4 pt-4 border-t border-[#3b494b]">
            <Label htmlFor="username" className="font-mono text-xs uppercase tracking-widest text-red-500">Access Credentials</Label>
            <Input id="username" type="text" name="username" defaultValue={state?.data?.username as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm mt-2" placeholder="Operative Username" />
            {state?.details?.username && <p className="text-xs text-red-500 font-mono">{state.details.username[0]}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-widest text-[#849495]">Password *</Label>
              <Input id="password" type="password" name="password" defaultValue={state?.data?.password as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="••••••••" />
              {state?.details?.password && (
                <ul className="text-xs text-red-500 font-mono list-disc list-inside mt-1">
                  {state.details.password.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="font-mono text-xs uppercase tracking-widest text-[#849495]">Confirm Password *</Label>
              <Input id="confirmPassword" type="password" name="confirmPassword" defaultValue={state?.data?.confirmPassword as string || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" placeholder="••••••••" />
              {state?.details?.confirmPassword && <p className="text-xs text-red-500 font-mono">{state.details.confirmPassword[0]}</p>}
            </div>
          </div>

          {state?.error && !state.details && (
            <div className="p-3 mt-2 text-xs font-mono uppercase tracking-wider text-red-500 bg-red-500/10 rounded border border-red-500/30 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>[ERROR] {state.error}</span>
            </div>
          )}

          <RegisterButton />
        </form>

        <div className="text-center pt-4 border-t border-[#3b494b]">
          <p className="font-mono text-xs text-[#849495] uppercase tracking-widest">
            Already have an account? <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-red-500 hover:text-red-400 underline decoration-red-500/30 underline-offset-4 ml-1 font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
