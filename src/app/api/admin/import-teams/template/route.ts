import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Sample data rows
    const sampleData = [
      {
        "Challenge": "Junior",
        "Team Name": "CyberGuardians",
        "Organization": "โรงเรียนสวนกุหลาบวิทยาลัย",
        "Region": "กรุงเทพมหานครและปริมณฑล",
        "Role": "Leader",
        "Title": "นาย",
        "First Name": "สมชาย",
        "Last Name": "สายลับ",
        "Email": "somchai.j@example.com",
        "Username": "somchai_j",
        "Phone": "0812345678"
      },
      {
        "Challenge": "Junior",
        "Team Name": "CyberGuardians",
        "Organization": "โรงเรียนสวนกุหลาบวิทยาลัย",
        "Region": "กรุงเทพมหานครและปริมณฑล",
        "Role": "Member",
        "Title": "นาย",
        "First Name": "สมศักดิ์",
        "Last Name": "ใจดี",
        "Email": "somsak.r@example.com",
        "Username": "somsak_r",
        "Phone": "0823456789"
      },
      {
        "Challenge": "Senior",
        "Team Name": "WhiteHats",
        "Organization": "จุฬาลงกรณ์มหาวิทยาลัย",
        "Region": "กรุงเทพมหานครและปริมณฑล",
        "Role": "Leader",
        "Title": "นางสาว",
        "First Name": "กานดา",
        "Last Name": "พิทักษ์ไทย",
        "Email": "kanda.p@example.com",
        "Username": "kanda_p",
        "Phone": "0834567890"
      }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for readability
    worksheet["!cols"] = [
      { wch: 12 }, // Challenge
      { wch: 20 }, // Team Name
      { wch: 30 }, // Organization
      { wch: 32 }, // Region
      { wch: 10 }, // Role
      { wch: 10 }, // Title
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Email
      { wch: 15 }, // Username
      { wch: 15 }, // Phone
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teams & Members");

    // Buffer to Excel
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Disposition": `attachment; filename="import_teams_template.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Generate Template Error:", error);
    return new NextResponse("Failed to generate template", { status: 500 });
  }
}
