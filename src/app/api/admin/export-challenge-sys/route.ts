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

    // Fetch team members with user (including accounts), team, and challenge info
    const members = await prisma.teamMember.findMany({
      where: {
        ...(challengeId !== "ALL" ? { challengeId } : {}),
        user: {
          role: { notIn: ["ADMIN", "STAFF"] }
        }
      },
      include: {
        user: {
          include: {
            accounts: true
          }
        },
        team: true,
        challenge: true,
      }
    });

    // Group members by teamId
    const teamGroupsMap = new Map<string, typeof members>();
    for (const member of members) {
      const tId = member.teamId;
      if (!teamGroupsMap.has(tId)) {
        teamGroupsMap.set(tId, []);
      }
      teamGroupsMap.get(tId)!.push(member);
    }

    // Compute earliest joinedAt for each team and sort members inside team
    const teamStats: { teamId: string; earliestJoinedAt: Date; members: typeof members }[] = [];

    teamGroupsMap.forEach((teamMembers, teamId) => {
      // Find minimum joinedAt date among team members (or team createdAt fallback)
      const minJoinedAt = teamMembers.reduce((min, m) => {
        const d = new Date(m.joinedAt);
        return d < min ? d : min;
      }, new Date(teamMembers[0].joinedAt));

      // Sort members within the team by joinedAt ascending (earliest member first)
      teamMembers.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      teamStats.push({
        teamId,
        earliestJoinedAt: minJoinedAt,
        members: teamMembers,
      });
    });

    // Sort teams by earliestJoinedAt ascending (oldest team first, newly added teams at bottom)
    teamStats.sort((a, b) => a.earliestJoinedAt.getTime() - b.earliestJoinedAt.getTime());

    // Flatten sorted teams and assign sequential Team No. (1, 2, 3, ...)
    const sortedMembers: { teamNo: number; member: (typeof members)[0] }[] = [];
    teamStats.forEach((group, index) => {
      const teamNo = index + 1;
      for (const m of group.members) {
        sortedMembers.push({ teamNo, member: m });
      }
    });

    // Transform data for Challenge Sys format (9 columns with Team No.)
    const data = sortedMembers.map(({ teamNo, member }) => {
      const u = member.user;
      const t = member.team;

      const isGmailLogin = !u.password || u.accounts?.some((a) => a.provider === "google") ? "YES" : "NO";
      const username = u.username || u.email.split("@")[0] || "";
      const fullName = u.name 
        || [u.title, u.firstName, u.lastName].filter(Boolean).join(" ")
        || [u.firstName, u.lastName].filter(Boolean).join(" ") 
        || u.username 
        || u.email;
      const affiliation = u.institution || t.organization || "";

      return {
        "Team No.": teamNo,
        Username: username,
        FullName: fullName,
        email: u.email,
        password: u.password || "",
        affiliation: affiliation,
        team_name: t.name,
        ZONE: mapRegionToZone(t.region),
        is_gmail_login: isGmailLogin
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
