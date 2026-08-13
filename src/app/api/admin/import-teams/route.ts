import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse sheet rows to array of objects
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File contains no data rows" }, { status: 400 });
    }

    // Fetch all challenges to map by slug / name
    const challenges = await prisma.challenge.findMany();
    if (challenges.length === 0) {
      return NextResponse.json({ error: "No challenges exist in database" }, { status: 400 });
    }

    // Helper to get field value by multiple potential header names
    const getVal = (row: any, keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
      }
      return "";
    };

    // Helper to resolve challenge ID
    const resolveChallenge = (input: string) => {
      if (!input) return challenges[0]; // Default to first challenge if unspecified
      const lower = input.toLowerCase().trim();
      return (
        challenges.find((c) => c.slug.toLowerCase() === lower) ||
        challenges.find((c) => c.name.toLowerCase() === lower) ||
        challenges.find((c) => c.id === input) ||
        challenges[0]
      );
    };

    // Standardize rows
    const parsedRows = [];
    const errors: string[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // Row number in Excel (1 is header)

      const challengeInput = getVal(row, ["Challenge", "challenge", "รุ่นการแข่งขัน", "รุ่น"]);
      const teamName = getVal(row, ["Team Name", "team_name", "teamName", "ชื่อทีม", "ทีม"]);
      const organization = getVal(row, ["Organization", "organization", "หน่วยงาน", "โรงเรียน", "มหาวิทยาลัย"]);
      const region = getVal(row, ["Region", "region", "ภูมิภาค"]);
      const role = getVal(row, ["Role", "role", "บทบาท", "ตำแหน่ง"]).toUpperCase();
      const title = getVal(row, ["Title", "title", "คำนำหน้า", "คำนำหน้าชื่อ"]);
      const firstName = getVal(row, ["First Name", "first_name", "firstName", "ชื่อ", "ชื่อจริง"]);
      const lastName = getVal(row, ["Last Name", "last_name", "lastName", "นามสกุล"]);
      const email = getVal(row, ["Email", "email", "อีเมล"]).toLowerCase();
      const username = getVal(row, ["Username", "username", "ชื่อผู้ใช้"]);
      const phone = getVal(row, ["Phone", "phone", "phoneNumber", "เบอร์โทร", "เบอร์โทรศัพท์"]);

      if (!email) {
        errors.push(`Row ${rowNum}: Missing Email address.`);
        continue;
      }
      if (!teamName) {
        errors.push(`Row ${rowNum}: Missing Team Name for email ${email}.`);
        continue;
      }

      const challenge = resolveChallenge(challengeInput);

      parsedRows.push({
        rowNum,
        challenge,
        teamName,
        organization,
        region,
        isLeader: role === "LEADER" || role === "HEAD" || role === "หัวหน้าทีม" || role === "หัวหน้า",
        title,
        firstName,
        lastName,
        name: [title, firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0],
        email,
        username: username || email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_"),
        phone,
      });
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows to process.", details: errors },
        { status: 400 }
      );
    }

    // Group rows by team key: `${challenge.id}:${teamName.toLowerCase()}`
    const teamGroups = new Map<string, typeof parsedRows>();
    for (const r of parsedRows) {
      const key = `${r.challenge.id}:${r.teamName.toLowerCase()}`;
      if (!teamGroups.has(key)) teamGroups.set(key, []);
      teamGroups.get(key)!.push(r);
    }

    let createdTeamsCount = 0;
    let createdUsersCount = 0;
    let addedMembersCount = 0;

    for (const [key, rows] of teamGroups.entries()) {
      const targetChallenge = rows[0].challenge;
      const originalTeamName = rows[0].teamName;
      const org = rows.find((r) => r.organization)?.organization || "-";
      const reg = rows.find((r) => r.region)?.region || "-";

      // 1. Process/Create all users in this team
      const memberUserIds: { userId: string; isLeader: boolean }[] = [];

      for (const r of rows) {
        let user = await prisma.user.findUnique({ where: { email: r.email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: r.email,
              username: r.username,
              name: r.name,
              title: r.title,
              firstName: r.firstName,
              lastName: r.lastName,
              phoneNumber: r.phone,
              institution: r.organization,
            },
          });
          createdUsersCount++;
        } else {
          // Fill missing info if exists
          await prisma.user.update({
            where: { id: user.id },
            data: {
              title: user.title || r.title || undefined,
              firstName: user.firstName || r.firstName || undefined,
              lastName: user.lastName || r.lastName || undefined,
              name: user.name || r.name || undefined,
              phoneNumber: user.phoneNumber || r.phone || undefined,
              institution: user.institution || r.organization || undefined,
            },
          });
        }

        memberUserIds.push({
          userId: user.id,
          isLeader: r.isLeader,
        });
      }

      // Determine team leader
      const leaderObj = memberUserIds.find((m) => m.isLeader) || memberUserIds[0];

      // 2. Find or Create Team
      let team = await prisma.team.findUnique({
        where: {
          challengeId_name: {
            challengeId: targetChallenge.id,
            name: originalTeamName,
          },
        },
      });

      if (!team) {
        const inviteToken = crypto.randomBytes(24).toString("hex");
        team = await prisma.team.create({
          data: {
            name: originalTeamName,
            challengeId: targetChallenge.id,
            leaderId: leaderObj.userId,
            organization: org,
            region: reg,
            inviteToken,
          },
        });
        createdTeamsCount++;
      }

      // 3. Create Team Memberships
      for (const m of memberUserIds) {
        const existingMembership = await prisma.teamMember.findUnique({
          where: {
            challengeId_userId: {
              challengeId: targetChallenge.id,
              userId: m.userId,
            },
          },
        });

        if (!existingMembership) {
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              challengeId: targetChallenge.id,
              userId: m.userId,
              status: "APPROVED",
            },
          });
          addedMembersCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdTeamsCount,
      createdUsersCount,
      addedMembersCount,
      errors,
    });
  } catch (error: any) {
    console.error("Bulk Import Teams Error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk import", details: [error?.message || "Unknown error"] },
      { status: 500 }
    );
  }
}
