'use client';

import { useActionState } from 'react';
import { updateParticipantProfile } from '@/app/actions/challenge-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="w-full h-12 font-mono text-sm uppercase tracking-widest px-6 py-2.5 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 shadow-[0_0_15px_rgba(255,0,0,0.3)] rounded flex items-center justify-center mt-4" disabled={pending}>
      {pending ? '[ UPDATING DIAGNOSTICS... ]' : 'SAVE DIAGNOSTICS'}
    </button>
  );
}

export function ProfileForm({ defaultValues }: { defaultValues: any }) {
  const [state, dispatch] = useActionState(updateParticipantProfile, undefined);

  return (
    <div className="max-w-2xl mx-auto bg-[#161c21]/80 backdrop-blur-md rounded-xl border border-[#3b494b] shadow-[0_0_20px_rgba(255,0,0,0.05)] overflow-hidden">
      <div className="p-6 border-b border-[#3b494b]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
            <UserCog className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-[#dee3e9]">Profile Diagnostics</h2>
            <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-1">Update your operative information</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {state?.success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-mono text-sm uppercase tracking-wider rounded flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-bold">{state.message}</p>
          </div>
        )}

        <form action={dispatch} className="grid gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="font-mono text-xs uppercase tracking-widest text-[#849495]">คำนำหน้า *</Label>
              <Input id="title" type="text" name="title" defaultValue={defaultValues.title || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" />
              {state?.details?.title && <p className="text-xs text-red-500 font-mono">{state.details.title[0]}</p>}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="gender" className="font-mono text-xs uppercase tracking-widest text-[#849495]">เพศ *</Label>
              <select id="gender" name="gender" defaultValue={defaultValues.gender || ''} required className="flex h-11 w-full items-center justify-between rounded-md border border-[#3b494b] bg-[#0e1418] px-3 py-2 text-sm text-[#dee3e9] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono">
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
              <Input id="firstName" type="text" name="firstName" defaultValue={defaultValues.firstName || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" />
              {state?.details?.firstName && <p className="text-xs text-red-500 font-mono">{state.details.firstName[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName" className="font-mono text-xs uppercase tracking-widest text-[#849495]">นามสกุล *</Label>
              <Input id="lastName" type="text" name="lastName" defaultValue={defaultValues.lastName || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" />
              {state?.details?.lastName && <p className="text-xs text-red-500 font-mono">{state.details.lastName[0]}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="institution" className="font-mono text-xs uppercase tracking-widest text-[#849495]">โรงเรียน/สถาบัน/หน่วยงาน *</Label>
            <Input id="institution" type="text" name="institution" defaultValue={defaultValues.institution || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" />
            {state?.details?.institution && <p className="text-xs text-red-500 font-mono">{state.details.institution[0]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="educationLevel" className="font-mono text-xs uppercase tracking-widest text-[#849495]">ระดับการศึกษา/ชั้นปี/ตำแหน่งงาน *</Label>
            <Input id="educationLevel" type="text" name="educationLevel" defaultValue={defaultValues.educationLevel || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" />
            {state?.details?.educationLevel && <p className="text-xs text-red-500 font-mono">{state.details.educationLevel[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="font-mono text-xs uppercase tracking-widest text-[#849495]">เบอร์โทร *</Label>
              <Input id="phoneNumber" type="tel" name="phoneNumber" maxLength={10} defaultValue={defaultValues.phoneNumber || ''} required className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm" />
              {state?.details?.phoneNumber && <p className="text-xs text-red-500 font-mono">{state.details.phoneNumber[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label className="font-mono text-xs uppercase tracking-widest text-[#849495]">Username (Restricted)</Label>
              <Input id="username" type="text" value={defaultValues.username || ''} disabled className="h-11 bg-[#0e1418]/50 border-[#3b494b]/50 text-[#849495] font-mono opacity-70 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid gap-2 mt-2 pt-4 border-t border-[#3b494b]">
            <Label className="font-mono text-xs uppercase tracking-widest text-[#849495]">Email (Restricted)</Label>
            <Input type="email" value={defaultValues.email || ''} disabled className="h-11 bg-[#0e1418]/50 border-[#3b494b]/50 text-[#849495] font-mono opacity-70 cursor-not-allowed" />
          </div>

          {state?.error && !state.details && (
            <div className="p-3 text-xs font-mono uppercase tracking-wider text-red-500 bg-red-500/10 rounded border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>[ERROR] {state.error}</span>
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
