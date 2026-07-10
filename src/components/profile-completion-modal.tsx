'use client';

import { useState, useActionState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeGoogleProfile } from '@/app/actions/challenge-auth';
import { useFormStatus } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full font-mono text-sm uppercase tracking-widest px-4 py-3 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Initializing...' : 'Complete Protocol'}
    </button>
  );
}

export function ProfileCompletionModal({ isOpen }: { isOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useActionState(completeGoogleProfile, undefined);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setOpen(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={() => {
        if (!state?.success) return; 
        setOpen(false);
    }}>
      <DialogContent 
        className="sm:max-w-[550px] bg-[#161c21]/95 backdrop-blur-xl border border-red-500/20 shadow-[0_0_40px_rgba(255,0,0,0.1)] text-[#dee3e9]"
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-[#3b494b] pb-4 mb-4">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span className="w-2 h-6 bg-red-500 rounded-sm animate-pulse"></span>
            Agent Identity Setup
          </DialogTitle>
          <DialogDescription className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-2">
            OAUTH connection established. Additional clearance data required.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="grid gap-5 py-2 max-h-[60vh] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-red-500/20 scrollbar-track-transparent">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 col-span-2 sm:col-span-1">
              <Label htmlFor="title" className="text-xs font-mono uppercase tracking-widest text-[#849495]">คำนำหน้า *</Label>
              <Input id="title" type="text" name="title" required placeholder="นาย/นางสาว/..." className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded" />
              {state?.details?.title && <p className="text-xs text-red-500 font-mono">{state.details.title[0]}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName" className="text-xs font-mono uppercase tracking-widest text-[#849495]">ชื่อ *</Label>
              <Input id="firstName" type="text" name="firstName" required placeholder="ชื่อจริง" className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded" />
              {state?.details?.firstName && <p className="text-xs text-red-500 font-mono">{state.details.firstName[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName" className="text-xs font-mono uppercase tracking-widest text-[#849495]">นามสกุล *</Label>
              <Input id="lastName" type="text" name="lastName" required placeholder="นามสกุล" className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded" />
              {state?.details?.lastName && <p className="text-xs text-red-500 font-mono">{state.details.lastName[0]}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gender" className="text-xs font-mono uppercase tracking-widest text-[#849495]">เพศ *</Label>
            <select id="gender" name="gender" required className="flex h-10 w-full items-center justify-between rounded-md border border-[#3b494b] bg-[#090f13] px-3 py-2 text-sm text-[#dee3e9] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500">
              <option value="">เลือกเพศ</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
              <option value="อื่นๆ">อื่นๆ</option>
              <option value="ไม่ระบุ">ไม่ระบุ</option>
            </select>
            {state?.details?.gender && <p className="text-xs text-red-500 font-mono">{state.details.gender[0]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="institution" className="text-xs font-mono uppercase tracking-widest text-[#849495]">องค์กร/สถาบัน *</Label>
            <Input id="institution" type="text" name="institution" required placeholder="ชื่อหน่วยงาน" className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded" />
            {state?.details?.institution && <p className="text-xs text-red-500 font-mono">{state.details.institution[0]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="educationLevel" className="text-xs font-mono uppercase tracking-widest text-[#849495]">ระดับการศึกษา/ตำแหน่งงาน *</Label>
            <Input id="educationLevel" type="text" name="educationLevel" required placeholder="ระดับ/ตำแหน่ง" className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded" />
            {state?.details?.educationLevel && <p className="text-xs text-red-500 font-mono">{state.details.educationLevel[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="text-xs font-mono uppercase tracking-widest text-[#849495]">โทรศัพท์ *</Label>
              <Input id="phoneNumber" type="tel" name="phoneNumber" required placeholder="08xxxxxxxx" className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded" />
              {state?.details?.phoneNumber && <p className="text-xs text-red-500 font-mono">{state.details.phoneNumber[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-xs font-mono uppercase tracking-widest text-[#849495]">Agent Alias (Username) *</Label>
              <Input id="username" type="text" name="username" required placeholder="Codename" className="bg-[#090f13] border-[#3b494b] text-[#dee3e9] focus:border-red-500 focus:ring-red-500/20 rounded font-mono" />
              {state?.details?.username && <p className="text-xs text-red-500 font-mono">{state.details.username[0]}</p>}
            </div>
          </div>

          {state?.error && !state.details && (
            <div className="p-3 mt-2 text-sm text-red-500 bg-red-500/10 rounded-md flex items-center gap-2 border border-red-500/20 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="pt-6 border-t border-[#3b494b] mt-2">
             <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
