'use client';

import { useActionState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions/challenge-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ForgotPasswordForm() {
  const [state, dispatch] = useActionState(requestPasswordReset, undefined);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(() => {
      dispatch(new FormData(e.currentTarget));
    });
  };

  if (state?.success) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-lg font-bold text-emerald-500 uppercase tracking-widest font-mono">Link Sent</h3>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Link href="/auth/login" className="block pt-4">
          <Button variant="outline" className="w-full border-[#3b494b] text-[#dee3e9] hover:bg-[#3b494b]/50">Return to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state?.error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{state.error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-[#849495]">Email Address</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          required 
          placeholder="operative@prime.com"
          className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-mono text-sm uppercase tracking-widest">
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <div className="text-center">
        <Link href="/auth/login" className="inline-flex items-center text-xs font-mono text-[#849495] hover:text-red-400 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" />
          Back to Login
        </Link>
      </div>
    </form>
  );
}
