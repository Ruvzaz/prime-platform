import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Users, Terminal, ChevronRight } from "lucide-react";
import { ViewTeamsDialog } from "./components/ViewTeamsDialog";
export const revalidate = 30; // แคชหน้าเว็บและดึงข้อมูลใหม่ทุกๆ 30 วินาที เพื่อประหยัด Database Connection
export default async function ChallengeLandingPage() {
  // Fetch active challenges from database
  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      teams: {
        select: {
          id: true,
          name: true,
          leader: {
            select: { username: true },
          },
          _count: {
            select: {
              members: {
                where: { status: "APPROVED" },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          teamMembers: {
            where: { status: "APPROVED" },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0e1418] text-[#dee3e9] relative overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Dynamic Cyber Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6mrreimdAPR8FpnYEXFX-1amzuBgW1PogUqROHYlhkZ8VnZFygrGX_UOlNb-CrbktHxGhZLKnRzlpQkI1rzAnSRBznHF4pg7eBGtaxcTWdbIPPz7Sx14FOARxUiyzbG4fz-gBEIDgcmXPVYMy5lbSa1b41mR5a5axpK58s-ne7VNz8R8aabf2gbbb5J4vPvDpvSR-9S-Ph3To1GOZOkiOUA7jHuW8bjhAmb-1SDVPoANzeMnndeDMK3Tmfs1mFwracQ0hEUC-XsU')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1418] via-[#0e1418]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-10">
          <div className="mb-10">
            <span className="font-mono text-xs sm:text-sm text-red-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] block mb-6 animate-pulse">
              [ Capture The Flag ]
            </span>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase mb-6 tracking-tighter leading-none">
              Thailand <span className="text-blue-500">Cyber</span>
              <br />
              <span className="text-red-500">Top </span>Talent
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-[#b9cacb] font-light tracking-wide">
              การแข่งขันทักษะทางไซเบอร์ที่ยิ่งใหญ่ที่สุดในประเทศไทย
            </p>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-70">
          <div className="w-[1px] h-16 bg-gradient-to-b from-red-500 to-transparent animate-bounce"></div>
        </div>
      </section>

      {/* Challenges Grid Section */}
      <section className="relative z-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12 border-b border-red-500/20 pb-4">
          <Terminal className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold uppercase tracking-widest text-[#dee3e9]">
            Challenges
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="group relative">
              {/* Card Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-red-500 to-transparent rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>

              <div className="relative h-full border border-[#3b494b] bg-[#161c21] rounded-xl flex flex-col transition-transform duration-300 group-hover:-translate-y-1 overflow-hidden">
                {/* Image or Icon Header */}
                {challenge.imageUrl ? (
                  <div className="w-full aspect-video relative border-b border-[#3b494b]">
                    <img
                      src={challenge.imageUrl}
                      alt={challenge.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/90 backdrop-blur text-[#161c21] rounded font-mono text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Active
                    </div>
                  </div>
                ) : (
                  <div className="p-8 pb-0">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-[#161c21] transition-colors">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full font-mono text-xs text-red-500 uppercase tracking-widest">
                        Active
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`flex flex-col flex-1 ${challenge.imageUrl ? "p-8" : "px-8 pb-8 pt-0"}`}
                >
                  <h3 className="text-2xl font-bold tracking-tight mb-2 uppercase">
                    {challenge.name}
                  </h3>

                  <p className="text-[#b9cacb] mb-8 flex-1 text-sm leading-relaxed">
                    {challenge.description ||
                      "Engage in advanced cyber warfare simulation. Prove your worth on the digital battlefield."}
                  </p>

                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="flex flex-col gap-2 border-t border-[#3b494b] pt-4">
                      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[#849495]">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" /> จำนวนผู้สมัคร
                        </span>
                        <span className="text-red-500 font-bold">
                          {challenge._count?.teamMembers || 0} คน
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[#849495]">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" /> จำนวนทีมที่สมัคร
                        </span>
                        <span className="text-blue-500 font-bold">
                          {challenge.teams.length || 0} ทีม
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">
                        <ViewTeamsDialog
                          teams={challenge.teams}
                          challengeName={challenge.name}
                        />
                      </div>
                      <Link
                        href={`/challenge/${challenge.slug}`}
                        className="flex-1"
                      >
                        <button className="w-full font-mono text-xs uppercase tracking-widest px-4 py-3 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                          Select <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {challenges.length === 0 && (
            <div className="col-span-full py-24 border border-[#3b494b] bg-[#161c21]/50 rounded-xl flex flex-col items-center justify-center text-center">
              <Terminal className="w-12 h-12 text-[#3b494b] mb-4" />
              <h3 className="text-xl font-mono uppercase tracking-widest text-[#849495]">
                No Active Protocols
              </h3>
              <p className="text-sm text-[#849495]/70 mt-2">
                Awaiting administrator activation sequence.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer / Branding */}
      <div className="border-t border-[#3b494b] bg-[#090f13] py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tighter text-[#dee3e9]">
              N
              <span className="text-blue-500">
                C
                <span className="text-red-500">
                  S<span className="text-white">A </span>
                </span>
              </span>
              CTF
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#849495] uppercase tracking-widest">
            © 2026 prime digital counsultant ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
}
