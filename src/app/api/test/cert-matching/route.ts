import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const targetEmails = ["wisities@gmail.com", "wuttichai7734@gmail.com"];

    // 1. Fetch Target Users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: targetEmails, mode: "insensitive" } },
          { username: { in: ["wisities", "wuttichai7734"], mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    // 2. Fetch All Active Certificates for Target Emails
    const certificates = await prisma.certificate.findMany({
      where: {
        OR: [
          { email: { in: targetEmails, mode: "insensitive" } },
          { email: { contains: "wisities", mode: "insensitive" } },
          { email: { contains: "wuttichai7734", mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: { id: true, email: true, username: true, name: true },
        },
        challenge: {
          select: { id: true, name: true },
        },
      },
    });

    // 3. Test Matching Results per User
    const testResults = [];
    let autoLinkedCount = 0;

    for (const u of users) {
      const userEmail = u.email?.toLowerCase().trim() || "";
      const userName = u.name?.trim() || "";
      const username = u.username?.trim() || "";
      const cleanUsername = userEmail && userEmail.includes("@") ? userEmail.split("@")[0] : userEmail;

      // Query as Navbar & Certificate Page do
      const matched = await prisma.certificate.findMany({
        where: {
          OR: [
            { userId: u.id },
            ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
            ...(cleanUsername ? [{ email: { contains: cleanUsername, mode: "insensitive" as const } }] : []),
            ...(username ? [{ email: { contains: username, mode: "insensitive" as const } }] : []),
            ...(userName ? [{ recipientFullName: { equals: userName, mode: "insensitive" as const } }] : []),
          ],
          status: "ACTIVE",
        },
      });

      // Auto-heal userId links if cert is unlinked or linked to wrong stub user
      for (const cert of matched) {
        if (cert.userId !== u.id) {
          await prisma.certificate.update({
            where: { id: cert.id },
            data: { userId: u.id, email: userEmail || cert.email },
          });
          autoLinkedCount++;
        }
      }

      testResults.push({
        user: {
          id: u.id,
          email: u.email,
          username: u.username,
          name: u.name,
        },
        matchedCertificatesCount: matched.length,
        matchedCertificates: matched.map((c) => ({
          certCode: c.certCode,
          recipientFullName: c.recipientFullName,
          email: c.email,
          userId: c.userId,
          status: c.status,
          challengeName: (c as any).challenge?.name,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalTargetUsersFound: users.length,
        totalCertificatesFoundInDb: certificates.length,
        autoLinkedCount,
      },
      usersFound: users,
      testResults,
      allCertificatesInDb: certificates,
    });
  } catch (error: any) {
    console.error("Test Cert Matching Error:", error);
    return NextResponse.json(
      { error: "Test execution failed", details: error.message },
      { status: 500 }
    );
  }
}
