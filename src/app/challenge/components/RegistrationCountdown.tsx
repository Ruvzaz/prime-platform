"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, Video, Calendar, Trophy } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

// Extended Target Date: 13 August 2026 at 18:00:00 (GMT+7)
const TARGET_DATE = new Date("2026-08-13T18:00:00+07:00").getTime();

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

  // When Registration is Closed (Time Expired or All Challenges Inactive)
  if (timeLeft.isExpired || !hasActiveChallenges) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="relative group p-[1.5px] rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-rose-500 to-red-500 animate-gradient-shift shadow-[0_0_25px_rgba(239,68,68,0.35)]">
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-[#161c21]/95 rounded-full backdrop-blur-md">
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-400 via-amber-300 via-rose-400 to-red-400 bg-clip-text text-transparent animate-gradient-shift">
              การแข่งขัน Thailand Cyber Top Talent 2026
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active Countdown State (Before 13 Aug 18:00)
  return (
    <div className="mt-8 flex flex-col items-center justify-center">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-mono uppercase tracking-widest mb-4 backdrop-blur-md">
        <Clock className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        <span>ขยายเวลาปิดรับสมัคร: 13 สิงหาคม 2569 เวลา 18:00 น.</span>
      </div>

      {/* Countdown Cards */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
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

        <span className="text-xl sm:text-3xl font-black text-emerald-500/60 pb-6 animate-pulse">
          :
        </span>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
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

        <span className="text-xl sm:text-3xl font-black text-emerald-500/60 pb-6 animate-pulse">
          :
        </span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
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

        <span className="text-xl sm:text-3xl font-black text-emerald-500/60 pb-6 animate-pulse">
          :
        </span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/50 to-emerald-600/50 rounded-xl blur opacity-50 group-hover:opacity-80 transition duration-300"></div>
            <div className="relative min-w-[64px] sm:min-w-[80px] h-16 sm:h-20 px-3 sm:px-4 bg-[#161c21]/90 border border-emerald-500/50 rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-wider">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] sm:text-xs text-emerald-400 uppercase tracking-widest font-semibold">
            วินาที (Secs)
          </span>
        </div>
      </div>
    </div>
  );
}
