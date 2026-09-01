import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    // 1. Security Check: Admin Authentication
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ในการอัปโหลดแม่แบบ" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ภาพที่อัปโหลด" }, { status: 400 });
    }

    // 2. Security Check: File Size Limit (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ขนาดไฟล์ต้องไม่เกิน 10MB" }, { status: 400 });
    }

    // 3. Security Check: Allowed MIME types
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ภาพ JPG, PNG หรือ WEBP เท่านั้น" }, { status: 400 });
    }

    // 4. File Extension Sanitization
    const rawExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    const ext = allowedExts.includes(rawExt) ? rawExt : "png";

    const buffer = Buffer.from(await file.arrayBuffer());

    // Security: Store uploaded files in private_uploads directory (OUTSIDE public folder)
    const uploadDir = path.join(process.cwd(), "private_uploads", "templates");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    // Return protected API route URL instead of direct static path
    const protectedUrl = `/api/ecert/template-image?file=${filename}`;
    return NextResponse.json({
      success: true,
      url: protectedUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading cert template image:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์ภาพ" }, { status: 500 });
  }
}
