"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function AnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the announcement in this session
    const hasSeen = sessionStorage.getItem("hasSeenAnnouncement_AW_01");
    if (!hasSeen) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenAnnouncement_AW_01", "true");
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content - Adjusted to ~75% viewport width on desktop */}
      <div className="relative z-10 w-[95vw] sm:w-[88vw] md:w-[80vw] lg:w-[75vw] max-w-[1300px] max-h-[90vh] bg-[#161c21]/95 border border-[#3b494b]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center group">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:text-white hover:bg-red-600/90 border border-white/20 backdrop-blur-md transition-all duration-200 shadow-2xl focus:outline-none"
          aria-label="Close Announcement"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Poster Image Container */}
        <div className="w-full h-full overflow-y-auto max-h-[90vh] flex items-center justify-center bg-[#0e1418] p-1 sm:p-2">
          <img
            src="/AW_01.png"
            alt="Thailand Cyber Top Talent Announcement"
            className="w-full h-auto object-contain max-h-[88vh] rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
