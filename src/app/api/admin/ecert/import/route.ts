import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

function generateCertCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CERT-2026-${randomStr}`;
}

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

    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File contains no data rows" }, { status: 400 });
    }

    const getVal = (row: any, keys: string[]): string => {
      for (const k of keys) {
        // Case-insensitive key match in row object
        for (const rowKey of Object.keys(row)) {
          if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
            if (row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== "") {
              return String(row[rowKey]).trim();
            }
          }
        }
      }
      return "";
    };

    const challenges = await prisma.challenge.findMany();

    const errors: string[] = [];
    let skippedCount = 0;

    // 1. Filter rows by Email and Eligibility
    const validRowsToProcess: {
      rowNum: number;
      email: string;
      title: string;
      firstName: string;
      lastName: string;
      fullName: string;
      challengeInput: string;
      issueDate: string;
    }[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      const email = getVal(row, ["Email", "email", "อีเมล", "mail"]).toLowerCase();
      const eligibleVal = getVal(row, ["isEligible", "Eligible", "สิทธิ์", "eligible", "is_eligible", "status", "pass", "passed"]).toLowerCase();
      const challengeInput = getVal(row, ["Challenge", "challenge", "รุ่นการแข่งขัน", "รุ่น"]);
      const title = getVal(row, ["Title", "title", "คำนำหน้า"]);
      const firstName = getVal(row, ["First Name", "first_name", "firstName", "ชื่อ"]);
      const lastName = getVal(row, ["Last Name", "last_name", "lastName", "นามสกุล"]);
      const fullNameInput = getVal(row, ["Full Name", "full_name", "fullName", "ชื่อ-นามสกุล", "ชื่อ นามสกุล"]);
      const issueDateInput = getVal(row, ["Issue Date", "issue_date", "issueDate", "วันที่"]) || "31 สิงหาคม 2569";

      if (!email) {
        errors.push(`Row ${rowNum}: Missing Email address.`);
        continue;
      }

      // Eligibility Check:
      // If eligibleVal is explicitly false / 0 / no / fail -> Skip!
      // Otherwise (true / 1 / yes / pass / empty) -> Eligible!
      const isExplicitFalse =
        eligibleVal === "false" ||
        eligibleVal === "0" ||
        eligibleVal === "no" ||
        eligibleVal === "n" ||
        eligibleVal === "fail" ||
        eligibleVal === "failed" ||
        eligibleVal === "ไม่ผ่าน" ||
        eligibleVal === "ไม่มีสิทธิ์";

      if (isExplicitFalse) {
        skippedCount++;
        continue;
      }

      validRowsToProcess.push({
        rowNum,
        email,
        title,
        firstName,
        lastName,
        fullName: fullNameInput,
        challengeInput,
        issueDate: issueDateInput,
      });
    }

    if (validRowsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        createdCertsCount: 0,
        skippedCount,
        errors,
        message: "No eligible rows to import",
      });
    }

    // 2. Batch Fetch Existing Users
    const uniqueEmails = Array.from(new Set(validRowsToProcess.map((r) => r.email)));
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: uniqueEmails, mode: "insensitive" },
      },
      select: {
        id: true,
        email: true,
        title: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

    const userMapByEmail = new Map<string, any>();
    existingUsers.forEach((u) => {
      if (u.email) userMapByEmail.set(u.email.toLowerCase(), u);
    });

    // 3. Batch Create Missing Stub Users
    const missingUsersToCreate: { email: string; username: string; name: string; title?: string; firstName?: string; lastName?: string }[] = [];
    const missingEmailsProcessed = new Set<string>();

    for (const r of validRowsToProcess) {
      if (!userMapByEmail.has(r.email) && !missingEmailsProcessed.has(r.email)) {
        missingEmailsProcessed.add(r.email);
        const cleanUsername = r.email.includes("@") ? r.email.split("@")[0] : r.email;
        const name = r.fullName || [r.title, r.firstName, r.lastName].filter(Boolean).join(" ") || cleanUsername;
        missingUsersToCreate.push({
          email: r.email,
          username: cleanUsername,
          name,
          title: r.title || undefined,
          firstName: r.firstName || undefined,
          lastName: r.lastName || undefined,
        });
      }
    }

    if (missingUsersToCreate.length > 0) {
      await prisma.user.createMany({
        data: missingUsersToCreate,
        skipDuplicates: true,
      });

      // Refetch newly created users to get their generated IDs
      const newlyCreatedUsers = await prisma.user.findMany({
        where: { email: { in: Array.from(missingEmailsProcessed), mode: "insensitive" } },
        select: { id: true, email: true, title: true, firstName: true, lastName: true, name: true },
      });
      newlyCreatedUsers.forEach((u) => {
        if (u.email) userMapByEmail.set(u.email.toLowerCase(), u);
      });
    }

    // 4. Batch Fetch Existing Certificates by Email & Cert Codes
    const existingCerts = await prisma.certificate.findMany({
      where: {
        email: { in: uniqueEmails, mode: "insensitive" },
        status: "ACTIVE",
      },
      select: { email: true },
    });

    const existingEmailSet = new Set<string>();
    existingCerts.forEach((c) => {
      if (c.email) existingEmailSet.add(c.email.toLowerCase().trim());
    });

    const existingCertCodes = new Set<string>(
      (await prisma.certificate.findMany({ select: { certCode: true } })).map((c) => c.certCode)
    );

    // 5. Build Certificates Array for Bulk Creation
    const certsToCreate: any[] = [];

    for (const r of validRowsToProcess) {
      const emailLower = r.email.toLowerCase().trim();

      // If email already has an active certificate in E-Cert Manager DB, skip completely!
      if (existingEmailSet.has(emailLower)) {
        skippedCount++;
        continue;
      }
      // Add to set to prevent duplicate issuance within the same Excel file
      existingEmailSet.add(emailLower);

      const user = userMapByEmail.get(r.email);
      if (!user) continue;

      let challenge = null;
      if (r.challengeInput) {
        const lower = r.challengeInput.toLowerCase();
        challenge =
          challenges.find((c) => c.slug.toLowerCase() === lower) ||
          challenges.find((c) => c.name.toLowerCase() === lower) ||
          challenges.find((c) => lower.includes(c.name.toLowerCase())) ||
          null;
      }

      const recipientFullName =
        r.fullName ||
        [r.title || user.title, r.firstName || user.firstName, r.lastName || user.lastName]
          .filter(Boolean)
          .join(" ") ||
        user.name ||
        r.email;

      const eventTitle = challenge ? `Thailand Cyber Top Talent 2026 (${challenge.name})` : "Thailand Cyber Top Talent 2026";

      // Generate unique cert code in memory
      let certCode = generateCertCode();
      while (existingCertCodes.has(certCode)) {
        certCode = generateCertCode();
      }
      existingCertCodes.add(certCode);

      certsToCreate.push({
        certCode,
        type: "CHALLENGE",
        email: r.email,
        recipientPrefix: r.title || user.title || "",
        recipientFirstName: r.firstName || user.firstName || recipientFullName,
        recipientLastName: r.lastName || user.lastName || "",
        recipientFullName,
        eventTitle,
        issueDate: r.issueDate,
        status: "ACTIVE",
        challengeId: challenge?.id || null,
        userId: user.id,
      });
    }

    // 6. Execute Bulk Insert in Single Query
    let createdCertsCount = 0;
    if (certsToCreate.length > 0) {
      const result = await prisma.certificate.createMany({
        data: certsToCreate,
        skipDuplicates: true,
      });
      createdCertsCount = result.count;
    }

    revalidatePath('/admin/certificates');
    revalidatePath('/certification/challenge');
    revalidatePath('/challenge', 'layout');
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      createdCertsCount,
      skippedCount,
      errors,
    });
  } catch (error: any) {
    console.error("Bulk Import E-Cert Error:", error);
    return NextResponse.json(
      { error: "Failed to process E-Cert import", details: [error?.message || "Unknown error"] },
      { status: 500 }
    );
  }
}
