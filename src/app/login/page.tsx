'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { AlertCircle, ArrowRight, Command } from 'lucide-react';

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full h-11 text-base font-medium shadow-none hover:shadow-lg transition-all" aria-disabled={pending}>
      {pending ? 'Authenticating...' : 'Sign In'} <ArrowRight className="ml-2 w-4 h-4" />
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="h-screen w-full lg:grid lg:grid-cols-2 relative overflow-hidden bg-background">
      
      {/* LEFT: FORM SECTION */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="mx-auto grid w-[350px] gap-8">
          
          <div className="grid gap-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Command className="w-6 h-6 text-primary" />
                </div>
                <span className="font-bold text-xl tracking-tight">Prime Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the secure dashboard.
            </p>
          </div>

          <form action={dispatch} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
                className="h-11 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                required
                minLength={6}
                className="h-11 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
              />
            </div>

            {errorMessage && (
               <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-4 h-4" />
                 {errorMessage}
               </div>
            )}

            <LoginButton />
          </form>

          <div className="text-center text-xs text-muted-foreground mt-4">
             Authorized Personnel Only &bull; Secure System
          </div>
        </div>
      </div>

      {/* RIGHT: BRAND VISUAL (Hidden on mobile) */}
      <div className="hidden bg-muted lg:block relative">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
             {/* Abstract Shapes / Noise */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-20 h-full flex flex-col justify-between p-12 text-white">
            <div className="flex justify-end">
                <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium">
                    Enterprise Edition
                </div>
            </div>
            <div className="space-y-4 max-w-lg">
                <h2 className="text-4xl font-bold leading-tight">
                    "Design is not just what it looks like and feels like. Design is how it works."
                </h2>
                <p className="text-white/60 text-lg">
                    Manage your events with checking-in, analytics, and rich media integration.
                </p>
            </div>
        </div>
      </div>

    </div>
  );
}
