'use client';

import { useActionState, useTransition } from "react";
import { resetPasswordWithToken } from "@/app/actions/challenge-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, dispatch] = useActionState(resetPasswordWithToken, undefined);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(() => {
      dispatch(new FormData(e.currentTarget));
    });
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest font-mono">Invalid Link</h3>
        <p className="text-sm text-[#849495]">The password reset link is missing or invalid.</p>
        <Link href="/auth/forgot-password" className="block pt-4">
          <Button variant="outline" className="w-full border-[#3b494b] text-[#dee3e9] hover:bg-[#3b494b]/50">Request New Link</Button>
        </Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-lg font-bold text-emerald-500 uppercase tracking-widest font-mono">Password Updated</h3>
        <p className="text-sm text-[#849495]">{state.message}</p>
        <Link href="/auth/login" className="block pt-4">
          <Button className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-sm uppercase tracking-widest">
            Proceed to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      
      {state?.error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{state.error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-mono text-xs uppercase tracking-widest text-[#849495]">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#849495]" />
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="h-11 pl-9 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500"
            />
          </div>
          <p className="text-[10px] text-[#849495]">Must be 8+ chars with uppercase, lowercase, and number.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-mono text-xs uppercase tracking-widest text-[#849495]">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#849495]" />
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              className="h-11 pl-9 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-mono text-sm uppercase tracking-widest">
        {isPending ? 'Updating...' : 'Set Password'}
      </Button>
    </form>
  );
}
