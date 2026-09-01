import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveUserForCert } from "@/lib/certificate";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    const targetEmails = ["wisities@gmail.com", "wuttichai7734@gmail.com"];

    // 1. Navbar Visibility Test for Currently Logged-in User Session
    let currentSessionNavbarTest = null;
    if (session?.user) {
      const { resolvedUserId, userEmail, userName, certWhereClause } = await resolveUserForCert(session.user);
      const certCount = await prisma.certificate.count({
        where: certWhereClause,
      });
      const navbarWillShowMyCertificatesMenu = certCount > 0;

      currentSessionNavbarTest = {
        isLoggedIn: true,
        sessionUser: session.user,
        resolvedUser: {
          id: resolvedUserId,
          email: userEmail,
          name: userName,
        },
        certCount,
        navbarWillShowMyCertificatesMenu,
        statusMessage: navbarWillShowMyCertificatesMenu
          ? "✅ SUCCESS: Navbar WILL show 'MY CERTIFICATES' menu item for this logged-in session!"
          : "❌ FAIL: Navbar WILL NOT show 'MY CERTIFICATES' menu item (Cert count is 0).",
      };
    } else {
      currentSessionNavbarTest = {
        isLoggedIn: false,
        statusMessage: "ℹ️ No user session currently logged in on this browser request.",
      };
    }

    // 2. Navbar Visibility Test Suite for Target Users
    const targetNavbarTestSuite = [];
    for (const email of targetEmails) {
      const cleanEmail = email.toLowerCase().trim();
      const cleanUsername = cleanEmail.split("@")[0];

      // Find user in DB
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanEmail, mode: "insensitive" } },
            { username: { equals: cleanEmail, mode: "insensitive" } },
            { username: { equals: cleanUsername, mode: "insensitive" } },
          ],
        },
        select: { id: true, email: true, username: true, name: true },
      });

      if (!dbUser) {
        targetNavbarTestSuite.push({
          targetEmail: email,
          userFoundInDb: false,
          navbarWillShowMyCertificatesMenu: false,
          statusMessage: `❌ User "${email}" not found in database.`,
        });
        continue;
      }

      // Simulate Navbar query for this user
      const { certWhereClause } = await resolveUserForCert({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      });

      const certCount = await prisma.certificate.count({
        where: certWhereClause,
      });

      const certs = await prisma.certificate.findMany({
        where: certWhereClause,
        select: {
          certCode: true,
          recipientFullName: true,
          email: true,
          userId: true,
          status: true,
        },
      });

      const navbarWillShowMyCertificatesMenu = certCount > 0;

      targetNavbarTestSuite.push({
        targetEmail: email,
        userFoundInDb: true,
        userInfo: dbUser,
        certCount,
        navbarWillShowMyCertificatesMenu,
        matchedCertificates: certs,
        statusMessage: navbarWillShowMyCertificatesMenu
          ? `✅ SUCCESS: Navbar WILL SHOW 'MY CERTIFICATES' for ${dbUser.name || dbUser.email} (Found ${certCount} certs).`
          : `❌ FAIL: Navbar WILL NOT SHOW for ${dbUser.name || dbUser.email} (Cert count is 0).`,
      });
    }

    // 3. Raw Certificates in DB
    const rawCertsInDb = await prisma.certificate.findMany({
      select: {
        id: true,
        certCode: true,
        email: true,
        recipientFullName: true,
        userId: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      currentSessionNavbarTest,
      targetNavbarTestSuite,
      rawCertsInDb,
    });
  } catch (error: any) {
    console.error("Navbar Test Diagnostic API Error:", error);
    return NextResponse.json(
      { error: "Navbar diagnostic failed", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
