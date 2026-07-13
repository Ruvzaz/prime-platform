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
    const challengeId = searchParams.get('challengeId') || 'ALL';

    // Fetch team members with their user, team, and challenge info
    const members = await prisma.teamMember.findMany({
      where: challengeId !== 'ALL' ? { challengeId } : undefined,
      include: {
        user: true,
        team: true,
        challenge: true,
      },
      orderBy: [
        { challenge: { name: 'asc' } },
        { team: { name: 'asc' } }
      ]
    });

    // Transform data for Excel
    const data = members.map((member) => ({
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
      "Joined At": new Date(member.joinedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = challengeId === 'ALL' ? 'All_Challenges_Export' : `Challenge_${challengeId}_Export`;

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
