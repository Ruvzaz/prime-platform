"use client";

import { useActionState } from "react";
import {
  participantLogin,
  participantGoogleLogin,
} from "@/app/actions/challenge-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { AlertCircle, Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full h-12 font-mono text-sm uppercase tracking-widest px-6 py-2.5 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 shadow-[0_0_15px_rgba(255,0,0,0.3)] rounded flex items-center justify-center"
      aria-disabled={pending}
    >
      {pending ? "[ AUTHENTICATING... ]" : "INITIATE LOGIN"}
    </button>
  );
}

export default function ParticipantLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ParticipantLoginContent />
    </Suspense>
  );
}

function ParticipantLoginContent() {
  const [state, dispatch] = useActionState(participantLogin, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/challenge";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e1418] text-[#dee3e9] p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6mrreimdAPR8FpnYEXFX-1amzuBgW1PogUqROHYlhkZ8VnZFygrGX_UOlNb-CrbktHxGhZLKnRzlpQkI1rzAnSRBznHF4pg7eBGtaxcTWdbIPPz7Sx14FOARxUiyzbG4fz-gBEIDgcmXPVYMy5lbSa1b41mR5a5axpK58s-ne7VNz8R8aabf2gbbb5J4vPvDpvSR-9S-Ph3To1GOZOkiOUA7jHuW8bjhAmb-1SDVPoANzeMnndeDMK3Tmfs1mFwracQ0hEUC-XsU')",
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1418] via-[#0e1418]/80 to-transparent z-0"></div>

      <div className="w-full max-w-[400px] space-y-8 relative z-10 border border-[#3b494b] bg-[#161c21]/80 backdrop-blur-xl p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/30">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            N
            <span className="text-blue-500">
              C
              <span className="text-red-500">
                S<span className="text-white">A </span>
              </span>
            </span>
            CTF
          </h1>
          <p className="font-mono text-xs text-[#849495] mt-2 uppercase tracking-widest">
            Identify Yourself, Operative
          </p>
        </div>

        <div className="grid gap-6">
          <form action={participantGoogleLogin}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <button
              type="submit"
              className="w-full h-12 font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#3b494b] bg-[#0e1418] text-[#dee3e9] font-bold hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-150 rounded flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google SIGN IN
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#3b494b]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
              <span className="bg-[#161c21] px-3 text-[#849495]">
                Or Standard Credentials
              </span>
            </div>
          </div>

          <form action={dispatch} className="grid gap-5">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="font-mono text-xs uppercase tracking-widest text-[#849495]"
              >
                Email or Username
              </Label>
              <Input
                id="email"
                type="text"
                name="email"
                required
                placeholder="operative@network.com"
                className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 focus-visible:border-red-500 font-mono text-sm"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="font-mono text-xs uppercase tracking-widest text-[#849495]"
                >
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                required
                className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] focus-visible:ring-red-500 focus-visible:border-red-500 font-mono"
              />
            </div>

            {state?.error && (
              <div className="p-3 text-xs font-mono uppercase tracking-wider text-red-500 bg-red-500/10 rounded border border-red-500/30 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>[ERROR] {state.error}</span>
              </div>
            )}

            <div className="pt-2">
              <LoginButton />
            </div>
          </form>
        </div>

        <div className="text-center pt-4 border-t border-[#3b494b]">
          <p className="font-mono text-xs text-[#849495] uppercase tracking-widest">
            No active profile?{" "}
            <Link
              href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-red-500 hover:text-red-400 underline decoration-red-500/30 underline-offset-4 ml-1 font-bold"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
