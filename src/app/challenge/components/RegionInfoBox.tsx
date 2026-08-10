"use client";

import { AlertCircle } from "lucide-react";

interface RegionDetail {
  title: string;
  count: string;
  provinces: string;
  badgeStyle: string;
  dotColor: string;
}

const regions: RegionDetail[] = [
  {
    title: "กรุงเทพมหานคร",
    count: "1 จังหวัด",
    provinces: "กรุงเทพมหานคร",
    badgeStyle: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dotColor: "bg-blue-400",
  },
  {
    title: "ภาคเหนือ",
    count: "15 จังหวัด",
    provinces:
      "9 จังหวัดภาคเหนือตอนบน กับอีก 6 จังหวัด (พิษณุโลก, สุโขทัย, ตาก, กำแพงเพชร, นครสวรรค์ และพิจิตร)",
    badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
  {
    title: "ภาคกลาง + ภาคตะวันออก + ภาคตะวันตก",
    count: "26 จังหวัด",
    provinces:
      "อุทัยธานี, ชัยนาท, สิงห์บุรี, อ่างทอง, พระนครศรีอยุธยา, ลพบุรี, สระบุรี, นครนายก, ปราจีนบุรี, สระแก้ว, ฉะเชิงเทรา, ชลบุรี, ระยอง, จันทบุรี, ตราด, นนทบุรี, ปทุมธานี, สมุทรปราการ, สมุทรสาคร, สมุทรสงคราม, นครปฐม, สุพรรณบุรี, กาญจนบุรี, ราชบุรี, เพชรบุรี และประจวบคีรีขันธ์",
    badgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dotColor: "bg-amber-400",
  },
  {
    title: "ภาคตะวันออกเฉียงเหนือ",
    count: "21 จังหวัด",
    provinces: "เพชรบูรณ์ กับ 20 จังหวัดภาคตะวันออกเฉียงเหนือในทางภูมิศาสตร์",
    badgeStyle: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    dotColor: "bg-rose-400",
  },
  {
    title: "ภาคใต้",
    count: "14 จังหวัด",
    provinces:
      "14 จังหวัดปักษ์ใต้ทั้งหมด โดยนับจากจังหวัดชุมพรลงไปจนถึงนราธิวาส",
    badgeStyle: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    dotColor: "bg-purple-400",
  },
];

export function RegionInfoBox() {
  return (
    <div className="mt-6 border border-amber-500/30 bg-[#161c21]/90 rounded-xl p-3.5 sm:p-4 text-[#dee3e9] shadow-lg relative overflow-hidden backdrop-blur-md">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <h4 className="font-mono text-[11px] uppercase font-bold tracking-wider">
            หมายเหตุ: เกณฑ์การแบ่งภูมิภาคในการแข่งขัน (REGIONAL SECTOR)
          </h4>
        </div>
        <span className="hidden sm:inline-flex font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
          5 SECTORS
        </span>
      </div>

      {/* Ultra-Compact List */}
      <div className="divide-y divide-[#3b494b]/30">
        {regions.map((reg, idx) => (
          <div
            key={idx}
            className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-3 py-1.5 text-[11px]"
          >
            {/* Region Title & Count Badge */}
            <div className="flex items-center gap-2 shrink-0 md:w-72">
              <span
                className={`w-1.5 h-1.5 rounded-full ${reg.dotColor} shrink-0`}
              />
              <span className="font-bold text-[#dee3e9]">{reg.title}</span>
              <span
                className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ml-auto md:ml-0 shrink-0 ${reg.badgeStyle}`}
              >
                {reg.count}
              </span>
            </div>

            {/* Province List Text */}
            <p className="text-[#b9cacb] font-light leading-normal flex-1">
              {reg.provinces}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
