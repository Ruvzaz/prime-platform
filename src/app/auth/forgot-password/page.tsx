import { Shield } from "lucide-react";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

export const metadata = {
  title: 'Forgot Password | Prime Digital CTF',
  description: 'Reset your operative password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0e1418] text-[#dee3e9] p-4 relative overflow-hidden font-sans">
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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#dee3e9] mb-2 drop-shadow-md">
            RESET PASSWORD
          </h1>
          <p className="text-[#849495] font-mono text-sm uppercase tracking-widest">
            Enter email to receive reset link
          </p>
        </div>

        <div className="bg-[#161c21]/90 backdrop-blur-sm border border-[#3b494b] rounded-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"></div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
