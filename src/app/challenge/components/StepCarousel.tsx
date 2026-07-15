"use client";

import { ClipboardList } from "lucide-react";

const images = ["/Step 1.png", "/Step 2.png"];

export function StepGrid() {
  return (
    <section className="relative z-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-12 border-b border-green-500/20 pb-4">
        <ClipboardList className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#dee3e9]">
          ขั้นตอนการสมัครการแข่งขัน
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {images.map((src, idx) => (
          <div 
            key={idx}
            className="relative w-full aspect-square overflow-hidden rounded-xl border border-[#3b494b] shadow-[0_0_30px_rgba(59,73,75,0.2)] bg-[#0e1418] hover:border-green-500/50 transition-colors duration-300"
          >
            <img
              src={src}
              alt={`Step ${idx + 1}`}
              className="w-full h-full object-contain p-4"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
