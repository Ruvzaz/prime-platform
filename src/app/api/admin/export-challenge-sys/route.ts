import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

function mapRegionToZone(region?: string | null): string {
  if (!region) return "";
  const r = region.trim();
  if (r.includes("กรุงเทพ")) return "bangkok";
  if (r.includes("เหนือ") && !r.includes("ตะวันออกเฉียงเหนือ")) return "north";
  if (r.includes("ตะวันออกเฉียงเหนือ") || r.includes("อีสาน")) return "northeast";
  if (r.includes("กลาง") || r.includes("ตะวันออก") || r.includes("ตะวันตก")) return "central + eastern";
  if (r.includes("ใต้")) return "south";
  return r;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId") || "ALL";

    // Fetch team members with user, team, and challenge info
    const members = await prisma.teamMember.findMany({
      where: {
        ...(challengeId !== "ALL" ? { challengeId } : {}),
        user: {
          role: { notIn: ["ADMIN", "STAFF"] }
        }
      },
      include: {
        user: true,
        team: true,
        challenge: true,
      },
      orderBy: [
        { challenge: { name: "asc" } },
        { team: { name: "asc" } },
        { joinedAt: "asc" }
      ]
    });

    // Transform data for Challenge Sys format
    const data = members.map((member) => {
      const u = member.user;
      const t = member.team;

      const fullName = u.name 
        || [u.firstName, u.lastName].filter(Boolean).join(" ") 
        || u.username 
        || u.email;

      const affiliation = u.institution || t.organization || "";

      return {
        name: fullName,
        email: u.email,
        password: u.password || "",
        affiliation: affiliation,
        team_name: t.name,
        ZONE: mapRegionToZone(t.region)
      };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChallengeSysExport");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = challengeId === "ALL" 
      ? "Export_Challenge_Sys_All" 
      : `Export_Challenge_Sys_${challengeId}`;

    return new NextResponse(buf, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Challenge Sys Export Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
