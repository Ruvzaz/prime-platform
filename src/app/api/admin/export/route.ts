import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId") || "ALL";

    // Fetch team members with their user, team, and challenge info
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
      // Find minimum joinedAt date among team members
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

    // Transform data for Excel
    const data = sortedMembers.map(({ teamNo, member }) => ({
      "Team No.": teamNo,
      "Challenge Name": member.challenge.name,
      "Team Name": member.team.name,
      "Team Organization": member.team.organization || "-",
      "Team Region": member.team.region || "-",
      "Member Status": member.status,
      "Title": member.user.title || "-",
      "First Name": member.user.firstName || "-",
      "Last Name": member.user.lastName || "-",
      "Username": member.user.username || "-",
      "Email": member.user.email,
      "Phone Number": member.user.phoneNumber || "-",
      "Gender": member.user.gender || "-",
      "Institution": member.user.institution || "-",
      "Joined At": new Date(member.joinedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = challengeId === "ALL" ? "All_Challenges_Export" : `Challenge_${challengeId}_Export`;

    return new NextResponse(buf, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
