"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const TARGET_DATE = new Date("2026-08-12T23:59:59+07:00").getTime();

export function RegistrationCountdown({
  hasActiveChallenges = true,
}: {
  hasActiveChallenges?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = (): TimeLeft => {
      const now = Date.now();
      const difference = TARGET_DATE - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    // Skeleton loader to prevent layout shift during SSR hydration
    return (
      <div className="mt-8 flex flex-col items-center justify-center">
        <div className="h-20 w-80 max-w-full bg-[#161c21]/60 border border-[#3b494b]/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // If Admin has turned off all challenges, show Closed
  if (!hasActiveChallenges) {
    return (
      <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 font-mono text-sm uppercase tracking-wider backdrop-blur-md">
        <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
        <span>ปิดรับสมัครแล้ว (Registration Closed)</span>
      </div>
    );
  }

  // If time expired but Admin has active challenges open, show Open Badge
  if (timeLeft.isExpired) {
    return (
      <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-sm uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(52,211,153,0.15)]">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
        <span>เปิดรับสมัครเข้าร่วมการแข่งขัน (Registration Open)</span>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-center">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-mono uppercase tracking-widest mb-4 backdrop-blur-md">
        <Clock className="w-4 h-4 text-red-500 animate-spin-slow" />
        <span>เปิดรับสมัครเข้าร่วมการแข่งขัน</span>
      </div>

      {/* Countdown Cards */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-red-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative min-w-[64px] sm:min-w-[80px] h-16 sm:h-20 px-3 sm:px-4 bg-[#161c21]/90 border border-[#3b494b] rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-[#dee3e9] tracking-wider">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] sm:text-xs text-[#849495] uppercase tracking-widest font-semibold">
            วัน (Days)
          </span>
        </div>

        <span className="text-xl sm:text-3xl font-black text-red-500/60 pb-6 animate-pulse">
          :
        </span>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-red-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative min-w-[64px] sm:min-w-[80px] h-16 sm:h-20 px-3 sm:px-4 bg-[#161c21]/90 border border-[#3b494b] rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-[#dee3e9] tracking-wider">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] sm:text-xs text-[#849495] uppercase tracking-widest font-semibold">
            ชั่วโมง (Hours)
          </span>
        </div>

        <span className="text-xl sm:text-3xl font-black text-red-500/60 pb-6 animate-pulse">
          :
        </span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-red-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative min-w-[64px] sm:min-w-[80px] h-16 sm:h-20 px-3 sm:px-4 bg-[#161c21]/90 border border-[#3b494b] rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-[#dee3e9] tracking-wider">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] sm:text-xs text-[#849495] uppercase tracking-widest font-semibold">
            นาที (Mins)
          </span>
        </div>

        <span className="text-xl sm:text-3xl font-black text-red-500/60 pb-6 animate-pulse">
          :
        </span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-red-500/50 to-red-600/50 rounded-xl blur opacity-50 group-hover:opacity-80 transition duration-300"></div>
            <div className="relative min-w-[64px] sm:min-w-[80px] h-16 sm:h-20 px-3 sm:px-4 bg-[#161c21]/90 border border-red-500/50 rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-red-500 tracking-wider">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] sm:text-xs text-red-400 uppercase tracking-widest font-semibold">
            วินาที (Secs)
          </span>
        </div>
      </div>
    </div>
  );
}
