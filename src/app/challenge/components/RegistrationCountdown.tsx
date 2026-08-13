"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, Video, Calendar } from "lucide-react";

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
      <div className="mt-8 max-w-2xl mx-auto w-full">
        {/* Closed Status Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-red-500/10 border border-red-500/40 rounded-full text-red-400 font-mono text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
            <span>ปิดรับสมัครแล้ว (Registration Closed)</span>
          </div>
        </div>

        {/* Zoom Meeting Invitation Card */}
        <div className="relative bg-[#161c21]/90 border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden text-left">
          {/* Top Ambient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#3b494b]/60">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-blue-400 uppercase tracking-[0.25em] font-bold block mb-0.5">
                [ OFFICIAL BRIEFING SESSION ]
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#dee3e9] tracking-tight">
                Thailand Cyber Top Talent 2026
              </h3>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#b9cacb] mb-6 font-medium leading-relaxed">
            ขอเชิญเข้าร่วม <span className="text-blue-400 font-bold">การประชุมชี้แจง รอบคัดเลือก</span>
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 font-mono text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0e1418] border border-[#3b494b]">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[#849495] block text-[10px] uppercase">วันที่ (Date)</span>
                <span className="font-bold text-[#dee3e9]">14 สิงหาคม พ.ศ. 2569</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0e1418] border border-[#3b494b]">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[#849495] block text-[10px] uppercase">เวลา (Time)</span>
                <span className="font-bold text-[#dee3e9]">16.30 - 18.00 น.</span>
              </div>
            </div>
          </div>

          {/* Zoom Connection Info Box */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#849495] uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400" /> Platform: Zoom Online
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-blue-500/10">
              <span className="text-xs text-[#b9cacb]">Zoom Meeting ID:</span>
              <span className="text-sm font-black text-blue-400 tracking-wider bg-[#0e1418] px-3 py-1 rounded border border-blue-500/30">
                857 7004 6451
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-[#b9cacb]">Passcode:</span>
              <span className="text-sm font-black text-emerald-400 tracking-wider bg-[#0e1418] px-3 py-1 rounded border border-emerald-500/30">
                043068
              </span>
            </div>
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
