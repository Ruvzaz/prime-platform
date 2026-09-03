import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function generateCertCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CERT-2026-${result}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const campaignId = formData.get("campaignId") as string;

    if (!file || !campaignId) {
      return NextResponse.json(
        { success: false, error: "กรุณาแนบไฟล์ Excel และระบุแคมเปญ" },
        { status: 400 }
      );
    }

    // 1. Verify Campaign
    const campaign = await prisma.certCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "ไม่พบแคมเปญใบประกาศนี้" },
        { status: 404 }
      );
    }

    // 2. Parse Excel
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: "ไฟล์ Excel ไม่มีข้อมูล" },
        { status: 400 }
      );
    }

    // 3. Single Batch Query to fetch existing recipient keys in RAM
    const existingCerts = await prisma.certificate.findMany({
      where: { campaignId },
      select: { email: true, recipientFullName: true }
    });

    const existingSet = new Set(
      existingCerts.map(
        (c) => `${c.email.toLowerCase().trim()}|${c.recipientFullName.toLowerCase().trim()}`
      )
    );

    const seenInFileSet = new Set<string>();
    const newRecords: any[] = [];
    let skippedCount = 0;

    // 4. Process Rows
    for (const row of rawData) {
      // Flexible Header Detection
      const keys = Object.keys(row);
      const nameKey = keys.find((k) =>
        /name|fullname|ชื่อ|นามสกุล|ผู้รับ|ผู้ลงทะเบียน/i.test(k)
      );
      const emailKey = keys.find((k) => /email|mail|อีเมล/i.test(k));

      const nameVal = nameKey ? String(row[nameKey] || "").trim() : "";
      const emailVal = emailKey ? String(row[emailKey] || "").trim() : "";

      if (!nameVal || !emailVal) {
        continue;
      }

      const cleanEmail = emailVal.toLowerCase();
      const cleanName = nameVal;
      const compositeKey = `${cleanEmail}|${cleanName.toLowerCase()}`;

      // Duplicate Check
      if (existingSet.has(compositeKey) || seenInFileSet.has(compositeKey)) {
        skippedCount++;
        continue;
      }

      seenInFileSet.add(compositeKey);

      // Name Splitting
      const nameParts = cleanName.split(/\s+/);
      const firstName = nameParts[0] || cleanName;
      const lastName = nameParts.slice(1).join(" ") || "";

      newRecords.push({
        certCode: generateCertCode(),
        type: "EVENT",
        email: cleanEmail,
        recipientPrefix: "",
        recipientFirstName: firstName,
        recipientLastName: lastName,
        recipientFullName: cleanName,
        eventTitle: campaign.title,
        issueDate: campaign.issueDate,
        status: "ACTIVE",
        campaignId: campaign.id,
      });
    }

    if (newRecords.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        skippedCount,
        message: "ไม่มีข้อมูลใหม่ที่จะนำเข้า (ข้อมูลซ้ำทั้งหมด)",
      });
    }

    // 5. Bulk Insertion (`createMany`)
    await prisma.certificate.createMany({
      data: newRecords,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: newRecords.length,
      skippedCount,
      message: `นำเข้าสำเร็จ ${newRecords.length} รายชื่อ${skippedCount > 0 ? ` (ข้ามรายชื่อซ้ำ ${skippedCount} รายชื่อ)` : ""}`,
    });
  } catch (error: any) {
    console.error("Import Campaign Recipients Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล" },
      { status: 500 }
    );
  }
}
