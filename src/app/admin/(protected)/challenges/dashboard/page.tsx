import { prisma } from "@/lib/prisma";
import { Shield, Users, MapPin, Clock } from "lucide-react";
import {
  RegistrationLineChart,
  RegionPieChart,
} from "@/components/admin/event-dashboard-charts";
import {
  ChallengeDashboardFilter,
  ExportDataButton,
} from "../components/ClientActions";
import { AdminCountdown } from "@/components/admin/admin-countdown";

export default async function ChallengeDashboardPage(props: any) {
  const searchParams = await Promise.resolve(props.searchParams);
  const filterChallengeId =
    typeof searchParams?.challengeId === "string"
      ? searchParams.challengeId
      : "ALL";

  const challenges = await prisma.challenge.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const totalTeams = await prisma.team.count({
    where:
      filterChallengeId !== "ALL"
        ? { challengeId: filterChallengeId }
        : undefined,
  });

  const totalApplicants = await prisma.teamMember.count({
    where: {
      ...(filterChallengeId !== "ALL"
        ? { challengeId: filterChallengeId }
        : {}),
      user: {
        role: { notIn: ["ADMIN", "STAFF"] },
      },
    },
  });

  const teamsData = await prisma.team.findMany({
    where:
      filterChallengeId !== "ALL"
        ? { challengeId: filterChallengeId }
        : undefined,
    select: {
      region: true,
      _count: {
        select: {
          members: {
            where: {
              user: { role: { notIn: ["ADMIN", "STAFF"] } },
            },
          },
        },
      },
    },
  });

  const regionsMap: Record<string, { teams: number; members: number }> = {
    กรุงเทพมหานครและปริมณฑล: { teams: 0, members: 0 },
    ภาคเหนือ: { teams: 0, members: 0 },
    "ภาคกลาง ภาคตะวันออก และภาคตะวันตก": { teams: 0, members: 0 },
    ภาคตะวันออกเฉียงเหนือ: { teams: 0, members: 0 },
    ภาคใต้: { teams: 0, members: 0 },
  };

  teamsData.forEach((team) => {
    if (team.region) {
      if (!(team.region in regionsMap)) {
        regionsMap[team.region] = { teams: 0, members: 0 };
      }
      regionsMap[team.region].teams += 1;
      regionsMap[team.region].members += team._count.members;
    }
  });

  const regionChartData = Object.entries(regionsMap)
    .map(([name, data]) => ({ name, value: data.teams }))
    .filter((d) => d.value > 0);

  // Get registrations by day for the line chart
  const allMembersDates = await prisma.teamMember.findMany({
    where: {
      ...(filterChallengeId !== "ALL"
        ? { challengeId: filterChallengeId }
        : {}),
      user: {
        role: { notIn: ["ADMIN", "STAFF"] },
      },
    },
    select: { joinedAt: true, challengeId: true },
    orderBy: { joinedAt: "asc" },
  });

  const registrationsByDayMap = new Map<string, Record<string, number>>();

  // We need to keep track of cumulative counts
  const cumulativeCounts: Record<string, number> = { Total: 0 };
  challenges.forEach((c) => (cumulativeCounts[c.name] = 0));

  allMembersDates.forEach((m) => {
    const dateStr = m.joinedAt.toISOString().split("T")[0];
    if (!registrationsByDayMap.has(dateStr)) {
      registrationsByDayMap.set(dateStr, { Total: 0 });
    }
    const dayData = registrationsByDayMap.get(dateStr)!;

    dayData.Total = (dayData.Total || 0) + 1;

    const challengeName = challenges.find((c) => c.id === m.challengeId)?.name;
    if (challengeName) {
      dayData[challengeName] = (dayData[challengeName] || 0) + 1;
    }
  });

  const sortedDates = Array.from(registrationsByDayMap.keys()).sort();
  const registrationChartData = sortedDates.map((date) => {
    const dayData = registrationsByDayMap.get(date)!;

    cumulativeCounts.Total += dayData.Total || 0;
    const result: any = { date, Total: cumulativeCounts.Total };

    challenges.forEach((c) => {
      cumulativeCounts[c.name] += dayData[c.name] || 0;
      if (filterChallengeId === "ALL" || filterChallengeId === c.id) {
        result[c.name] = cumulativeCounts[c.name];
      }
    });

    return result;
  });

  const priorDateStr = "2026-07-15";
  const zeroData: any = { date: priorDateStr, Total: 0 };
  challenges.forEach((c) => {
    if (filterChallengeId === "ALL" || filterChallengeId === c.id) {
      zeroData[c.name] = 0;
    }
  });

  // Filter out any mock/test data before the official start date
  const filteredRegistrationChartData = registrationChartData.filter(
    (d) => d.date > priorDateStr,
  );
  filteredRegistrationChartData.unshift(zeroData);

  const activeChallengeNames =
    filterChallengeId === "ALL"
      ? challenges.map((c) => c.name)
      : ([challenges.find((c) => c.id === filterChallengeId)?.name].filter(
          Boolean,
        ) as string[]);

  const displayChallengeName =
    filterChallengeId === "ALL"
      ? "ภาพรวม"
      : challenges.find((c) => c.id === filterChallengeId)?.name || "";

  const now = new Date();
  const currentDateTimeFormatted = new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(now);

  return (
    <div className="bg-[#0e1418] text-[#dee3e9] -m-4 p-4 md:-m-8 md:p-5 min-h-[calc(100vh-4rem)] flex flex-col justify-between gap-3.5 font-sans">
      <div className="flex items-center justify-between border-b border-[#3b494b] pb-4">
        <div>
          <h1 className="text-3xl xl:text-4xl font-black uppercase tracking-[0.15em] flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              Thailand
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              Cyber
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              Top
            </span>
            <span className="text-[#b9cacb]">
              Talent{" "}
              <span className="text-emerald-400 font-light tracking-widest drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                2026
              </span>
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm font-medium text-emerald-400/80 bg-emerald-400/10 w-fit px-3 py-0.5 rounded-full border border-emerald-400/20">
            <Clock className="w-3.5 h-3.5" />
            <span>ข้อมูลล่าสุด ณ {currentDateTimeFormatted} น.</span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-2 shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <img
            src="/NCSA_logo.png"
            alt="NCSA"
            className="h-10 xl:h-12 w-auto object-contain"
          />
          <img
            src="/Huawei_logo.png"
            alt="Huawei"
            className="h-10 xl:h-12 w-auto object-contain"
          />
          <img
            src="/TCTT_logo.png"
            alt="TCTT"
            className="h-10 xl:h-12 w-auto object-contain"
          />
          <img
            src="/THNCA_logo.png"
            alt="THNCA"
            className="h-10 xl:h-12 w-auto object-contain scale-110 xl:scale-125 origin-center"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <AdminCountdown />
        <ChallengeDashboardFilter
          challenges={challenges.map((c) => ({ id: c.id, name: c.name }))}
          currentFilter={filterChallengeId}
        />
      </div>

      {/* Top Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <div className="bg-[#161c21] border border-[#3b494b] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/20 lg:col-span-3">
          <h3 className="font-bold text-[#b9cacb] mb-3 uppercase tracking-wider text-sm">
            สถิติจำนวนผู้ลงทะเบียนระบบในแต่ละวัน (สะสม)
          </h3>
          <div className="dark-chart-wrapper">
            <RegistrationLineChart
              data={filteredRegistrationChartData}
              challenges={activeChallengeNames}
            />
          </div>
        </div>
        <div className="bg-[#161c21] border border-[#3b494b] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-[#b9cacb] uppercase tracking-wider text-sm">
              สัดส่วนทีมตามภูมิภาค
            </h3>
          </div>
          <div className="dark-chart-wrapper">
            <RegionPieChart data={regionChartData} />
          </div>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-[#161c21] border border-[#3b494b] rounded-xl p-5 shadow-lg shadow-black/20 group hover:border-blue-500/50 transition-colors flex flex-col justify-center min-h-[160px]">
          <div className="relative z-10">
            <div className="inline-block mb-2 px-3 py-1 bg-blue-500/10 backdrop-blur-md border border-blue-500/30 rounded-xl text-xl xl:text-2xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] tracking-wide">
              {displayChallengeName}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-[#b9cacb] uppercase tracking-widest">
                ผู้สมัครทั้งหมด
              </h3>
            </div>
            <p className="text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {totalApplicants}{" "}
              <span className="text-lg font-medium text-[#b9cacb] ml-1">
                คน
              </span>
            </p>
          </div>
          <img
            src="/Mascot Man.png"
            alt="Mascot Man"
            className="absolute -bottom-0 right-4 w-32 xl:w-36 h-auto object-contain opacity-95 group-hover:scale-105 group-hover:opacity-100 transition-transform duration-500 origin-bottom-right drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none z-0"></div>
        </div>

        <div className="relative overflow-hidden bg-[#161c21] border border-[#3b494b] rounded-xl p-5 shadow-lg shadow-black/20 group hover:border-red-500/50 transition-colors flex flex-col justify-center min-h-[160px]">
          <div className="relative z-10">
            <div className="inline-block mb-2 px-3 py-1 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl text-xl xl:text-2xl font-black text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] tracking-wide">
              {displayChallengeName}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-semibold text-[#b9cacb] uppercase tracking-widest">
                ทีมทั้งหมด
              </h3>
            </div>
            <p className="text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {totalTeams}{" "}
              <span className="text-lg font-medium text-[#b9cacb] ml-1">
                ทีม
              </span>
            </p>
          </div>
          <img
            src="/Mascot Girl.png"
            alt="Mascot Girl"
            className="absolute -bottom-0 right-8 w-32 xl:w-36 h-auto object-contain opacity-95 group-hover:scale-105 group-hover:opacity-100 transition-transform duration-500 origin-bottom-right drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none z-0"></div>
        </div>

        <div className="bg-[#161c21] border border-[#3b494b] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/20 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-[#b9cacb] uppercase tracking-wider">
              สถิติทีมแบ่งตามภูมิภาค
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "กรุงเทพฯ และปริมณฑล", key: "กรุงเทพมหานครและปริมณฑล" },
              { label: "ภาคเหนือ", key: "ภาคเหนือ" },
              {
                label: "ภาคกลาง ตะวันออก และตะวันตก",
                key: "ภาคกลาง ภาคตะวันออก และภาคตะวันตก",
              },
              { label: "ภาคตะวันออกเฉียงเหนือ", key: "ภาคตะวันออกเฉียงเหนือ" },
              { label: "ภาคใต้", key: "ภาคใต้" },
            ].map(({ label, key }) => (
              <div
                key={key}
                className="flex items-center justify-between bg-[#0e1418]/60 p-3 rounded-lg border border-[#3b494b]/50 hover:border-[#3b494b] transition-colors"
              >
                <span
                  className="text-[#dee3e9] font-medium text-sm truncate mr-2"
                  title={label}
                >
                  {label}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right min-w-[3rem]">
                    <span className="text-emerald-400 font-bold text-base">
                      {regionsMap[key]?.teams || 0}
                    </span>
                    <span className="text-xs text-[#b9cacb] ml-1">ทีม</span>
                  </div>
                  <div className="w-px h-6 bg-[#3b494b]"></div>
                  <div className="text-right min-w-[3rem]">
                    <span className="text-blue-400 font-bold text-base">
                      {regionsMap[key]?.members || 0}
                    </span>
                    <span className="text-xs text-[#b9cacb] ml-1">คน</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
