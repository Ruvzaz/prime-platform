"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Timer } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const TARGET_DATE = new Date("2026-08-12T23:59:59+07:00").getTime();

export function AdminCountdown() {
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
    return (
      <div className="h-10 w-72 bg-[#161c21] border border-[#3b494b] rounded-xl animate-pulse" />
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 font-mono text-xs uppercase tracking-wider">
        <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
        <span>ปิดรับสมัครแล้ว (Registration Closed)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 bg-[#161c21] border border-red-500/40 px-3.5 py-1.5 rounded-xl shadow-lg shadow-red-500/5 backdrop-blur-md">
      {/* Label Section */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#b9cacb] border-r border-[#3b494b] pr-3 shrink-0">
        <Timer className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline font-semibold">
          ปิดรับสมัครวันที่ 12 สิงหาคม 2569 :
        </span>
        <span className="sm:hidden font-semibold">
          ปิดรับสมัคร 12 ส.ค. 69 :
        </span>
      </div>

      {/* Full Crimson-Red Glowing Timer Bar */}
      <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black">
        {/* Days */}
        <div className="flex items-baseline gap-1 bg-[#0a0f13] border border-red-500/40 px-2.5 py-0.5 rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          <span className="text-red-500 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-red-400/90 font-bold uppercase">
            วัน
          </span>
        </div>

        <span className="text-red-500 font-black animate-pulse">:</span>

        {/* Hours */}
        <div className="flex items-baseline gap-1 bg-[#0a0f13] border border-red-500/40 px-2.5 py-0.5 rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          <span className="text-red-500 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-red-400/90 font-bold uppercase">
            ชม.
          </span>
        </div>

        <span className="text-red-500 font-black animate-pulse">:</span>

        {/* Minutes */}
        <div className="flex items-baseline gap-1 bg-[#0a0f13] border border-red-500/40 px-2.5 py-0.5 rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          <span className="text-red-500 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-red-400/90 font-bold uppercase">
            นาที
          </span>
        </div>

        <span className="text-red-500 font-black animate-pulse">:</span>

        {/* Seconds */}
        <div className="flex items-baseline gap-1 bg-[#0a0f13] border border-red-500/60 px-2.5 py-0.5 rounded-lg shadow-[0_0_12px_rgba(239,68,68,0.3)]">
          <span className="text-red-500 text-sm sm:text-base drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-red-400 font-bold uppercase">
            วิ
          </span>
        </div>
      </div>
    </div>
  );
}
