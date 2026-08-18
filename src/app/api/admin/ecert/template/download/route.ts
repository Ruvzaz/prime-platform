import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sampleData = [
      {
        "Email": "somchai.j@example.com",
        "isEligible": true,
        "Challenge": "Junior",
        "Title": "นาย",
        "First Name": "สมชาย",
        "Last Name": "สายลับ",
        "Full Name": "นาย สมชาย สายลับ",
        "Issue Date": "31 สิงหาคม 2569"
      },
      {
        "Email": "somsak.r@example.com",
        "isEligible": true,
        "Challenge": "Junior",
        "Title": "นาย",
        "First Name": "สมศักดิ์",
        "Last Name": "ใจดี",
        "Full Name": "นาย สมศักดิ์ ใจดี",
        "Issue Date": "31 สิงหาคม 2569"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet["!cols"] = [
      { wch: 25 }, // Email
      { wch: 12 }, // isEligible
      { wch: 12 }, // Challenge
      { wch: 10 }, // Title
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Full Name
      { wch: 20 }, // Issue Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "E-Cert Recipients");

    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Disposition": `attachment; filename="import_ecert_template.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Generate E-Cert Template Error:", error);
    return new NextResponse("Failed to generate template", { status: 500 });
  }
}
