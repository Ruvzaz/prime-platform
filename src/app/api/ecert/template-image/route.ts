import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
      return new NextResponse("File parameter is required", { status: 400 });
    }

    // Security: Strict path sanitization to prevent Path Traversal attacks (../)
    const cleanFileName = path.basename(fileName);

    // Search locations (Private storage first, then fallback for legacy public uploads)
    const locations = [
      path.join(process.cwd(), "private_uploads", "templates", cleanFileName),
      path.join(process.cwd(), "public", "uploads", "templates", cleanFileName),
    ];

    let filePath: string | null = null;
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        filePath = loc;
        break;
      }
    }

    if (!filePath) {
      return new NextResponse("Template image file not found", { status: 404 });
    }

    // Determine Content-Type based on extension
    const ext = path.extname(cleanFileName).toLowerCase();
    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    }

    const imageBuffer = fs.readFileSync(filePath);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Error serving cert template image:", error);
    return new NextResponse("Error serving image", { status: 500 });
  }
}
