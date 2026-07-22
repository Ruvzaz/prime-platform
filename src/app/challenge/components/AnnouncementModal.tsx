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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container - Fits image tightly without scrollbar or side gaps */}
      <div className="relative z-10 inline-flex items-center justify-center max-w-[92vw] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[75vw] max-h-[88vh] rounded-2xl shadow-2xl border border-white/10 overflow-hidden bg-transparent">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-30 p-2 sm:p-2.5 rounded-full bg-black/70 text-white hover:text-white hover:bg-red-600 border border-white/20 backdrop-blur-md transition-all duration-200 shadow-2xl focus:outline-none"
          aria-label="Close Announcement"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Poster Image */}
        <img
          src="/AW_01.png"
          alt="Thailand Cyber Top Talent Announcement"
          className="w-auto h-auto max-w-[92vw] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[75vw] max-h-[88vh] object-contain rounded-2xl block select-none"
        />
      </div>
    </div>
  );
}
