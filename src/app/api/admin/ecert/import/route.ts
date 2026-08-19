import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import crypto from "crypto";

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
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
      }
      return "";
    };

    const challenges = await prisma.challenge.findMany();

    const errors: string[] = [];
    let createdCertsCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      const email = getVal(row, ["Email", "email", "อีเมล"]).toLowerCase();
      const eligibleVal = getVal(row, ["isEligible", "Eligible", "สิทธิ์", "eligible", "true"]);
      const challengeInput = getVal(row, ["Challenge", "challenge", "รุ่นการแข่งขัน"]);
      const title = getVal(row, ["Title", "title", "คำนำหน้า"]);
      const firstName = getVal(row, ["First Name", "first_name", "firstName", "ชื่อ"]);
      const lastName = getVal(row, ["Last Name", "last_name", "lastName", "นามสกุล"]);
      const fullNameInput = getVal(row, ["Full Name", "full_name", "fullName", "ชื่อ-นามสกุล"]);
      const issueDateInput = getVal(row, ["Issue Date", "issue_date", "issueDate", "วันที่"]) || "31 สิงหาคม 2569";

      if (!email) {
        errors.push(`Row ${rowNum}: Missing Email address.`);
        continue;
      }

      // Check eligibility (default true if row exists or if explicitly true / 1 / yes)
      const isEligible =
        eligibleVal === "" ||
        eligibleVal === "1" ||
        eligibleVal.toLowerCase() === "true" ||
        eligibleVal.toLowerCase() === "yes";

      if (!isEligible) {
        skippedCount++;
        continue;
      }

      // Resolve challenge if provided
      let challenge = null;
      if (challengeInput) {
        const lower = challengeInput.toLowerCase();
        challenge =
          challenges.find((c) => c.slug.toLowerCase() === lower) ||
          challenges.find((c) => c.name.toLowerCase() === lower) ||
          null;
      }

      // Find existing user if available
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Auto-create stub user record for this recipient email
        const usernameFallback = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        user = await prisma.user.create({
          data: {
            email,
            username: usernameFallback,
            name: fullNameInput || [title, firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0],
            title: title || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          },
        });
      }

      const recipientFullName =
        fullNameInput ||
        [title || user.title, firstName || user.firstName, lastName || user.lastName]
          .filter(Boolean)
          .join(" ") ||
        user.name ||
        email;

      const eventTitle = challenge ? `Thailand Cyber Top Talent 2026 (${challenge.name})` : "Thailand Cyber Top Talent 2026";

      // Check if certificate already issued to this email for this event
      const existingCert = await prisma.certificate.findFirst({
        where: {
          email,
          ...(challenge ? { challengeId: challenge.id } : {}),
          status: "ACTIVE",
        },
      });

      if (existingCert) {
        skippedCount++;
        continue;
      }

      // Generate unique certCode
      let certCode = generateCertCode();
      while (await prisma.certificate.findUnique({ where: { certCode } })) {
        certCode = generateCertCode();
      }

      await prisma.certificate.create({
        data: {
          certCode,
          type: "CHALLENGE",
          email,
          recipientPrefix: title || user.title || "",
          recipientFirstName: firstName || user.firstName || recipientFullName,
          recipientLastName: lastName || user.lastName || "",
          recipientFullName,
          eventTitle,
          issueDate: issueDateInput,
          status: "ACTIVE",
          challengeId: challenge?.id || null,
          userId: user.id,
        },
      });

      createdCertsCount++;
    }

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
