"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

const images = ["/Info 1.png", "/Info 2.png", "/Info 3.png"];

export function InfoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Auto change every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="relative z-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-12 border-b border-blue-500/20 pb-4">
        <Info className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#dee3e9]">
          รายละเอียดการแข่งขัน
        </h2>
      </div>

      <div
        className="relative aspect-square w-full max-w-[80vh] mx-auto overflow-hidden rounded-xl border border-[#3b494b] shadow-[0_0_30px_rgba(59,73,75,0.2)] group bg-[#0e1418]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Images */}
        <div
          className="flex transition-transform duration-700 ease-in-out h-full w-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((src, idx) => (
            <div key={idx} className="min-w-full h-full relative flex-shrink-0">
              <img
                src={src}
                alt={`Information ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#161c21]/80 backdrop-blur border border-[#3b494b] text-[#dee3e9] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white hover:border-blue-500 z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#161c21]/80 backdrop-blur border border-[#3b494b] text-[#dee3e9] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white hover:border-blue-500 z-10"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  : "bg-[#849495]/50 hover:bg-[#849495]"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
