'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { AlertCircle, ArrowRight, Shield, Fingerprint, Lock } from 'lucide-react';

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      className="w-full h-12 text-base font-semibold tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]" 
      aria-disabled={pending}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Authenticating...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          Sign In <ArrowRight className="w-4 h-4" />
        </span>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  return (
    <div className="h-screen w-full lg:grid lg:grid-cols-5 relative overflow-hidden">
      
      {/* LEFT: FORM SECTION (2/5 width on desktop) */}
      <div className="col-span-2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative z-10">

        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-[0.04]" />

        <div className="relative mx-auto grid w-full max-w-[380px] gap-10">
          
          {/* Brand Header */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-background" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight block leading-none">Prime Digital</span>
                  <span className="text-[11px] text-muted-foreground tracking-wider uppercase font-medium">Admin Console</span>
                </div>
            </div>
            <div className="mt-4">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground mt-1.5 text-[15px]">
                Sign in to manage your events and operations.
              </p>
            </div>
          </div>

          {/* Form */}
          <form action={dispatch} className="grid gap-5">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="admin@primedigital.com"
                required
                className="h-12 bg-muted/40 border-border focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10 transition-all rounded-xl text-[15px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="h-12 bg-muted/40 border-border focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10 transition-all rounded-xl text-[15px]"
              />
            </div>

            {errorMessage && (
               <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 border border-destructive/20">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 {errorMessage}
               </div>
            )}

            <LoginButton />
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <Lock className="w-3 h-3" />
            <span>Authorized Personnel Only</span>
            <span className="text-muted-foreground/30">•</span>
            <span>Encrypted Connection</span>
          </div>
        </div>
      </div>

      {/* RIGHT: BRAND VISUAL (3/5 width, hidden on mobile) */}
      <div className="hidden lg:flex col-span-3 relative bg-zinc-950 items-center justify-center overflow-hidden">
        
        {/* Layered background effects */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          
          {/* Radial glow - top */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.03] rounded-full blur-[100px]" />
          
          {/* Radial glow - bottom accent */}
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px]" />
          
          {/* Noise texture */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25] mix-blend-overlay" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-14 max-w-2xl">
          
          {/* Top bar */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">System Online</span>
            </div>
            <div className="px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm text-[11px] font-medium text-zinc-400 tracking-wider uppercase">
                Enterprise v2.0
            </div>
          </div>

          {/* Center content - Hero */}
          <div className="flex-1 flex items-center">
            <div className="space-y-8">
              {/* Decorative line */}
              <div className="w-12 h-px bg-gradient-to-r from-white/40 to-transparent" />
              
              <blockquote className="text-[2.5rem] font-bold leading-[1.15] text-white tracking-tight">
                Your events.<br />
                <span className="text-zinc-500">Brilliantly managed.</span>
              </blockquote>
              
              <p className="text-zinc-500 text-base leading-relaxed max-w-md">
                Registration, check-in, analytics, and attendee management — all in one seamless platform built for scale.
              </p>

              {/* Feature pillars */}
              <div className="flex gap-6 pt-4">
                <div className="flex items-center gap-2.5 text-zinc-500">
                  <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                    <Fingerprint className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-xs font-medium">QR Check-in</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-500">
                  <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  </div>
                  <span className="text-xs font-medium">Live Analytics</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-500">
                  <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-xs font-medium">Secure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Company branding */}
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-zinc-600 tracking-wider">
              © 2026 Prime Digital Consultant
            </div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
